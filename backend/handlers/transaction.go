package handlers

import (
	"fmt"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// [USER] แจ้งฝากเงิน
func CreateDeposit(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(float64)

	type Request struct {
		Amount   float64 `json:"amount" validate:"required,gt=0"`
		BankName string  `json:"bank_name" validate:"required"`
	}

	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	tx := models.Transaction{
		UserID:   uint(userID),
		Amount:   body.Amount,
		BankName: body.BankName,
		Type:     "deposit",
		Status:   "pending",
	}

	database.DB.Create(&tx)
	return c.JSON(fiber.Map{"message": "แจ้งฝากสำเร็จ รอการอนุมัติ"})
}

// [USER] แจ้งถอนเงิน (ใหม่!)
func CreateWithdraw(c *fiber.Ctx) error {
	userID := uint(c.Locals("user_id").(float64))

	var user models.User
	database.DB.First(&user, userID)

	type Request struct {
		Amount float64 `json:"amount"`
	}
	var body Request
	c.BodyParser(&body)

	// 1. เช็คว่าเครดิตพอถอนไหม
	if user.Credit < body.Amount {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเงินคงเหลือไม่เพียงพอ"})
	}

	// 2. หักเครดิตทันที (แล้วไปคืนถ้าแอดมินปฏิเสธ) หรือจะแค่สร้างรายการไว้รออนุมัติก็ได้
	// ในที่นี้เลือกสร้างรายการ "Pending" ไว้ก่อน
	tx := models.Transaction{
		UserID:      userID,
		Amount:      body.Amount,
		BankName:    user.BankName,
		BankAccount: user.BankAccount,
		Type:        "withdraw",
		Status:      "pending",
	}

	database.DB.Create(&tx)
	return c.JSON(fiber.Map{"message": "แจ้งถอนเงินสำเร็จ รอเจ้าหน้าที่ตรวจสอบและโอนเงิน"})
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
