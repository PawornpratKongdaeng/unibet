package handlers

import (
	"strconv"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// โครงสร้างรับข้อมูลที่รองรับทั้ง Single และ Mixplay
type PlaceBetRequest struct {
	BetType     string  `json:"bet_type"`
	TotalStake  float64 `json:"total_stake"` // ตรวจสอบตัวสะกด และห้ามมีช่องว่างหลัง json:
	TotalPayout float64 `json:"total_payout"`
	TotalRisk   float64 `json:"total_risk"`

	MatchID  string  `json:"match_id"`
	HomeTeam string  `json:"home_team"`
	AwayTeam string  `json:"away_team"`
	Pick     string  `json:"pick"`
	Odds     float64 `json:"odds"`
	Hdp      string  `json:"hdp"`

	Items []ParlayItemRequest `json:"items"`
}

type ParlayItemRequest struct {
	MatchID  string  `json:"match_id"`
	HomeTeam string  `json:"home_team"`
	AwayTeam string  `json:"away_team"`
	Pick     string  `json:"side"` // "home", "away", "over", "under"
	Odds     float64 `json:"odds"`
	Hdp      string  `json:"hdp"`
}

func PlaceBet(c *fiber.Ctx) error {
	var req PlaceBetRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ดึง userID จาก Locals (Middleware)
	var userID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}

	// 2. ตรวจสอบยอดเงินขั้นต่ำ
	if req.TotalStake <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดเดิมพันต้องมากกว่า 0"})
	}

	// 3. เริ่ม Transaction เพื่อความปลอดภัยในการตัดเงิน
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		// Lock แถวของ User ไว้เพื่อป้องกันการกดเบิ้ล (Race Condition)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, userID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
		}

		// ตรวจสอบเครดิต (ใช้ TotalRisk เพราะถ้าน้ำแดงจะหักเงินน้อยกว่ายอดแทง)
		amountToDeduct := req.TotalStake
		if req.TotalRisk > 0 {
			amountToDeduct = req.TotalRisk
		}

		if user.Credit < amountToDeduct {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตของคุณไม่เพียงพอ"})
		}

		balanceBefore := user.Credit
		balanceAfter := user.Credit - amountToDeduct

		// 4. ตัดเงิน User
		if err := tx.Model(&user).Update("credit", balanceAfter).Error; err != nil {
			return err
		}

		// 5. บันทึกข้อมูลแยกตามประเภท
		if req.BetType == "single" {
			// --- กรณีบอลเต็ง ---
			mID, _ := strconv.ParseUint(req.MatchID, 10, 32)
			hdpFloat, _ := strconv.ParseFloat(req.Hdp, 64)

			bet := models.BetSlip{
				UserID:   userID,
				MatchID:  uint(mID),
				HomeTeam: req.HomeTeam,
				AwayTeam: req.AwayTeam,
				Pick:     req.Pick,
				Hdp:      hdpFloat,
				Amount:   req.TotalStake,
				Odds:     req.Odds,
				Payout:   req.TotalPayout,
				Status:   "pending",
			}
			if err := tx.Create(&bet).Error; err != nil {
				return err
			}
		} else {
			// --- กรณีบอลชุด (Parlay) ---
			ticket := models.ParlayTicket{
				UserID:    userID,
				Amount:    req.TotalStake,
				Payout:    req.TotalPayout,
				Status:    "pending",
				CreatedAt: tx.NowFunc(),
			}
			if err := tx.Create(&ticket).Error; err != nil {
				return err
			}

			// บันทึกแต่ละคู่ในชุด
			for _, item := range req.Items {
				hdpVal, _ := strconv.ParseFloat(item.Hdp, 64)
				parlayItem := models.ParlayItem{
					TicketID: ticket.ID,
					MatchID:  item.MatchID,
					HomeTeam: item.HomeTeam, // หากใน Model ไม่มีฟิลด์นี้ ให้ลบออก
					AwayTeam: item.AwayTeam, // หากใน Model ไม่มีฟิลด์นี้ ให้ลบออก
					Hdp:      hdpVal,
					Pick:     item.Pick,
					Odds:     item.Odds,
					Status:   "pending",
				}
				if err := tx.Create(&parlayItem).Error; err != nil {
					return err
				}
			}
		}

		// 6. บันทึกประวัติ Transaction
		tx.Create(&models.Transaction{
			UserID:        userID,
			Amount:        amountToDeduct,
			Type:          "bet",
			Status:        "success",
			BalanceBefore: balanceBefore,
			BalanceAfter:  balanceAfter,
		})

		return c.JSON(fiber.Map{
			"status":  "success",
			"message": "วางเดิมพันสำเร็จ",
			"credit":  balanceAfter,
		})
	})
}
func CalculateBetResult(match models.MatchResult, userPick string) string {
	// 1. หาผลต่างประตู (Goal Difference)
	diff := float64(match.Scores.FullTime.Home - match.Scores.FullTime.Away)

	// 2. ดึงราคาต่อรอง (แปลงจาก string "-1" เป็น float -1.0)
	hdp, _ := strconv.ParseFloat(match.Odds.Handicap.HomeLine, 64)

	// 3. คิดผลสำหรับทีมต่อ (Home)
	var homeResult string
	finalPoint := diff + hdp // 0 (1-1) + (-1) = -1

	if finalPoint > 0 {
		homeResult = "win"
	} else if finalPoint < 0 {
		homeResult = "lost"
	} else {
		homeResult = "draw"
	}

	// 4. คืนค่าตามที่ User แทงไว้
	if userPick == "home" {
		return homeResult
	} else {
		// ถ้าทีมต่อแพ้/เสมอ ทีมรอง (Away) จะได้ผลตรงข้าม
		if homeResult == "win" {
			return "lost"
		}
		if homeResult == "lost" {
			return "win"
		}
		return "draw"
	}
}
func SettleBets(db *gorm.DB, results []models.MatchResult) error {
	for _, res := range results {
		if res.Status != "completed" {
			continue
		}

		// --- ส่วนที่ 1: คิดผลบอลเต็ง ---
		var bets []models.BetSlip
		// แปลง res.ID เป็น uint เพื่อใช้กับ BetSlip (เพราะ MatchID เป็น uint)
		mID, _ := strconv.ParseUint(res.ID, 10, 32)
		db.Where("match_id = ? AND status = ?", uint(mID), "pending").Find(&bets)

		for _, bet := range bets {
			resultStatus := calculateScore(res, bet.Pick)
			db.Transaction(func(tx *gorm.DB) error {
				tx.Model(&bet).Update("status", resultStatus)
				if resultStatus == "win" {
					tx.Model(&models.User{}).Where("id = ?", bet.UserID).
						Update("credit", gorm.Expr("credit + ?", bet.Payout))
				} else if resultStatus == "draw" {
					tx.Model(&models.User{}).Where("id = ?", bet.UserID).
						Update("credit", gorm.Expr("credit + ?", bet.Amount))
				}
				return nil
			})
		}

		// --- ส่วนที่ 2: คิดผลบอลสเต็ป (Mixplay) ---
		var parlayItems []models.ParlayItem
		// ใช้ res.ID (string) โดยตรงเพราะ ParlayItem.MatchID เป็น string
		db.Where("match_id = ? AND status = ?", res.ID, "pending").Find(&parlayItems)

		for _, item := range parlayItems {
			resultStatus := calculateScore(res, item.Pick)

			db.Transaction(func(tx *gorm.DB) error {
				tx.Model(&item).Update("status", resultStatus)

				var ticket models.ParlayTicket
				// Preload Items เพื่อมาเช็คว่าคู่อื่นๆ ในใบเดียวกันแข่งจบหรือยัง
				if err := tx.Preload("Items").First(&ticket, item.TicketID).Error; err != nil {
					return err
				}

				allFinished := true
				anyLost := false
				for _, itm := range ticket.Items {
					if itm.Status == "pending" {
						allFinished = false
					}
					if itm.Status == "lost" {
						anyLost = true
					}
				}

				if allFinished {
					finalStatus := "win"
					if anyLost {
						finalStatus = "lost"
					}

					tx.Model(&ticket).Update("status", finalStatus)
					if finalStatus == "win" {
						tx.Model(&models.User{}).Where("id = ?", ticket.UserID).
							Update("credit", gorm.Expr("credit + ?", ticket.Payout))
					}
				}
				return nil
			})
		}
	}
	return nil
}
func calculateScore(res models.MatchResult, pick string) string {
	homeScore := res.Scores.FullTime.Home
	awayScore := res.Scores.FullTime.Away

	// แปลงราคาต่อรองจาก String เป็น Float (เช่น "-1" -> -1.0)
	hdp, _ := strconv.ParseFloat(res.Odds.Handicap.HomeLine, 64)

	// หาผลต่างประตู
	diff := float64(homeScore - awayScore)

	var homeResult string
	// สูตร: ผลต่างประตู + ราคาต่อรอง
	finalPoint := diff + hdp

	if finalPoint > 0 {
		homeResult = "win"
	} else if finalPoint < 0 {
		homeResult = "lost"
	} else {
		homeResult = "draw"
	}

	// ถ้า User แทงทีมเจ้าบ้าน (Home)
	if pick == "home" {
		return homeResult
	}

	// ถ้า User แทงทีมเยือน (Away) ผลจะสลับกัน
	if homeResult == "win" {
		return "lost"
	}
	if homeResult == "lost" {
		return "win"
	}
	return "draw"
}
