package handlers

import (
	"fmt"
	"strconv"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// 1. โครงสร้างรับข้อมูลจาก Frontend
type PlaceBetRequest struct {
	MatchID  string  `json:"match_id"`
	HomeTeam string  `json:"home_team"`
	AwayTeam string  `json:"away_team"`
	HomeLogo string  `json:"home_logo"`
	AwayLogo string  `json:"away_logo"`
	Pick     string  `json:"pick"` // "home", "away"
	Odds     float64 `json:"odds"`
	Amount   float64 `json:"amount"`
	BetType  string  `json:"type"` // "HDP", "OU"
	Hdp      string  `json:"hdp"`  // รับเป็น string เช่น "0.5"
}

// 2. ฟังก์ชันวางเดิมพัน
func PlaceBet(c *fiber.Ctx) error {
	// ดึง userID จาก Middleware
	var userID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}

	var req PlaceBetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลการส่งค่าไม่ถูกต้อง"})
	}

	// ตรวจสอบยอดเงินเบื้องต้น
	if req.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเดิมพันต้องมากกว่า 0"})
	}

	// --- [จุดแก้ไขสำคัญ: ต้องแปลงค่าภายในฟังก์ชัน] ---

	// แปลง MatchID จาก string เป็น uint
	mID, err := strconv.ParseUint(req.MatchID, 10, 32)
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รหัสการแข่งขัน (MatchID) ไม่ถูกต้อง"})
	}

	// แปลง Hdp จาก string เป็น float64
	hdpFloat, _ := strconv.ParseFloat(req.Hdp, 64)

	// ------------------------------------------

	// เริ่มกระบวนการทางฐานข้อมูล (Transaction)
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User

		// ล็อกแถว User ไว้เพื่อป้องกันการแทงซ้อน (Race Condition)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งานในระบบ"})
		}

		// เช็คยอดเงิน
		if user.Credit < req.Amount {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตของคุณไม่เพียงพอ"})
		}

		balanceBefore := user.Credit
		balanceAfter := user.Credit - req.Amount

		// 3. หักเครดิต User
		if err := tx.Model(&user).Update("credit", balanceAfter).Error; err != nil {
			return err
		}

		// 4. สร้างบิล (BetSlip)
		bet := models.BetSlip{
			UserID:   userID,
			MatchID:  uint(mID),
			HomeTeam: req.HomeTeam,
			AwayTeam: req.AwayTeam,
			HomeLogo: req.HomeLogo,
			AwayLogo: req.AwayLogo,
			Pick:     req.Pick,
			Hdp:      hdpFloat,
			Amount:   req.Amount,
			Odds:     req.Odds,
			Status:   "pending",
		}
		if err := tx.Create(&bet).Error; err != nil {
			return err
		}

		// 5. บันทึก Transaction Log เพื่อใช้ตรวจสอบภายหลัง
		transaction := models.Transaction{
			UserID:        userID,
			Amount:        req.Amount,
			Type:          "bet",
			Status:        "success",
			BalanceBefore: balanceBefore,
			BalanceAfter:  balanceAfter,
		}
		if err := tx.Create(&transaction).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{
			"message": "วางเดิมพันสำเร็จ",
			"bet_id":  bet.ID,
			"credit":  balanceAfter,
		})
	})
}

// 3. ฟังก์ชันดึงประวัติการเดิมพัน
func GetBetHistory(c *fiber.Ctx) error {
	// ดึง userID จาก Middleware
	userID := c.Locals("user_id")
	if userID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var bets []models.BetSlip

	// ดึงข้อมูลพร้อม Preload ข้อมูล Match (ถ้ามี relationship)
	// และเรียงจากบิลล่าสุดขึ้นก่อน
	err := database.DB.Preload("Match").
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&bets).Error

	if err != nil {
		fmt.Println("🔥 Database Error:", err)
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถโหลดข้อมูลประวัติได้"})
	}

	return c.JSON(bets)
}
