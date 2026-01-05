package handlers

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// [USER] แจ้งฝากเงิน (แก้ไขจาก Supabase เป็น Local Storage)
func CreateDeposit(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	var userID uint
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else {
		userID = val.(uint)
	}

	amountStr := c.FormValue("amount")
	amount, _ := strconv.ParseFloat(amountStr, 64)
	if amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดฝากขั้นต่ำ 100 บาท"})
	}

	fileHeader, err := c.FormFile("slip")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบไฟล์สลิป"})
	}

	uploadDir := "./uploads"
	os.MkdirAll(uploadDir, 0755)

	fileName := fmt.Sprintf("slip_%d_%d_%s", userID, time.Now().Unix(), fileHeader.Filename)
	filePath := fmt.Sprintf("%s/%s", uploadDir, fileName)

	if err := c.SaveFile(fileHeader, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "บันทึกไฟล์ล้มเหลว"})
	}

	tx := models.Transaction{
		UserID:    userID,
		Amount:    amount,
		Type:      "deposit",
		Status:    "pending",
		SlipURL:   "/uploads/" + fileName, // Path สำหรับ Static Route
		CreatedAt: time.Now(),
	}

	database.DB.Create(&tx)
	return c.JSON(fiber.Map{"message": "แจ้งฝากสำเร็จ", "data": tx})
}

// [USER] แจ้งถอนเงิน
func CreateWithdraw(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	var userID uint
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	} else {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	type Request struct {
		Amount        float64 `json:"amount"`
		BankName      string  `json:"bank_name"`
		AccountNumber string  `json:"account_number"`
		AccountName   string  `json:"account_name"`
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

		newTx := models.Transaction{
			UserID:        userID,
			Amount:        body.Amount,
			Type:          "withdraw",
			Status:        "pending",
			BankName:      body.BankName,
			BankAccount:   body.AccountNumber,
			AccountName:   body.AccountName,
			BalanceBefore: user.Credit,
			BalanceAfter:  user.Credit - body.Amount,
			CreatedAt:     time.Now(),
		}

		if err := tx.Create(&newTx).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "ส่งคำขอถอนเงินแล้ว"})
	})
}

// [ADMIN] อนุมัติการฝาก (Approve Deposit)
func ApproveDeposit(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, txID).Error; err != nil {
			return err
		}

		if transaction.Status != "pending" || transaction.Type != "deposit" {
			return fmt.Errorf("รายการนี้ถูกดำเนินการไปแล้ว")
		}

		// 1. อัปเดตสถานะ Transaction
		tx.Model(&transaction).Update("status", "approved")

		// 2. เพิ่มเครดิตให้ลูกค้า
		if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
			Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "อนุมัติยอดฝากเรียบร้อย"})
	})
}

// [ADMIN] อนุมัติการถอน (Approve Withdraw)
func ApproveTransaction(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" {
			return c.Status(400).JSON(fiber.Map{"error": "ดำเนินการไปแล้ว"})
		}

		// ถ้าเป็นเงินฝาก ให้เพิ่มเครดิต
		if transaction.Type == "deposit" {
			tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				Update("credit", gorm.Expr("credit + ?", transaction.Amount))
		}

		transaction.Status = "approved"
		tx.Save(&transaction)

		return c.JSON(fiber.Map{"message": "อนุมัติสำเร็จ"})
	})
}

// [ADMIN] ปฏิเสธการถอนและคืนเงิน (Reject Withdraw)
func RejectWithdraw(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(dbTx *gorm.DB) error {
		var transaction models.Transaction
		if err := dbTx.First(&transaction, txID).Error; err != nil {
			return err
		}

		if transaction.Status != "pending" {
			return fmt.Errorf("รายการไม่อยู่ในสถานะที่รอการตรวจสอบ")
		}

		// คืนเงินให้ลูกค้า
		dbTx.Model(&models.User{}).Where("id = ?", transaction.UserID).
			Update("credit", gorm.Expr("credit + ?", transaction.Amount))

		transaction.Status = "rejected"
		dbTx.Save(&transaction)

		return c.JSON(fiber.Map{"message": "ปฏิเสธรายการและคืนเครดิตเรียบร้อย"})
	})
}
