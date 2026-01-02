package handlers

import (
	"fmt"
	"os"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// [USER] แจ้งฝากเงิน
func CreateDeposit(c *fiber.Ctx) error {
	// 1. ดึง User ID จาก Middleware (ตรวจสอบว่าเป็น float64 หรือ uint ตามที่เก็บใน Token)
	val := c.Locals("user_id")
	var userID uint
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	}

	// 2. รับค่าจำนวนเงินจาก FormValue (เพราะส่งเป็น FormData)
	amountStr := c.FormValue("amount")
	var amount float64
	fmt.Sscanf(amountStr, "%f", &amount)

	if amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดฝากขั้นต่ำ 100 บาท"})
	}

	// 3. รับไฟล์รูปสลิป
	file, err := c.FormFile("slip")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบสลิปโอนเงิน"})
	}

	// 4. บันทึกไฟล์ลงเครื่อง (โฟลเดอร์ uploads)
	// สร้างชื่อไฟล์ใหม่: user_ID_timestamp.jpg
	fileName := fmt.Sprintf("%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	folderPath := "./uploads"

	// ตรวจสอบ/สร้างโฟลเดอร์ถ้ายังไม่มี
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		os.Mkdir(folderPath, os.ModePerm)
	}

	filePath := fmt.Sprintf("%s/%s", folderPath, fileName)
	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถบันทึกไฟล์รูปภาพได้"})
	}

	// 5. บันทึกลง Database (ตาราง Transaction)
	tx := models.Transaction{
		UserID:  userID,
		Amount:  amount,
		Type:    "deposit",
		Status:  "pending",
		SlipURL: "/uploads/" + fileName, // เก็บ Path ไว้ไปเปิดดูใน Admin
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	return c.JSON(fiber.Map{"message": "แจ้งฝากสำเร็จ รอการตรวจสอบ"})
}

// [USER] แจ้งถอนเงิน (ใหม่!)
func CreateWithdraw(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	type Request struct {
		Amount float64 `json:"amount"`
	}
	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return err
		}

		// 1. เช็คว่าเครดิตพอถอนไหม
		if user.Credit < body.Amount || body.Amount <= 0 {
			return fmt.Errorf("ยอดเงินไม่เพียงพอหรือจำนวนเงินไม่ถูกต้อง")
		}

		// 2. หักเครดิตทันที (Hold ไว้) เพื่อป้องกันการนำเงินไปแทงซ้ำระหว่างรอถอน
		if err := tx.Model(&user).Update("credit", gorm.Expr("credit - ?", body.Amount)).Error; err != nil {
			return err
		}

		// 3. สร้างรายการ Transaction
		newTx := models.Transaction{
			UserID: userID,
			Amount: body.Amount,
			Type:   "withdraw",
			Status: "pending",
		}
		return tx.Create(&newTx).Error
	})
}

// [ADMIN] กดยืนยันยอดฝาก (Approve Deposit)
func ApproveDeposit(c *fiber.Ctx) error {
	requestID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var req models.TopupRequest
		if err := tx.First(&req, requestID).Error; err != nil {
			return err
		}

		if req.Status != "pending" {
			return fmt.Errorf("รายการนี้ถูกดำเนินการไปแล้ว")
		}

		// 1. อัปเดตสถานะคำขอ
		tx.Model(&req).Update("status", "approved")

		// 2. เพิ่มเครดิตให้ลูกค้า
		var user models.User
		tx.First(&user, req.UserID)
		tx.Model(&user).Update("credit", user.Credit+req.Amount)

		// 3. บันทึก Transaction Log
		tx.Create(&models.Transaction{
			UserID: req.UserID,
			Amount: req.Amount,
			Type:   "deposit",
			Status: "success",
		})

		return nil
	})
}

// [ADMIN] กดยืนยันยอดถอน (Approve Withdraw)
func ApproveWithdraw(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(dbTx *gorm.DB) error {
		var transaction models.Transaction
		dbTx.First(&transaction, txID)

		if transaction.Status != "pending" || transaction.Type != "withdraw" {
			return c.Status(400).JSON(fiber.Map{"error": "รายการไม่ถูกต้อง"})
		}

		var user models.User
		dbTx.First(&user, transaction.UserID)

		if user.Credit < transaction.Amount {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตลูกค้าไม่พอสำหรับรายการนี้"})
		}

		// หักเงินและอัปเดตสถานะ
		transaction.BalanceBefore = user.Credit
		transaction.BalanceAfter = user.Credit - transaction.Amount
		transaction.Status = "success"

		dbTx.Save(&transaction)
		dbTx.Model(&user).Update("credit", gorm.Expr("credit - ?", transaction.Amount))

		return c.JSON(fiber.Map{"message": "อนุมัติการถอนเงินเรียบร้อย"})
	})
}
