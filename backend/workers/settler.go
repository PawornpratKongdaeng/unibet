package workers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services"
)

func RunAutoSettlement() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		log.Println("🕒 [AutoSettlement] Cycle started...")
		processResults()
		settleParlayTickets()
	}
}

func processResults() {
	resp, err := http.Get("https://htayapi.com/mmk-autokyay/v3/results?key=demoapi")
	if err != nil {
		log.Printf("❌ [Worker] API Error: %v", err)
		return
	}
	defer resp.Body.Close()

	var apiData models.HtayResultResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiData); err != nil {
		return
	}

	for _, res := range apiData.Data {
		// เช็คเฉพาะคู่ที่จบแล้วเท่านั้น (FT, Finished, Closed)
		if res.Status != "FT" && res.Status != "Finished" && res.Status != "Closed" {
			continue
		}

		// --- 1. เคลียร์บอลเต็ง (BetSlip) ---
		var pendingBets []models.BetSlip
		database.DB.Where("match_id = ? AND status = ?", res.MatchID, "pending").Find(&pendingBets)

		for _, bet := range pendingBets {
			tx := database.DB.Begin()
			// ใช้ defer เพื่อความปลอดภัย ถ้าพังมันจะ Rollback อัตโนมัติ
			defer tx.Rollback()

			status, payout := services.CalculatePayout(bet.Amount, bet.Odds, bet.Hdp, bet.Pick, res.HomeScore, res.AwayScore)

			if err := tx.Model(&bet).Updates(map[string]interface{}{
				"status":     status,
				"payout":     payout,
				"settled_at": time.Now(),
			}).Error; err != nil {
				continue
			}

			if payout > 0 {
				// เปลี่ยนเป็น "credit" หรือ "balance" ให้ตรงกับตาราง User ของคุณ
				if err := tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("balance", database.DB.Raw("balance + ?", payout)).Error; err != nil {
					continue
				}
			}
			tx.Commit()
		}

		// --- 2. อัปเดตสถานะรายคู่ในสเต็ป (ParlayItem) ---
		database.DB.Model(&models.ParlayItem{}).
			Where("match_id = ? AND status = ?", res.MatchID, "pending").
			Find(&models.ParlayItem{}). // กรองเฉพาะที่ยังไม่เคลียร์
			ForEach(func(item *models.ParlayItem) {
				status, _ := services.CalculatePayout(0, 0, item.Hdp, item.Pick, res.HomeScore, res.AwayScore)
				database.DB.Model(item).Update("status", status)
			})
	}
}

func settleParlayTickets() {
	var tickets []models.ParlayTicket
	// ดึงบิลสเต็ปที่ค้างอยู่ และดึงข้อมูลลูก (Items) มาด้วย
	database.DB.Preload("Items").Where("status = ?", "pending").Find(&tickets)

	for _, ticket := range tickets {
		allFinished := true
		totalMultiplier := 1.0
		finalStatus := "win"

		for _, item := range ticket.Items {
			if item.Status == "pending" {
				allFinished = false
				break
			}

			// แปลง Odds พม่าเป็นตัวคูณทศนิยม (Decimal Odds)
			// เช่น Odds 76 => 1.76
			decimalOdds := 1 + (item.Odds / 100)

			switch item.Status {
			case "win":
				totalMultiplier *= decimalOdds
			case "win_half":
				// สูตรชนะครึ่ง: 1 + (กำไร / 2)
				totalMultiplier *= 1 + ((decimalOdds - 1) / 2)
			case "draw":
				totalMultiplier *= 1.0
			case "lose_half":
				totalMultiplier *= 0.5
			case "loss", "lost":
				totalMultiplier = 0
				finalStatus = "loss"
			}

			if finalStatus == "loss" {
				break
			}
		}

		if allFinished || finalStatus == "loss" {
			tx := database.DB.Begin()
			defer tx.Rollback()

			payout := ticket.Amount * totalMultiplier

			// ถ้าผลรวม multiplier เป็น 1 (เจ๊าทุกคู่) สถานะควรเป็น draw
			if finalStatus == "win" && totalMultiplier == 1.0 {
				finalStatus = "draw"
			}

			if err := tx.Model(&ticket).Updates(map[string]interface{}{
				"total_odds": totalMultiplier,
				"payout":     payout,
				"status":     finalStatus,
				"settled_at": time.Now(),
			}).Error; err != nil {
				continue
			}

			if payout > 0 {
				tx.Model(&models.User{}).Where("id = ?", ticket.UserID).
					UpdateColumn("balance", database.DB.Raw("balance + ?", payout))
			}
			tx.Commit()
		}
	}
}
