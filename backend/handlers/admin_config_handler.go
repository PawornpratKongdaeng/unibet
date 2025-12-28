package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ดึงข้อมูลบัญชีล่าสุด (ใช้ ID 1 เป็นหลัก)
func GetAdminBank(c *fiber.Ctx) error {
	var bank models.AdminBank
	// ค้นหาข้อมูลแถวแรก ถ้าไม่มีให้สร้างข้อมูลเริ่มต้น
	database.DB.FirstOrCreate(&bank, models.AdminBank{ID: 1})
	return c.JSON(bank)
}

// อัปเดตข้อมูลบัญชีธนาคาร
func UpdateAdminBank(c *fiber.Ctx) error {
	var req models.AdminBank
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var bank models.AdminBank
	database.DB.First(&bank, 1)

	bank.BankName = req.BankName
	bank.AccountName = req.AccountName
	bank.AccountNumber = req.AccountNumber

	if err := database.DB.Save(&bank).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตบัญชีธนาคารสำเร็จ", "data": bank})
}
func GetPendingTransactions(c *fiber.Ctx) error {
	var txs []models.Transaction
	database.DB.Preload("User").Where("status = ?", "pending").Order("created_at asc").Find(&txs)
	return c.JSON(txs)
}

// 2. GetTransactionHistory - ดึงประวัติทั้งหมด
func GetTransactionHistory(c *fiber.Ctx) error {
	var txs []models.Transaction
	// ใช้ Preload("User") เพื่อให้ Frontend เข้าถึง tx.User.Username ได้
	database.DB.Preload("User").Order("id desc").Limit(100).Find(&txs)
	return c.JSON(txs)
}

// 3. GetFinanceSummary - สรุปยอดเงิน
func GetFinanceSummary(c *fiber.Ctx) error {
	var summary struct {
		TotalDeposit  float64 `json:"total_deposit"`
		TotalWithdraw float64 `json:"total_withdraw"`
	}

	// ใช้ COALESCE เพื่อบังคับให้เป็น 0 เสมอหากไม่พบข้อมูล
	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "deposit", "success").
		Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalDeposit)

	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "withdraw", "success").
		Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalWithdraw)

	return c.JSON(summary)
}

// 4. UpdateUserStatus - แบนหรือปลดแบน User
func UpdateUserStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	type Request struct {
		Status string `json:"status"` // 'active' หรือ 'banned'
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Update failed"})
	}

	return c.JSON(fiber.Map{"message": "User status updated"})
}

// 5. ApproveTransaction - อนุมัติเงิน (ใช้ DB Transaction เพื่อความปลอดภัย)
func ApproveTransaction(c *fiber.Ctx) error {
	id := c.Params("id")

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, id).Error; err != nil {
			return err
		}
		if transaction.Status != "pending" {
			return fiber.NewError(400, "รายการนี้ถูกดำเนินการไปแล้ว")
		}

		// ถ้าเป็น "ฝากเงิน" (Deposit) -> ต้องบวกเงินให้ User
		if transaction.Type == "deposit" {
			if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				UpdateColumn("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
				return err
			}
		}
		// หมายเหตุ: ถ้าเป็น "ถอนเงิน" ปกติเราจะตัดเงิน User ตั้งแต่ตอนกดแจ้งถอน (Pending)
		// ดังนั้นตอน Approve แค่เปลี่ยนสถานะเป็น approved ก็พอ

		return tx.Model(&transaction).Update("status", "approved").Error
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "อนุมัติรายการเรียบร้อย"})
}

// 6. RejectTransaction - ปฏิเสธรายการ
func RejectTransaction(c *fiber.Ctx) error {
	id := c.Params("id")

	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, id).Error; err != nil {
			return err
		}
		if transaction.Status != "pending" {
			return fiber.NewError(400, "รายการนี้ถูกดำเนินการไปแล้ว")
		}

		// ถ้าเป็น "ถอนเงิน" (Withdraw) แล้วแอดมิน Reject -> ต้องคืนเงินให้ User
		if transaction.Type == "withdraw" {
			if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				UpdateColumn("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
				return err
			}
		}

		return tx.Model(&transaction).Update("status", "rejected").Error
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(fiber.Map{"message": "ปฏิเสธรายการเรียบร้อย"})
}
