package handlers

import (
	"strconv"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm/clause"
)

type PlaceBetRequest struct {
	MatchID string  `json:"match_id"`
	Pick    string  `json:"pick"` // เปลี่ยนจาก Side เป็น Pick ให้ตรง Model
	Odds    float64 `json:"odds"`
	Amount  float64 `json:"amount"`
	BetType string  `json:"type"`
	Hdp     string  `json:"hdp"` // รับมาเป็น string จากหน้าบ้าน (เช่น "0.5")
}

func PlaceBet(c *fiber.Ctx) error {
	rawUserID := c.Locals("user_id")
	if rawUserID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}
	userID := rawUserID.(uint)

	var req PlaceBetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid data"})
	}

	// แปลง Hdp จาก string เป็น float64 เพื่อเก็บลง Database
	hdpFloat, _ := strconv.ParseFloat(req.Hdp, 64)

	tx := database.DB.Begin()

	var user models.User
	if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
		tx.Rollback()
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	if user.Credit < req.Amount {
		tx.Rollback()
		return c.Status(400).JSON(fiber.Map{"error": "เครดิตไม่เพียงพอ"})
	}

	// ตัดเครดิต
	if err := tx.Model(&user).Update("credit", user.Credit-req.Amount).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update credit"})
	}

	// สร้างบิล
	bet := models.BetSlip{
		UserID:  userID,
		MatchID: req.MatchID,
		Pick:    req.Pick, // ใช้ Pick
		Hdp:     hdpFloat, // ใช้ float64
		Amount:  req.Amount,
		Odds:    req.Odds,
		Status:  "pending",
	}

	if err := tx.Create(&bet).Error; err != nil {
		tx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create bet"})
	}

	tx.Commit()
	return c.JSON(fiber.Map{"message": "Bet placed successfully", "credit": user.Credit - req.Amount})
}

func GetHistory(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	var bets []models.BetSlip
	database.DB.Where("user_id = ?", userID).Order("id desc").Find(&bets)
	return c.JSON(bets)
}
