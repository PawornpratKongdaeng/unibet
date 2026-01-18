package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ==========================================
// 1. หมวดการเงิน (Finance & Bank)
// ==========================================

type FinanceSummaryResponse struct {
	TotalDeposit  float64 `json:"total_deposit"`
	TotalWithdraw float64 `json:"total_withdraw"`
}

// GetAdminBank: ดึงข้อมูลบัญชีธนาคารของเว็บ (ใช้ ID 1)
func GetAdminBank(c *fiber.Ctx) error {
	var bank models.BankAccount
	if err := database.DB.First(&bank, 1).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ยังไม่ได้ตั้งค่าบัญชีธนาคาร"})
	}
	return c.JSON(bank)
}

// UpdateAdminBank: อัปเดตบัญชีธนาคารเว็บ
func UpdateAdminBank(c *fiber.Ctx) error {
	var req models.BankAccount
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var bank models.BankAccount
	result := database.DB.First(&bank, 1)

	bank.ID = 1
	bank.BankName = req.BankName
	bank.AccountName = req.AccountName
	bank.AccountNumber = req.AccountNumber

	if result.Error != nil {
		if err := database.DB.Create(&bank).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "สร้างข้อมูลไม่สำเร็จ"})
		}
	} else {
		if err := database.DB.Save(&bank).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "อัปเดตข้อมูลไม่สำเร็จ"})
		}
	}

	return c.JSON(fiber.Map{"message": "อัปเดตบัญชีธนาคารสำเร็จ", "data": bank})
}

// GetFinanceSummary: สรุปยอดเงินฝาก-ถอนทั้งหมด
func GetFinanceSummary(c *fiber.Ctx) error {
	var summary FinanceSummaryResponse

	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "deposit", "approved").
		Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalDeposit)

	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "withdraw", "approved").
		Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalWithdraw)

	return c.JSON(summary)
}

// ==========================================
// 2. หมวดจัดการธุรกรรม (Transactions)
// ==========================================

// GetPendingTransactions: ดึงรายการรอตรวจสอบ (ฝาก/ถอน)
func GetPendingTransactions(c *fiber.Ctx) error {
	var transactions []models.Transaction
	// Preload User เพื่อให้เห็นชื่อคนทำรายการ
	result := database.DB.Preload("User").Where("status = ?", "pending").Order("created_at desc").Find(&transactions)

	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลล้มเหลว"})
	}
	return c.JSON(transactions)
}

// GetTransactionHistory: ดึงประวัติธุรกรรมทั้งหมด
func GetTransactionHistory(c *fiber.Ctx) error {
	var txs []models.Transaction
	database.DB.Preload("User").Order("id desc").Limit(100).Find(&txs)
	return c.JSON(txs)
}

// ApproveTransaction: อนุมัติ (ฝาก=เติมเงิน, ถอน=เปลี่ยนสถานะ)
func ApproveTransaction(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" {
			return c.Status(400).JSON(fiber.Map{"error": "รายการนี้ดำเนินการไปแล้ว"})
		}

		// ฝากเงิน: เพิ่มเครดิต
		if transaction.Type == "deposit" {
			if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
				return err
			}
		}
		// ถอนเงิน: ตัดเครดิตไปแล้วตอนแจ้งถอน แค่อัปเดตสถานะ

		transaction.Status = "approved"
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}
		return c.JSON(fiber.Map{"message": "อนุมัติรายการสำเร็จ"})
	})
}

// RejectTransaction: ปฏิเสธ (ถ้าถอนต้องคืนเงิน)
func RejectTransaction(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var transaction models.Transaction
		if err := tx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" {
			return c.Status(400).JSON(fiber.Map{"error": "รายการนี้ดำเนินการไปแล้ว"})
		}

		// ถ้าเป็นถอนเงิน แล้วปฏิเสธ -> ต้องคืนเงินลูกค้า
		if transaction.Type == "withdraw" {
			if err := tx.Model(&models.User{}).Where("id = ?", transaction.UserID).
				Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
				return err
			}
		}

		transaction.Status = "rejected"
		if err := tx.Save(&transaction).Error; err != nil {
			return err
		}
		return c.JSON(fiber.Map{"message": "ปฏิเสธรายการเรียบร้อย"})
	})
}

