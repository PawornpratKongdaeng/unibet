package handlers

import (
	"strconv"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type PlaceBetRequest struct {
	MatchID  string  `json:"match_id"`
	HomeTeam string  `json:"home_team"` // ✅ เพิ่มเพื่อให้บันทึกลง DB ได้
	AwayTeam string  `json:"away_team"` // ✅ เพิ่มเพื่อให้บันทึกลง DB ได้
	HomeLogo string  `json:"home_logo"` // ✅ เพิ่ม (Optional)
	AwayLogo string  `json:"away_logo"` // ✅ เพิ่ม (Optional)
	Pick     string  `json:"pick"`      // เช่น "Home", "Away", "Over"
	Odds     float64 `json:"odds"`
	Amount   float64 `json:"amount"`
	BetType  string  `json:"type"` // เช่น "HDP", "OU"
	Hdp      string  `json:"hdp"`  // เช่น "0.5", "2.5-3"
}

func PlaceBet(c *fiber.Ctx) error {
	// 1. ดึง userID แบบปลอดภัย
	var userID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var req PlaceBetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if req.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเดิมพันต้องมากกว่า 0"})
	}

	hdpFloat, _ := strconv.ParseFloat(req.Hdp, 64)

	// 2. เริ่ม Transaction (DB)
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		// ใช้ credit ตามที่ Log SQL แจ้งมา
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
		}

		if user.Credit < req.Amount {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตไม่เพียงพอ"})
		}

		balanceBefore := user.Credit
		balanceAfter := user.Credit - req.Amount

		// 3. หักเครดิต User
		if err := tx.Model(&user).Update("credit", balanceAfter).Error; err != nil {
			return err
		}

		// 4. สร้างบิล (BetSlip) - บันทึกชื่อทีมลงไปที่นี่
		bet := models.BetSlip{
			UserID:   userID,
			MatchID:  req.MatchID,
			HomeTeam: req.HomeTeam, // ✅ บันทึกชื่อทีม Home
			AwayTeam: req.AwayTeam, // ✅ บันทึกชื่อทีม Away
			HomeLogo: req.HomeLogo, // ✅ บันทึก Logo (ถ้ามี)
			AwayLogo: req.AwayLogo, // ✅ บันทึก Logo (ถ้ามี)
			Pick:     req.Pick,
			Hdp:      hdpFloat,
			Amount:   req.Amount,
			Odds:     req.Odds,
			Status:   "pending",
		}
		if err := tx.Create(&bet).Error; err != nil {
			return err
		}

		// 5. บันทึก Transaction Log
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

func GetHistory(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	var bets []models.BetSlip

	// ดึงข้อมูลพร้อมเรียงลำดับจากใหม่ไปเก่า
	if err := database.DB.Where("user_id = ?", userID).Order("created_at desc").Find(&bets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลได้"})
	}

	return c.JSON(bets)
}
