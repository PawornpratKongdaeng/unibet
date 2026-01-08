package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type FinanceSummaryResponse struct {
	TotalDeposit  float64 `json:"total_deposit"`
	TotalWithdraw float64 `json:"total_withdraw"`
}

// ดึงข้อมูลบัญชีล่าสุด (ใช้ ID 1 เป็นหลัก)
func GetAdminBank(c *fiber.Ctx) error {
	var bank models.BankAccount
	// GORM จะไปหาที่ตาราง bank_accounts อัตโนมัติ
	if err := database.DB.First(&bank, 1).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ยังไม่ได้ตั้งค่าบัญชีธนาคาร"})
	}
	return c.JSON(bank)
}

// อัปเดตข้อมูลบัญชีธนาคาร
func UpdateAdminBank(c *fiber.Ctx) error {
	var req models.BankAccount
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var bank models.BankAccount
	// 1. ตรวจสอบว่ามี ID 1 อยู่ในระบบไหม
	result := database.DB.First(&bank, 1)

	// 2. อัปเดตข้อมูลจาก Request
	bank.ID = 1 // ล็อค ID ไว้ที่ 1 เสมอ
	bank.BankName = req.BankName
	bank.AccountName = req.AccountName
	bank.AccountNumber = req.AccountNumber

	// 3. ถ้าไม่พบ (ErrRecordNotFound) ให้ใช้ Create, ถ้าพบให้ใช้ Save (Update)
	if result.Error != nil {
		if err := database.DB.Create(&bank).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถสร้างข้อมูลได้"})
		}
	} else {
		if err := database.DB.Save(&bank).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
		}
	}

	return c.JSON(fiber.Map{"message": "อัปเดตบัญชีธนาคารสำเร็จ", "data": bank})
}
func GetPendingTransactions(c *fiber.Ctx) error {
	var transactions []models.Transaction

	// ❌ ผิด: .Preload("Username") -> Username เป็น string ไม่ใช่ struct relationship
	// ✅ ถูก: .Preload("User") -> ต้องอ้างอิงชื่อ Field ใน struct Transaction
	result := database.DB.Preload("User").Where("status = ?", "pending").Find(&transactions)

	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลล้มเหลว"})
	}
	return c.JSON(transactions)
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
	var summary FinanceSummaryResponse

	// 1. คำนวณยอดฝากทั้งหมดที่อนุมัติแล้ว
	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "deposit", "approved").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.TotalDeposit)

	// 2. คำนวณยอดถอนทั้งหมดที่อนุมัติแล้ว
	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "withdraw", "approved").
		Select("COALESCE(SUM(amount), 0)").
		Scan(&summary.TotalWithdraw)

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
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" {
			return c.Status(400).JSON(fiber.Map{"error": "ดำเนินการไปแล้ว"})
		}

		// กรณีเป็น "เงินฝาก": ต้องบวกเงินเข้าเครดิตลูกค้า
		if transaction.Type == "deposit" {
			if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
				return err
			}
		}

		// กรณีเป็น "เงินถอน": เครดิตถูกหักไปตั้งแต่ตอนแจ้งถอนแล้ว
		// ดังนั้นตอน Approve แค่เปลี่ยนสถานะก็พอ (ไม่ต้องทำอะไรเพิ่ม)

		transaction.Status = "approved"
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "อนุมัติรายการสำเร็จ"})
	})
}

// 6. RejectTransaction - ปฏิเสธรายการ
func RejectTransaction(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		tx.First(&transaction, txID)

		if transaction.Status != "pending" {
			return c.Status(400).JSON(fiber.Map{"error": "ดำเนินการไปแล้ว"})
		}

		// ถ้าเป็นการถอน แล้วโดนปฏิเสธ ต้องคืนเครดิตให้ลูกค้า
		if transaction.Type == "withdraw" {
			tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				Update("credit", gorm.Expr("credit + ?", transaction.Amount))
		}

		transaction.Status = "rejected"
		tx.Save(&transaction)

		return c.JSON(fiber.Map{"message": "ปฏิเสธรายการเรียบร้อย"})
	})
}

func RequestWithdraw(c *fiber.Ctx) error {
	// 1. รับค่าจาก Request
	type WithdrawReq struct {
		Amount float64 `json:"amount"`
	}
	var req WithdrawReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 2. ดึง User ID จาก Middleware JWT
	userID := c.Locals("user_id").(uint)

	// 3. เริ่ม Transaction ฐานข้อมูล (DB Transaction)
	// เพื่อให้มั่นใจว่าถ้าตัดเงินผ่าน ต้องบันทึกรายการสำเร็จด้วย
	tx := database.DB.Begin()

	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
	}

	// 4. ตรวจสอบเงื่อนไข (ขั้นต่ำ 100 และ เครดิตต้องพอ)
	if req.Amount < 100 {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"error": "ถอนขั้นต่ำ 100 บาท"})
	}
	if user.Credit < req.Amount {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเงินคงเหลือไม่เพียงพอ"})
	}

	// 5. ตัดเครดิตผู้ใช้งานทันที
	user.Credit -= req.Amount
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "ตัดเครดิตล้มเหลว"})
	}

	// 6. บันทึกรายการถอน (Status: pending)
	newTx := models.Transaction{
		UserID: userID,
		Amount: req.Amount,
		Type:   "withdraw",
		Status: "pending",
	}
	if err := tx.Create(&newTx).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "บันทึกรายการล้มเหลว"})
	}

	// Commit รายการทั้งหมด
	tx.Commit()

	return c.JSON(fiber.Map{
		"message":    "ส่งคำขอถอนเงินสำเร็จ",
		"new_credit": user.Credit,
	})
}

// ในไฟล์ handlers/admin_handler.go
func GetUserTransactions(c *fiber.Ctx) error {
	userID := c.Params("id")

	type TransactionWithMatch struct {
		models.Transaction
		HomeTeam string `json:"home_team"` // From LEFT JOIN
		AwayTeam string `json:"away_team"` // From LEFT JOIN
	}

	var results []TransactionWithMatch

	// Use LEFT JOIN so we still get Deposits/Withdraws even if there is no match
	err := database.DB.Table("transactions").
		Select("transactions.*, bet_slips.home_team, bet_slips.away_team").
		Joins("LEFT JOIN bet_slips ON transactions.id = bet_slips.id").
		Where("transactions.user_id = ?", userID).
		Order("transactions.created_at desc").
		Scan(&results).Error

	if err != nil {
		return c.Status(200).JSON([]interface{}{})
	}

	return c.Status(200).JSON(results)
}

// --- ส่วนของดึงประวัติการเดิมพัน (Bet History) ---
func GetUserBets(c *fiber.Ctx) error {
	userID := c.Params("id")
	var bets []models.BetSlip

	// ดึงจากตาราง bet_slips โดยตรง
	err := database.DB.Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&bets).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลเดิมพันได้"})
	}

	return c.Status(200).JSON(bets)
}
