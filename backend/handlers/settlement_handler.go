package handlers

import (
	"fmt"
	"log"
	"math"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/PawornpratKongdaeng/soccer/services"

	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

var (
	settleMutex  sync.Mutex
	isProcessing bool
)

type ResultsResponse struct {
	Status string `json:"status"`
	Data   []struct {
		MatchID   string `json:"match_id"`
		HomeScore int    `json:"home_score"`
		AwayScore int    `json:"away_score"`
		Status    string `json:"status"`
	} `json:"data"`
}

// 1. API สำหรับ Admin กดเริ่มเคลียร์บิล
func ManualSettlement(c *fiber.Ctx) error {
	settleMutex.Lock()
	if isProcessing {
		settleMutex.Unlock()
		return c.Status(429).JSON(fiber.Map{"message": "กำลังดำเนินการเคลียร์บิลอยู่..."})
	}
	isProcessing = true
	settleMutex.Unlock()

	go func() {
		defer func() {
			settleMutex.Lock()
			isProcessing = false
			settleMutex.Unlock()
		}()
		AutoSettlement()
	}()

	return c.JSON(fiber.Map{"message": "ระบบเริ่มทำการตรวจสอบผลและเคลียร์บิลแล้ว"})
}

func AutoSettlement() {
	log.Println("🔄 [Settlement] Starting process...")

	var pendingBets []models.BetSlip
	// ดึงบิลที่ค้างอยู่
	if err := database.DB.Where("status = ?", "pending").Find(&pendingBets).Error; err != nil {
		log.Printf("❌ [Settlement] DB Error: %v", err)
		return
	}

	if len(pendingBets) == 0 {
		log.Println("ℹ️ [Settlement] No pending bets.")
		return
	}

	// เรียก API ผลบอล
	client := resty.New().SetTimeout(15 * time.Second)
	url := "https://htayapi.com/mmk-autokyay/v3/results?key=demoapi"
	var apiData ResultsResponse
	resp, err := client.R().SetResult(&apiData).Get(url)

	if err != nil || resp.IsError() {
		log.Printf("❌ [Settlement] API Request Failed: %v", err)
		return
	}

	// ทำ Map เพื่อความเร็วในการค้นหา
	resultsMap := make(map[string]struct {
		Home, Away int
		IsFinished bool
	})
	for _, r := range apiData.Data {
		s := strings.ToUpper(r.Status)
		finished := (s == "FT" || s == "FINISHED" || s == "CLOSED")
		resultsMap[r.MatchID] = struct {
			Home, Away int
			IsFinished bool
		}{r.HomeScore, r.AwayScore, finished}
	}

	for _, bet := range pendingBets {
		matchKey := fmt.Sprintf("%d", bet.MatchID)
		res, exists := resultsMap[matchKey]

		if !exists || !res.IsFinished {
			continue
		}

		// คำนวณผลผ่าน Service
		status, payout := services.CalculatePayout(bet.Amount, bet.Odds, bet.Hdp, bet.Pick, res.Home, res.Away)

		// เริ่มบันทึกผล
		errTx := database.DB.Transaction(func(tx *gorm.DB) error {
			// 1. อัปเดตสถานะบิล
			updateResult := tx.Model(&bet).
				Where("id = ? AND status = ?", bet.ID, "pending").
				Updates(map[string]interface{}{
					"status":     status,
					"payout":     payout,
					"settled_at": time.Now(),
				})

			if updateResult.Error != nil {
				return updateResult.Error
			}

			// 2. ถ้าชนะหรือเสมอ ให้คืนเงิน/จ่ายรางวัล
			if updateResult.RowsAffected > 0 && payout > 0 {
				if err := tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("credit", gorm.Expr("credit + ?", payout)).Error; err != nil {
					return err
				}

				tx.Create(&models.Transaction{
					UserID: bet.UserID,
					Amount: payout,
					Type:   "payout",
					Status: "success",
				})
			}
			return nil
		})

		if errTx != nil {
			log.Printf("❌ [Settlement] BetID %d Error: %v", bet.ID, errTx)
		} else {
			log.Printf("✅ [Settlement] BetID %d: %s (Payout: %.2f)", bet.ID, status, payout)
		}
	}
}

// 3. ฟังก์ชันคำนวณผล (แก้ไขสูตรราคาน้ำพม่าให้ถูกต้อง)
func CalculatePayout(amount, odds float64, hdp float64, pick string, home, away int) (string, float64) {
	diff := float64(home) - float64(away)

	var finalDiff float64
	if pick == "home" {
		finalDiff = diff - hdp
	} else {
		finalDiff = hdp - diff
	}

	var status string
	var payout float64

	// 1. วิเคราะห์สถานะจากแต้มต่อ (HDP)
	switch {
	case finalDiff >= 0.5:
		status = "win"
	case finalDiff == 0.25:
		status = "win_half"
	case finalDiff == 0:
		status = "draw"
	case finalDiff == -0.25:
		status = "lose_half"
	default:
		status = "loss"
	}

	// 2. คำนวณเงินตามราคาน้ำ (Myanmar Kyay Logic)
	// ราคาน้ำบวก (เช่น 60): แทง 100 ได้ 60, เสีย 100
	// ราคาน้ำลบ (เช่น -80): แทง 100 ได้ 100, เสีย 80

	if status == "draw" {
		return "draw", amount // เสมอคืนทุน
	}

	if odds >= 0 {
		// --- กรณีราคาน้ำบวก ---
		profitFull := (amount * odds) / 100
		switch status {
		case "win":
			payout = amount + profitFull
		case "win_half":
			payout = amount + (profitFull / 2)
		case "lose_half":
			payout = amount / 2
		case "loss":
			payout = 0
		}
	} else {
		// --- กรณีราคาน้ำลบ (เช่น -80) ---
		absOdds := math.Abs(odds)
		riskAmount := (amount * absOdds) / 100 // แทง 100 เสี่ยงจริงแค่ 80

		switch status {
		case "win":
			payout = amount + amount // ได้กำไร 100 เต็ม (ทุน 100 + กำไร 100)
		case "win_half":
			payout = amount + (amount / 2)
		case "lose_half":
			// เสียครึ่งของยอดเสี่ยง (เสีย 40 จาก 80) -> คืนทุน 100 - 40 = 60
			payout = amount - (riskAmount / 2)
		case "loss":
			// เสียเต็มยอดเสี่ยง (เสีย 80) -> คืนทุน 100 - 80 = 20
			payout = amount - riskAmount
		}
	}

	return status, payout
}

// ParseHdp แปลงค่า HDP จาก String เป็น Float64
func ParseHdp(hdpStr string) float64 {
	hdpStr = strings.ReplaceAll(hdpStr, "/", "-")
	if strings.Contains(hdpStr, "-") {
		parts := strings.Split(hdpStr, "-")
		if len(parts) == 2 {
			v1, _ := strconv.ParseFloat(parts[0], 64)
			v2, _ := strconv.ParseFloat(parts[1], 64)
			return (v1 + v2) / 2
		}
	}
	val, _ := strconv.ParseFloat(hdpStr, 64)
	return val
}