// RequestWithdraw: User แจ้งถอนเงิน
func RequestWithdraw(c *fiber.Ctx) error {
	type WithdrawReq struct {
		Amount float64 `json:"amount"`
	}
	var req WithdrawReq
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// ดึง UserID จาก JWT Middleware
	userIDInterface := c.Locals("user_id")
	if userIDInterface == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// แปลง Interface เป็น uint (ปรับตาม JWT Middleware ของคุณ)
	var userID uint
	switch v := userIDInterface.(type) {
	case float64:
		userID = uint(v)
	case int:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(500).JSON(fiber.Map{"error": "User ID Error"})
	}

	tx := database.DB.Begin()

	var user models.User
	if err := tx.First(&user, userID).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
	}

	if req.Amount < 100 {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"error": "ถอนขั้นต่ำ 100 บาท"})
	}
	if user.Credit < req.Amount {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"error": "เครดิตไม่เพียงพอ"})
	}

	// ตัดเครดิตทันที
	user.Credit -= req.Amount
	if err := tx.Save(&user).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "ตัดเครดิตล้มเหลว"})
	}

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

	tx.Commit()
	return c.JSON(fiber.Map{"message": "แจ้งถอนเงินสำเร็จ", "new_credit": user.Credit})
}

// ==========================================
// 3. หมวดจัดการ User (Admin Manage Users)
// ==========================================

// UpdateUserStatus: แบน/ปลดแบน
func UpdateUserStatus(c *fiber.Ctx) error {
	id := c.Params("id")
	type Request struct {
		Status string `json:"status"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}
	if err := database.DB.Model(&models.User{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Update failed"})
	}
	return c.JSON(fiber.Map{"message": "สถานะผู้ใช้งานอัปเดตแล้ว"})
}

// UpdatePassword: เปลี่ยนรหัสผ่านให้ User
func UpdatePassword(c *fiber.Ctx) error {
	id := c.Params("id")
	type Request struct {
		Password string `json:"password"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err := database.DB.Model(&models.User{}).Where("id = ?", id).Update("password", string(hashedPassword)).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "เปลี่ยนรหัสผ่านไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{"message": "เปลี่ยนรหัสผ่านสำเร็จ"})
}

// ToggleUserLock: ล็อค/ปลดล็อค (แบบสลับ)
func ToggleUserLock(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}
	newStatus := "locked"
	if user.Status == "locked" {
		newStatus = "active"
	}
	database.DB.Model(&user).Update("status", newStatus)
	return c.JSON(fiber.Map{"message": "Status toggled", "status": newStatus})
}

// ==========================================
// 4. หมวดรายงานบอลและการเดิมพัน (Match & Exposure)
// ==========================================

// Helper Struct สำหรับ Query ยอดเงิน
type ExposureStat struct {
	MatchID string
	Pick    string
	Total   float64
}

// Struct ตอบกลับ Frontend (MatchSummary)
type MatchSummaryResponse struct {
	MatchID    string    `json:"match_id"`
	HomeTeam   string    `json:"home_team"`
	AwayTeam   string    `json:"away_team"`
	StartTime  time.Time `json:"start_time"`
	TotalHome  float64   `json:"total_home"`
	TotalAway  float64   `json:"total_away"`
	TotalOver  float64   `json:"total_over"`
	TotalUnder float64   `json:"total_under"`
	TotalEven  float64   `json:"total_even"`
}

