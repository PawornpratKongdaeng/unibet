package handlers

import (
	"log"
	"sync"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/go-resty/resty/v2" // ใช้ resty เป็น client (go get github.com/go-resty/resty/v2)
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ใช้สำหรับล็อกไม่ให้ Settlement ทำงานซ้อนกัน
var (
	settleMutex  sync.Mutex
	isProcessing bool
)

// ปรับตามโครงสร้างจริงของ HtayAPI v3 results
type ResultsResponse struct {
	Status string `json:"status"`
	Data   []struct {
		MatchID   string `json:"match_id"`
		HomeScore int    `json:"home_score"`
		AwayScore int    `json:"away_score"`
		Status    string `json:"status"` // "FT", "Finished", "LIVE"
	} `json:"data"`
}

func ManualSettlement(c *fiber.Ctx) error {
	settleMutex.Lock()
	if isProcessing {
		settleMutex.Unlock()
		return c.Status(429).JSON(fiber.Map{"message": "Settlement process is already running. Please wait."})
	}
	isProcessing = true
	settleMutex.Unlock()

	// รันแบบ Background เพื่อไม่ให้ User ต้องรอ
	go func() {
		defer func() {
			settleMutex.Lock()
			isProcessing = false
			settleMutex.Unlock()
		}()
		AutoSettlement()
	}()

	return c.JSON(fiber.Map{"message": "Settlement process started..."})
}

func AutoSettlement() {
	log.Println("🔄 [Settlement] Starting process...")

	var pendingBets []models.BetSlip
	// ดึงเฉพาะบิลที่ยังเป็น pending
	if err := database.DB.Where("status = ?", "pending").Find(&pendingBets).Error; err != nil {
		log.Printf("❌ [Settlement] DB Error fetching bets: %v", err)
		return
	}

	if len(pendingBets) == 0 {
		log.Println("ℹ️ [Settlement] No pending bets to process.")
		return
	}

	// เรียก API ผลบอล
	client := resty.New()
	url := "https://htayapi.com/mmk-autokyay/v3/results?key=demoapi"
	var apiData ResultsResponse

	resp, err := client.R().SetResult(&apiData).Get(url)
	if err != nil || resp.IsError() {
		log.Printf("❌ [Settlement] API Error: %v", err)
		return
	}

	// ทำ Map เพื่อให้ค้นหา MatchID ได้เร็วขึ้น (O(1))
	resultsMap := make(map[string]struct {
		Home, Away int
		IsFinished bool
	})
	for _, r := range apiData.Data {
		// เช็คสถานะเกมว่าจบหรือยัง (ปรับเงื่อนไขตาม API จริง เช่น "FT" หรือ "Finished")
		finished := (r.Status == "FT" || r.Status == "Finished")
		resultsMap[r.MatchID] = struct {
			Home, Away int
			IsFinished bool
		}{r.HomeScore, r.AwayScore, finished}
	}

	// ลูปเคลียร์บิล
	for _, bet := range pendingBets {
		res, exists := resultsMap[bet.MatchID]

		// ถ้าไม่พบผลบอลคู่รี้ หรือบอลยังไม่จบ ให้ข้ามไป
		if !exists || !res.IsFinished {
			continue
		}

		// เรียกใช้ CalculatePayout (คืนค่า status, payout, error)
		// 1. เรียกใช้ CalculatePayout โดยไม่เอาค่าที่ 3 มาเช็ค nil
		status, payout, _ := services.CalculatePayout(
			bet.Amount,
			bet.Odds,
			bet.Hdp,
			bet.Pick,
			res.Home,
			res.Away,
		)

		// 2. เช็คแค่ status ถ้ายังไม่จบหรือมีปัญหาให้ข้าม
		if status == "pending" || status == "" {
			continue
		}

		// 3. บันทึกลง Database ด้วย Transaction (เหมือนเดิม)
		errTx := database.DB.Transaction(func(tx *gorm.DB) error {
			result := tx.Model(&bet).
				Where("id = ? AND status = ?", bet.ID, "pending").
				Updates(map[string]interface{}{
					"status": status,
					"payout": payout,
				})

			if result.Error != nil {
				return result.Error
			}

			if result.RowsAffected > 0 && payout > 0 {
				if err := tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("balance", gorm.Expr("balance + ?", payout)).Error; err != nil {
					return err
				}
			}
			return nil
		})

		if errTx != nil {
			log.Printf("❌ [Settlement] Failed for BetID %d: %v", bet.ID, errTx)
		} else {
			log.Printf("✅ [Settlement] Success: BetID %d | Status: %s | Payout: %.2f", bet.ID, status, payout)
		}
	}

	log.Println("🏁 [Settlement] Process finished.")
}
