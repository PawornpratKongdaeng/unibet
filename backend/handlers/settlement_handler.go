package handlers

import (
	"log"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services" // เรียกใช้ CalculatePayout ที่เราแก้ไว้
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ปรับตามโครงสร้างจริงของ HtayAPI v3 results
type ResultsResponse struct {
	Status string `json:"status"`
	Data   []struct {
		MatchID   string `json:"match_id"`
		HomeScore int    `json:"home_score"`
		AwayScore int    `json:"away_score"`
		Status    string `json:"status"`
	} `json:"data"`
}

func ManualSettlement(c *fiber.Ctx) error {
	// รันแบบ Background เพื่อไม่ให้ User ต้องรอ API ตอบกลับนาน
	go AutoSettlement()
	return c.JSON(fiber.Map{"message": "Settlement process started..."})
}

func AutoSettlement() {
	var pendingBets []models.BetSlip
	database.DB.Where("status = ?", "pending").Find(&pendingBets)

	if len(pendingBets) == 0 {
		return
	}

	url := "https://htayapi.com/mmk-autokyay/v3/results?key=demoapi"
	var apiData ResultsResponse

	resp, err := client.R().SetResult(&apiData).Get(url)
	if err != nil || resp.IsError() {
		log.Printf("❌ Settlement Error: %v", err)
		return
	}

	// ทำ Map เพื่อให้ค้นหาผลบอลได้ไวขึ้น
	resultsMap := make(map[string]struct{ Home, Away int })
	for _, r := range apiData.Data {
		// เช็คสถานะว่าจบการแข่งขันหรือยัง (ขึ้นอยู่กับ API ว่าส่งคำว่า Finished หรือ FT)
		resultsMap[r.MatchID] = struct{ Home, Away int }{r.HomeScore, r.AwayScore}
	}

	for _, bet := range pendingBets {
		res, exists := resultsMap[bet.MatchID]
		if !exists {
			continue
		}

		// ใช้ CalculatePayout ตัวที่เราแก้ใหม่ (ส่งค่า Pick, Hdp ให้ตรงกัน)
		status, payout, _ := services.CalculatePayout(
			bet.Amount,
			bet.Odds,
			bet.Hdp,  // ส่ง float64
			bet.Pick, // ส่ง string ("home" / "away")
			res.Home,
			res.Away,
		)

		if status == "pending" {
			continue
		}

		database.DB.Transaction(func(tx *gorm.DB) error {
			// 1. อัปเดตสถานะบิล
			if err := tx.Model(&bet).Updates(map[string]interface{}{
				"status": status,
				"payout": payout,
			}).Error; err != nil {
				return err
			}

			// 2. คืนเงินถ้าชนะ/ชนะครึ่ง/เสมอ
			if payout > 0 {
				if err := tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("balance", gorm.Expr("balance + ?", payout)).Error; err != nil {
					return err
				}
				log.Printf("💰 User %d settled: %s, Payout: %.2f", bet.UserID, status, payout)
			}
			return nil
		})
	}
}
