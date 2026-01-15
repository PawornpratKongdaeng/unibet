package handlers

import (
	"math"
	"strconv"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// โครงสร้างรับข้อมูล
type PlaceBetRequest struct {
	BetType     string  `json:"bet_type"`
	TotalStake  float64 `json:"total_stake"`
	TotalPayout float64 `json:"total_payout"`
	TotalRisk   float64 `json:"total_risk"`

	MatchID     string  `json:"match_id"`
	HomeTeam    string  `json:"home_team"`
	AwayTeam    string  `json:"away_team"`
	Pick        string  `json:"pick"`
	Hdp         float64 `json:"hdp"`
	Price       int     `json:"price"`         // ค่าน้ำพม่า เช่น -80, 50
	IsHomeUpper bool    `json:"is_home_upper"` // ทีมเจ้าบ้านเป็นทีมต่อหรือไม่

	Items []ParlayItemRequest `json:"items"`
}

type ParlayItemRequest struct {
	MatchID     string  `json:"match_id"`
	HomeTeam    string  `json:"home_team"`
	AwayTeam    string  `json:"away_team"`
	Pick        string  `json:"side"`
	Hdp         float64 `json:"hdp"`
	Price       int     `json:"price"`
	IsHomeUpper bool    `json:"is_home_upper"`
}

func PlaceBet(c *fiber.Ctx) error {
	var req PlaceBetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ดึง userID จาก Locals (Middleware)
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}

	if req.TotalStake <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเดิมพันต้องมากกว่า 0"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
		}

		// ราคาพม่า: ถ้าน้ำแดง หักเงินตามยอด Risk (ยอดติดลบที่หักจริงน้อยกว่ายอดแทง)
		amountToDeduct := req.TotalStake
		if req.TotalRisk > 0 {
			amountToDeduct = req.TotalRisk
		}

		if user.Credit < amountToDeduct {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตไม่เพียงพอ"})
		}

		balanceBefore := user.Credit
		balanceAfter := user.Credit - amountToDeduct

		if err := tx.Model(&user).Update("credit", balanceAfter).Error; err != nil {
			return err
		}

		if req.BetType == "single" {
			// แปลง MatchID จาก String เป็น Uint
			mID, err := strconv.ParseUint(req.MatchID, 10, 32)
			if err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Invalid Match ID"})
			}
			matchIDValue := uint(mID)

			// 🔥 สร้าง BetSlip
			betSlip := models.BetSlip{
				UserID:      userID,
				MatchID:     &matchIDValue, // ใช้ Address ของตัวแปร uint
				HomeTeam:    req.HomeTeam,
				AwayTeam:    req.AwayTeam,
				Pick:        req.Pick,
				Hdp:         req.Hdp,
				Price:       req.Price,
				IsHomeUpper: req.IsHomeUpper,
				Amount:      req.TotalStake,
				Payout:      req.TotalPayout,
				Status:      "pending",
			}

			// 🔥 แก้ไข: เปลี่ยนจาก &bet เป็น &betSlip (ตามชื่อตัวแปรที่ประกาศจริง)
			if err := tx.Create(&betSlip).Error; err != nil {
				return err
			}
		} else {
			// กรณีบอลสเต็ป (Parlay)
			ticket := models.ParlayTicket{
				UserID: userID,
				Amount: req.TotalStake,
				Payout: req.TotalPayout,
				Status: "pending",
			}
			if err := tx.Create(&ticket).Error; err != nil {
				return err
			}

			for _, item := range req.Items {
				// 🔥 แก้ไข: แปลง MatchID ในลูปบอลสเต็ปด้วย

				parlayItem := models.ParlayItem{
					TicketID:    ticket.ID,
					MatchID:     item.MatchID, // ใส่ค่า uint ที่แปลงแล้ว
					HomeTeam:    item.HomeTeam,
					AwayTeam:    item.AwayTeam,
					Hdp:         item.Hdp,
					Price:       item.Price,
					IsHomeUpper: item.IsHomeUpper,
					Pick:        item.Pick,
					Status:      "pending",
				}
				if err := tx.Create(&parlayItem).Error; err != nil {
					return err
				}
			}
		}

		tx.Create(&models.Transaction{
			UserID:        userID,
			Amount:        amountToDeduct,
			Type:          "bet",
			Status:        "success",
			BalanceBefore: balanceBefore,
			BalanceAfter:  balanceAfter,
		})

		return c.JSON(fiber.Map{"status": "success", "credit": balanceAfter})
	})
}