// GetMatchesSummary: (Admin Exposure) ดูยอดรวมการแทงแยกตามคู่
// รวม Logic ที่ถูกต้องที่สุด ใช้แทน GetExposure/GetExposureReport เดิม
// GetMatchesSummary: (Admin Exposure) ดูยอดรวมการแทงแยกตามคู่
// GetMatchesSummary: (Admin Exposure) - DEBUG VERSION
// GetMatchesSummary: (Admin Exposure) - FINAL FIX
func GetMatchesSummary(c *fiber.Ctx) error {
	// 1. ดึงแมตช์
	dateStr := c.Query("date")
	query := database.DB.Model(&models.Match{})

	// ถ้ามีการส่งวันที่มา ให้กรอง (ถ้าไม่มี ให้ดึงหมดเพื่อทดสอบ)
	if dateStr != "" {
		// ลองปิดบรรทัดนี้ชั่วคราวถ้าอยากเห็นข้อมูลทั้งหมดโดยไม่สนวันที่
		query = query.Where("DATE(start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Bangkok') = ?", dateStr)
	}

	var matches []models.Match
	if err := query.Find(&matches).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลแมตช์ไม่ได้"})
	}

	// 2. Query รวมยอดเงิน (เอาเงื่อนไข Status ออกก่อน เพื่อดูว่ามีบิลไหม)
	var stats []ExposureStat
	err := database.DB.Table("bet_slips").
		Select("match_id, pick, SUM(amount) as total").
		// Where("LOWER(status) = ?", "pending").  <-- ปิดบรรทัดนี้ก่อน เพื่อทดสอบว่าบิลสถานะอื่นเข้าไหม
		Group("match_id, pick").
		Scan(&stats).Error

	if err != nil {
		fmt.Println("Error query stats:", err)
	}

	// --- 🕵️‍♂️ ส่วน DEBUG (ดู Log ใน Terminal) ---
	fmt.Println("\n================ DEBUG DATA ================")
	fmt.Printf("1. จำนวนแมตช์ที่เจอ: %d คู่ (Date: %s)\n", len(matches), dateStr)
	if len(matches) > 0 {
		fmt.Printf("   ตัวอย่าง Match ID ในตาราง Match: '%v' (Type: %T)\n", matches[0].MatchID, matches[0].MatchID)
	}

	fmt.Printf("2. จำนวนกลุ่มบิลที่เจอ: %d กลุ่ม\n", len(stats))
	if len(stats) > 0 {
		fmt.Printf("   ตัวอย่าง Match ID ในบิล (bet_slips): '%v'\n", stats[0].MatchID)
		fmt.Printf("   ตัวอย่าง Pick (หน้าที่แทง): '%v'\n", stats[0].Pick)
	} else {
		fmt.Println("   ❌ ไม่เจอบิลใน bet_slips เลย! (เช็คชื่อตาราง หรือ ข้อมูลใน DB)")
	}
	fmt.Println("============================================")
	// ---------------------------------------------

	// 3. Mapping
	summaryMap := make(map[string]*MatchSummaryResponse)

	// สร้าง Map จาก Matches
	for _, m := range matches {
		cleanID := strings.TrimSpace(fmt.Sprintf("%v", m.MatchID))
		summaryMap[cleanID] = &MatchSummaryResponse{
			MatchID:   m.MatchID,
			HomeTeam:  m.HomeTeam,
			AwayTeam:  m.AwayTeam,
			StartTime: m.StartTime,
		}
	}

	// เอายอดเงินหยอดใส่
	matchedCount := 0
	for _, s := range stats {
		statMatchID := strings.TrimSpace(s.MatchID)

		// แปลง Pick เป็นตัวเล็กหมด เพื่อให้เทียบง่าย
		pick := strings.ToLower(strings.TrimSpace(s.Pick))

		if entry, exists := summaryMap[statMatchID]; exists {
			matchedCount++
			// Logic รวมยอด (เพิ่ม Keyword ให้ครอบคลุมมากขึ้น)
			if pick == "home" || pick == "1" || strings.Contains(pick, "home") {
				entry.TotalHome += s.Total
			} else if pick == "away" || pick == "2" || strings.Contains(pick, "away") {
				entry.TotalAway += s.Total
			} else if strings.Contains(pick, "over") || strings.Contains(pick, "up") || strings.Contains(pick, "high") { // เพิ่ม up/high
				entry.TotalOver += s.Total
			} else if strings.Contains(pick, "under") || strings.Contains(pick, "down") || strings.Contains(pick, "low") { // เพิ่ม down/low
				entry.TotalUnder += s.Total
			} else {
				entry.TotalEven += s.Total // ที่เหลือโยนลง Even/Others
			}
		} else {
			// เปิดดูว่ามี ID ไหนบ้างที่จับคู่ไม่ได้
			// fmt.Printf("Unmatched Bet ID: %s (หาไม่เจอในตาราง Match)\n", statMatchID)
		}
	}

	fmt.Printf("3. สรุป: จับคู่บิลกับแมตช์ได้ทั้งหมด %d รายการ\n\n", matchedCount)

	var response []MatchSummaryResponse
	for _, v := range summaryMap {
		response = append(response, *v)
	}

	return c.JSON(response)
}

// GetUserBetsAdmin: (Admin User Detail) ดูบิลรายคนสำหรับปุ่ม DETAIL
// รวม GetUserBets/History ไว้ที่นี่ตัวเดียว
func GetUserBetsAdmin(c *fiber.Ctx) error {
	userID := c.Params("id")

	var betslips []models.Betslip

	// Preload "Items" เพื่อให้ Frontend เห็นรายละเอียดว่าแทงคู่ไหนบ้าง
	// Preload "Items.Match" ถ้า model รองรับ เพื่อให้เห็นชื่อทีม (ถ้าไม่มีก็ลบ .Match ออก)
	err := database.DB.
		Preload("Items").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&betslips).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงประวัติการแทงไม่สำเร็จ"})
	}

	// ถ้าไม่มีข้อมูล ให้ส่ง array ว่างกลับไป (Frontend จะได้ไม่พัง)
	if betslips == nil {
		betslips = []models.Betslip{}
	}

	return c.JSON(fiber.Map{
		"status":  "success",
		"user_id": userID,
		"data":    betslips,
	})
}
func GetUserTransactions(c *fiber.Ctx) error {
	userID := c.Params("id")
	var txs []models.Transaction

	// ดึง Transaction ของ User คนนี้ เรียงจากใหม่ไปเก่า
	if err := database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&txs).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลการเงินไม่สำเร็จ"})
	}

	// ถ้าไม่มีข้อมูล ให้ส่ง array ว่างกลับไป
	if txs == nil {
		txs = []models.Transaction{}
	}

	return c.JSON(txs)
}
