package services

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
		ID     string `json:"id"` // API ใช้ "id" เป็นตัวเลขแมตช์
		Status string `json:"status"`
		Scores struct {
			FullTime struct {
				Home int `json:"home"`
				Away int `json:"away"`
			} `json:"full_time"`
		} `json:"scores"`
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
	url := "https://htayapi.com/mmk-autokyay/moung?key=eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke"
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
		// เพิ่ม "COMPLETED" เข้าไปเพื่อให้ระบบยอมรับผลบอลคู่นี้
		finished := (s == "FT" || s == "FINISHED" || s == "CLOSED" || s == "COMPLETED")

		resultsMap[r.ID] = struct {
			Home, Away int
			IsFinished bool
		}{
			r.Scores.FullTime.Home, // ดึงคะแนนทีมเหย้า
			r.Scores.FullTime.Away, // ดึงคะแนนทีมเยือน
			finished,
		}
	}

	for _, bet := range pendingBets {
		matchKey := fmt.Sprintf("%d", bet.MatchID)
		res, exists := resultsMap[matchKey]

		if !exists || !res.IsFinished {
			continue
		}

		// คำนวณผลผ่าน Service
		status, payout := CalculatePayout(bet.Amount, bet.Odds, bet.Hdp, bet.Pick, res.Home, res.Away)

		// เริ่มบันทึกผล
		errTx := database.DB.Transaction(func(tx *gorm.DB) error {
			// 1. อัปเดตสถานะบิล
			updateResult := tx.Model(&bet).
				Where("id = ? AND status = ?", bet.ID, "pending").
				Updates(map[string]interface{}{
					"status": status,
					"payout": payout,
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
func CalculatePayout(amount float64, odds float64, hdp float64, pick string, homeScore int, awayScore int) (string, float64) {
	// คำนวณผลต่างประตู (Home - Away)
	diff := float64(homeScore - awayScore)

	// สรุปผลในมุมของทีมต่อ (Home)
	// สูตร: (ผลต่างประตู + ราคาต่อรอง)
	result := diff + hdp

	finalStatus := ""
	multiplier := 0.0

	// แปลง Odds พม่า/มาเลย์ เป็นตัวคูณ (Decimal Odds)
	// สมมติ odds ที่ส่งมาคือ 0.85 (น้ำดำ) ตัวคูณจะเป็น 1.85
	decimalOdds := 1 + odds

	if result > 0.25 {
		finalStatus = "win"
		multiplier = decimalOdds
	} else if result == 0.25 {
		finalStatus = "win_half"
		multiplier = 1 + (odds / 2) // ชนะครึ่ง: ได้ทุนคืน + กำไรครึ่งเดียว
	} else if result == 0 {
		finalStatus = "draw"
		multiplier = 1.0 // เสมอ: คืนทุน
	} else if result == -0.25 {
		finalStatus = "lose_half"
		multiplier = 0.5 // เสียครึ่ง: คืนทุนให้ครึ่งหนึ่ง
	} else {
		finalStatus = "loss"
		multiplier = 0.0 // เสียเต็ม
	}

	// ถ้า User แทงทีมรอง (Away) ให้สลับผลลัพธ์
	if pick == "away" {
		if finalStatus == "win" {
			finalStatus = "loss"
			multiplier = 0
		} else if finalStatus == "win_half" {
			finalStatus = "lose_half"
			multiplier = 0.5
		} else if finalStatus == "loss" {
			finalStatus = "win"
			multiplier = decimalOdds
		} else if finalStatus == "lose_half" {
			finalStatus = "win_half"
			multiplier = 1 + (odds / 2)
		}
		// draw ยังคงเป็น draw เหมือนเดิม
	}

	return finalStatus, amount * multiplier
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
