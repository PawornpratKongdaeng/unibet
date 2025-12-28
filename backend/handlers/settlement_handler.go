package handlers

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"

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

// 2. ฟังก์ชันหลักในการดึงผลจาก API และจ่ายเงิน
func AutoSettlement() {
	log.Println("🔄 [Settlement] Starting process...")

	var pendingBets []models.BetSlip
	if err := database.DB.Where("status = ?", "pending").Find(&pendingBets).Error; err != nil {
		log.Printf("❌ [Settlement] DB Error: %v", err)
		return
	}

	if len(pendingBets) == 0 {
		log.Println("ℹ️ [Settlement] No pending bets.")
		return
	}

	client := resty.New().SetTimeout(15 * time.Second)
	// หมายเหตุ: อย่าลืมเปลี่ยน API Key จาก demoapi เป็น key จริงของคุณ
	url := "https://htayapi.com/mmk-autokyay/v3/results?key=demoapi"
	var apiData ResultsResponse

	resp, err := client.R().SetResult(&apiData).Get(url)
	if err != nil || resp.IsError() {
		log.Printf("❌ [Settlement] API Request Failed")
		return
	}

	// สร้าง Map เพื่อให้ค้นหาผลบอลตาม MatchID ได้เร็วขึ้น
	resultsMap := make(map[string]struct {
		Home, Away int
		IsFinished bool
	})
	for _, r := range apiData.Data {
		s := strings.ToUpper(r.Status)
		// เช็คสถานะที่ API ส่งมาว่าจบการแข่งขันหรือยัง
		finished := (s == "FT" || s == "FINISHED" || s == "CLOSED")
		resultsMap[r.MatchID] = struct {
			Home, Away int
			IsFinished bool
		}{r.HomeScore, r.AwayScore, finished}
	}

	for _, bet := range pendingBets {
		matchKey := fmt.Sprintf("%d", bet.MatchID)
		res, exists := resultsMap[matchKey]

		// ถ้าไม่มีผลบอลใน API หรือยังแข่งไม่จบ ให้ข้ามไปก่อน
		if !exists || !res.IsFinished {
			continue
		}

		// เรียกฟังก์ชันคำนวณผลชนะ/แพ้
		status, payout := CalculatePayout(bet.Amount, bet.Odds, bet.Hdp, bet.Pick, res.Home, res.Away)

		// เริ่มกระบวนการจ่ายเงิน (DB Transaction)
		errTx := database.DB.Transaction(func(tx *gorm.DB) error {
			// 1. อัปเดตสถานะบิลเดิมพัน
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

			// 2. ถ้ามีการอัปเดตสำเร็จ และมียอดจ่ายเงิน (payout > 0) ให้เพิ่มเครดิตให้ User
			if updateResult.RowsAffected > 0 && payout > 0 {
				if err := tx.Model(&models.User{}).Where("id = ?", bet.UserID).
					UpdateColumn("credit", gorm.Expr("credit + ?", payout)).Error; err != nil {
					return err
				}

				// 3. บันทึกประวัติการรับเงิน (Transaction Log)
				logEntry := models.Transaction{
					UserID: bet.UserID,
					Amount: payout,
					Type:   "win",
					Status: "approved",
				}
				if err := tx.Create(&logEntry).Error; err != nil {
					return err
				}
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

	// คำนวณกำไรเต็มตามราคาน้ำ (เช่น @76 คือ กำไร 76% ของเงินต้น)
	profitFull := (amount * odds) / 100

	switch {
	case finalDiff >= 0.5:
		// ชนะเต็ม: คืนทุน + กำไรเต็ม
		return "win", amount + profitFull

	case finalDiff == 0.25:
		// ชนะครึ่ง: คืนทุน + กำไรครึ่งเดียว
		return "win_half", amount + (profitFull / 2)

	case finalDiff == 0:
		// เสมอ (เจ๊า): คืนทุนเดิม
		return "draw", amount

	case finalDiff == -0.25:
		// เสียครึ่ง: คืนเงินต้นให้ครึ่งเดียว
		return "lose_half", amount / 2

	default:
		// แพ้เต็ม: ไม่ได้เงินคืน
		return "loss", 0
	}
}

// 4. ฟังก์ชันเสริมสำหรับแปลง HDP กรณี API ส่งมาเป็นสตริงแบบ "0.5/1" (ถ้าจำเป็น)
func parseHdp(hdpStr string) float64 {
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
