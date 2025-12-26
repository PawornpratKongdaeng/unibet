package workers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services"
)

func RunAutoSettlement() {
	ticker := time.NewTicker(5 * time.Minute)
	for range ticker.C {
		processResults()
		settleParlayTickets()
	}
}

func processResults() {
	resp, err := http.Get("https://htayapi.com/mmk-autokyay/v3/results?key=demoapi")
	if err != nil {
		return
	}
	defer resp.Body.Close()

	var apiData models.HtayResultResponse
	json.NewDecoder(resp.Body).Decode(&apiData)

	for _, res := range apiData.Data {
		// --- 1. บอลเต็ง ---
		var pendingBets []models.BetSlip
		database.DB.Where("match_id = ? AND status = ?", res.MatchID, "pending").Find(&pendingBets)

		for _, bet := range pendingBets {
			tx := database.DB.Begin()
			// ✅ แก้เป็น bet.Hdp และ bet.Pick
			status, payout, _ := services.CalculatePayout(bet.Amount, bet.Odds, bet.Hdp, bet.Pick, res.HomeScore, res.AwayScore)

			tx.Model(&bet).Updates(map[string]interface{}{
				"status": status,
				"payout": payout,
			})

			if payout > 0 {
				tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("balance", database.DB.Raw("balance + ?", payout))
			}
			tx.Commit()
		}

		// --- 2. อัปเดตสถานะรายคู่ในสเต็ป ---
		var parlayItems []models.ParlayItem
		database.DB.Where("match_id = ? AND status = ?", res.MatchID, "pending").Find(&parlayItems)
		for _, item := range parlayItems {
			// ✅ แก้เป็น item.Hdp
			status, _, _ := services.CalculatePayout(0, 0, item.Hdp, item.Pick, res.HomeScore, res.AwayScore)
			database.DB.Model(&item).Update("status", status)
		}
	}
}

func settleParlayTickets() {
	var tickets []models.ParlayTicket
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

			// ✅ ใช้เฉพาะสถานะจาก DB มาคำนวณตัวคูณ (ลบ multiplier ที่ไม่ได้ใช้ทิ้ง)
			switch item.Status {
			case "win":
				totalMultiplier *= item.Odds
			case "win_half":
				totalMultiplier *= 1 + ((item.Odds - 1) / 2)
			case "draw":
				totalMultiplier *= 1
			case "lose_half":
				totalMultiplier *= 0.5
			case "loss":
				totalMultiplier = 0
				finalStatus = "loss"
			}
			if finalStatus == "loss" {
				break
			}
		}

		if allFinished || finalStatus == "loss" {
			tx := database.DB.Begin()
			payout := ticket.Amount * totalMultiplier
			tx.Model(&ticket).Updates(map[string]interface{}{
				"total_odds": totalMultiplier,
				"payout":     payout,
				"status":     finalStatus,
			})
			if payout > 0 {
				tx.Model(&models.User{}).Where("id = ?", ticket.UserID).
					UpdateColumn("balance", database.DB.Raw("balance + ?", payout))
			}
			tx.Commit()
		}
	}
}