// ... (SettleBets และ calculateBurmeseHandicap ใช้ตัวเดิมได้เลยครับ Logic ดูถูกต้องแล้ว) ...
func SettleBets(db *gorm.DB, results []models.HtayMatchResult) error {
	for _, res := range results {
		if res.Status != "completed" {
			continue
		}

		// 1. คิดผลบอลเต็ง (Single Bet)
		var bets []models.BetSlip
		db.Where("match_id = ? AND status = ?", res.ID, "pending").Find(&bets)

		for _, bet := range bets {
			resultStatus := calculateBurmeseHandicap(
				res.Scores.FullTime.Home,
				res.Scores.FullTime.Away,
				int(bet.Hdp),
				bet.Price,
				bet.IsHomeUpper,
				bet.Pick,
			)

			db.Transaction(func(tx *gorm.DB) error {
				tx.Model(&bet).Update("status", resultStatus)

				var refundAmount float64
				priceFactor := math.Abs(float64(bet.Price)) / 100.0

				switch resultStatus {
				case "win":
					refundAmount = bet.Payout
				case "win_half":
					refundAmount = bet.Amount + (bet.Amount * priceFactor)
					if bet.Price < 0 { // กรณีน้ำแดง
						riskAmount := bet.Amount * priceFactor
						refundAmount = riskAmount + riskAmount
					}
				case "lost_half":
					refundAmount = bet.Amount * (1 - priceFactor)
				case "draw":
					refundAmount = bet.Amount
				}

				if refundAmount > 0 {
					tx.Model(&models.User{}).Where("id = ?", bet.UserID).Update("credit", gorm.Expr("credit + ?", refundAmount))
				}
				return nil
			})
		}

		// 2. คิดผลบอลสเต็ป (Parlay - เฉพาะรายคู่)
		var parlayItems []models.ParlayItem
		db.Where("match_id = ? AND status = ?", res.ID, "pending").Find(&parlayItems)

		for _, item := range parlayItems {
			resultStatus := calculateBurmeseHandicap(
				res.Scores.FullTime.Home,
				res.Scores.FullTime.Away,
				int(item.Hdp),
				item.Price,
				item.IsHomeUpper,
				item.Pick,
			)

			db.Transaction(func(tx *gorm.DB) error {
				tx.Model(&item).Update("status", resultStatus)
				return nil
			})
		}
	}
	return nil
}

func calculateBurmeseHandicap(homeScore, awayScore int, odds int, price int, isHomeUpper bool, pick string) string {
	diff := homeScore - awayScore
	if !isHomeUpper {
		diff = awayScore - homeScore
	}

	var upperResult string
	if diff > odds {
		upperResult = "win"
	} else if diff < odds {
		upperResult = "lost"
	} else {
		// กรณีแต้มประตูเท่ากับแต้มต่อ
		if price < 0 {
			upperResult = "lost_half"
		} else {
			upperResult = "win_half"
		}
	}

	isUserPickUpper := (pick == "home" && isHomeUpper) || (pick == "away" && !isHomeUpper)

	if isUserPickUpper {
		return upperResult
	}

	switch upperResult {
	case "win":
		return "lost"
	case "lost":
		return "win"
	case "win_half":
		return "lost_half"
	case "lost_half":
		return "win_half"
	default:
		return "draw"
	}
}
