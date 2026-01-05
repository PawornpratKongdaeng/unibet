package handlers

import (
	"fmt"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DepositRequest struct {
	Amount  float64 `json:"amount"`
	SlipURL string  `json:"slipUrl"` // ต้องสะกด camelCase ให้ตรงกับที่ React ส่งมา
}

// 2. แก้ไขฟังก์ชัน CreateDeposit
func CreateDeposit(c *fiber.Ctx) error {
	// 1. ดึง User ID จาก Middleware
	val := c.Locals("user_id")
	var userID uint
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	}

	// 2. รับค่า JSON จาก Frontend
	var req DepositRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูล JSON ไม่ถูกต้อง"})
	}

	// 3. ตรวจสอบข้อมูล
	if req.Amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดฝากขั้นต่ำ 100 บาท"})
	}
	if req.SlipURL == "" {
		return c.Status(400).JSON(fiber.Map{"error": "ไม่พบ URL ของสลิป"})
	}

	// 4. บันทึกลง Database (ตาราง Transaction)
	tx := models.Transaction{
		UserID:  userID,
		Amount:  req.Amount,
		Type:    "deposit",
		Status:  "pending",
		SlipURL: req.SlipURL, // เก็บ URL จาก Supabase ลงใน DB
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	return c.JSON(fiber.Map{
		"message": "แจ้งฝากสำเร็จ รอการตรวจสอบ",
		"data":    tx,
	})
}

// [USER] แจ้งถอนเงิน (ใหม่!)
func CreateWithdraw(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	var userID uint
	// ตรวจสอบ type ของ user_id ให้ครอบคลุม
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	} else {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// --- ส่วนที่แก้ไข: เพิ่มการรับค่าธนาคาร ---
	type Request struct {
		Amount        float64 `json:"amount"`
		BankName      string  `json:"bank_name"`      // เพิ่ม
		AccountNumber string  `json:"account_number"` // เพิ่ม (ให้ตรงกับที่ React ส่งมา)
		AccountName   string  `json:"account_name"`   // เพิ่ม
	}

	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if body.Amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ถอนขั้นต่ำ 100 บาท"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return err
		}

		if user.Credit < body.Amount {
			return fmt.Errorf("ยอดเงินไม่เพียงพอ")
		}

		// หักเครดิต
		if err := tx.Model(&user).Update("credit", gorm.Expr("credit - ?", body.Amount)).Error; err != nil {
			return err
		}

		// --- ส่วนที่แก้ไข: บันทึกข้อมูลธนาคารลง Transaction ---
		newTx := models.Transaction{
			UserID:        userID,
			Amount:        body.Amount,
			Type:          "withdraw",
			Status:        "pending",
			BankName:      body.BankName,      // บันทึกชื่อธนาคาร
			BankAccount:   body.AccountNumber, // บันทึกเลขบัญชี (mapping account_number -> BankAccount)
			AccountName:   body.AccountName,   // บันทึกชื่อบัญชี
			BalanceBefore: user.Credit,
			BalanceAfter:  user.Credit - body.Amount,
		}

		if err := tx.Create(&newTx).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "ส่งคำขอถอนเงินแล้ว"})
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
		if err := dbTx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" || transaction.Type != "withdraw" {
			return c.Status(400).JSON(fiber.Map{"error": "รายการนี้ถูกดำเนินการไปแล้ว"})
		}

		// ✅ แค่อัปเดตเป็น success (เพราะเงินถูกหักไปแล้วตั้งแต่ตอน CreateWithdraw)
		transaction.Status = "approved" // หรือ "success" ตามที่คุณใช้ใน UI
		if err := dbTx.Save(&transaction).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "อนุมัติการถอนเงินเรียบร้อย"})
	})
}
func RejectWithdraw(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(dbTx *gorm.DB) error {
		var transaction models.Transaction
		dbTx.First(&transaction, txID)

		if transaction.Status != "pending" {
			return fmt.Errorf("รายการไม่อยู่ในสถานะที่รอการตรวจสอบ")
		}

		// 1. คืนเงินให้ลูกค้า
		if err := dbTx.Model(&models.User{}).Where("id = ?", transaction.UserID).
			Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
			return err
		}

		// 2. อัปเดตสถานะเป็น rejected
		transaction.Status = "rejected"
		dbTx.Save(&transaction)

		return c.JSON(fiber.Map{"message": "ปฏิเสธรายการและคืนเครดิตเรียบร้อย"})
	})
}
