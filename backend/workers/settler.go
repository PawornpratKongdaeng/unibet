package workers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services"
	"gorm.io/gorm"
)

func RunAutoSettlement() {
	ticker := time.NewTicker(5 * time.Minute)
	log.Println("🚀 [Worker] AutoSettlement started...")

	for range ticker.C {
		log.Println("🕒 [AutoSettlement] Cycle started at", time.Now().Format("15:04:05"))
		processResults()
		settleParlayTickets()
	}
}

func processResults() {
	resp, err := http.Get("https://htayapi.com/mmk-autokyay/v3/results?key=eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke")
	if err != nil {
		log.Printf("❌ [Worker] API Connection Error: %v", err)
		return
	}
	defer resp.Body.Close()

	var apiData models.HtayResultResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiData); err != nil {
		log.Printf("❌ [Worker] JSON Decode Error: %v", err)
		return
	}

	for _, res := range apiData.Data {
		// เช็คสถานะบอลจบ
		if res.Status != "FT" && res.Status != "Finished" && res.Status != "Closed" {
			continue
		}

		// 1. เคลียร์บอลเต็ง (BetSlip)
		var pendingBets []models.BetSlip
		database.DB.Where("match_id = ? AND status = ?", res.MatchID, "pending").Find(&pendingBets)

		for _, bet := range pendingBets {
			// ใช้ Anonymous Function เพื่อให้ defer tx.Rollback() ทำงานทุกรอบของ Loop
			func(b models.BetSlip) {
				tx := database.DB.Begin()
				defer tx.Rollback()

				status, payout := services.CalculatePayout(b.Amount, b.Odds, b.Hdp, b.Pick, res.HomeScore, res.AwayScore)

				if err := tx.Model(&b).Updates(map[string]interface{}{
					"status":     status,
					"payout":     payout,
					"settled_at": time.Now(),
				}).Error; err != nil {
					return
				}

				if payout > 0 {
					// แก้เป็น "credit" ตามตาราง User ของคุณ
					if err := tx.Model(&models.User{}).Where("id = ?", b.UserID).
						UpdateColumn("credit", gorm.Expr("credit + ?", payout)).Error; err != nil {
						return
					}
				}
				tx.Commit()
				log.Printf("✅ [Single] BetID: %d settled as %s (Payout: %.2f)", b.ID, status, payout)
			}(bet)
		}

		// 2. อัปเดตสถานะรายคู่ในสเต็ป (ParlayItem)
		database.DB.Model(&models.ParlayItem{}).
			Where("match_id = ? AND status = ?", res.MatchID, "pending").
			Find(&models.ParlayItem{}).
			ForEach(func(item *models.ParlayItem) error {
				status, _ := services.CalculatePayout(0, 0, item.Hdp, item.Pick, res.HomeScore, res.AwayScore)
				database.DB.Model(item).Update("status", status)
				return nil
			})
	}
}

func settleParlayTickets() {
	var tickets []models.ParlayTicket
	database.DB.Preload("Items").Where("status = ?", "pending").Find(&tickets)

	for _, ticket := range tickets {
		allFinished := true
		totalMultiplier := 1.0
		isLoss := false

		for _, item := range ticket.Items {
			if item.Status == "pending" {
				allFinished = false
				break
			}

			// ตัวคูณทศนิยม (Decimal Odds)
			// ถ้าเก็บ odds 0.85 ใน DB ตัวคูณคือ 1.85
			decimalOdds := 1 + item.Odds

			switch item.Status {
			case "win":
				totalMultiplier *= decimalOdds
			case "win_half":
				totalMultiplier *= 1 + (item.Odds / 2)
			case "draw":
				totalMultiplier *= 1.0
			case "lose_half":
				totalMultiplier *= 0.5
			case "loss", "lost":
				totalMultiplier = 0
				isLoss = true
			}

			if isLoss {
				break
			}
		}

		// ถ้าตาย (isLoss) หรือ จบครบทุกคู่ (allFinished) ให้จ่ายเงิน
		if isLoss || allFinished {
			func(t models.ParlayTicket, mult float64, loss bool) {
				tx := database.DB.Begin()
				defer tx.Rollback()

				finalStatus := "win"
				if loss {
					finalStatus = "loss"
				} else if mult == 1.0 {
					finalStatus = "draw"
				}

				payout := t.Amount * mult

				if err := tx.Model(&t).Updates(map[string]interface{}{
					"status":     finalStatus,
					"payout":     payout,
					"settled_at": time.Now(),
				}).Error; err != nil {
					return
				}

				if payout > 0 {
					tx.Model(&models.User{}).Where("id = ?", t.UserID).
						UpdateColumn("credit", gorm.Expr("credit + ?", payout))
				}
				tx.Commit()
				log.Printf("🎰 [Parlay] TicketID: %d settled as %s (Total Mult: %.2f)", t.ID, finalStatus, mult)
			}(ticket, totalMultiplier, isLoss)
		}
	}
}
