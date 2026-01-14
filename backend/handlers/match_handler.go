package handlers

import (
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm/clause"
)

// ตั้งค่า Client และ Cache
var (
	client     = resty.New().SetTimeout(15 * time.Second)
	matchCache *models.HtayResponse // เก็บข้อมูลใน RAM
	lastUpdate time.Time            // เวลาอัปเดตล่าสุด
	cacheMutex sync.RWMutex         // ล็อคป้องกัน Race Condition
)

// GetMatches: ดึงข้อมูลบอล (Proxy + Caching + Auto Sync)
func GetMatches(c *fiber.Ctx) error {
	path := c.Params("path")
	if path == "" || path == "feed" {
		path = "moung"
	}

	// 1. เช็ค Cache (ถ้าข้อมูลไม่เก่าเกิน 15 วินาที ใช้ของเดิม)
	cacheMutex.RLock()
	if time.Since(lastUpdate) < 15*time.Second && matchCache != nil {
		defer cacheMutex.RUnlock()
		// log.Println("✅ Serving from Cache") // เปิด log นี้ถ้าอยากเช็คว่า cache ทำงานไหม
		return c.JSON(matchCache)
	}
	cacheMutex.RUnlock()

	// 2. ดึงจาก External API
	apiKey := "eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke"

	// ⚠️ แก้ URL: ตัด /v3 ออก (ถ้า API จริงไม่มี /v3 ตรงนี้)
	// ลองเช็ค URL นี้ใน Browser ดูก่อนว่าได้ JSON ไหม: https://htayapi.com/mmk-autokyay/moung?key=...
	url := fmt.Sprintf("https://htayapi.com/mmk-autokyay/%s?key=%s", path, apiKey)

	var apiResponse models.HtayResponse

	resp, err := client.R().
		SetHeader("User-Agent", "Mozilla/5.0").
		SetResult(&apiResponse). // Auto Unmarshal JSON ใส่ตัวแปร
		Get(url)

	// --- 🔍 ส่วนดักจับ Error (สำคัญมาก) ---
	if err != nil {
		log.Printf("🔥 Network Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Cannot connect to external API", "details": err.Error()})
	}

	// ถ้า Status ไม่ใช่ 200 (เช่น 404, 403, 500 จากเว็บพม่า)
	if resp.IsError() {
		log.Printf("🔥 External API Error: Status %d", resp.StatusCode())
		log.Printf("🔥 Body: %s", resp.Body()) // ปริ้นให้เห็นว่าเขาตอบอะไรมา
		return c.Status(resp.StatusCode()).JSON(fiber.Map{
			"error":   "External API returned error",
			"status":  resp.StatusCode(),
			"message": string(resp.Body()), // ส่งข้อความ error กลับไปให้ Frontend เห็น
		})
	}
	// -------------------------------------

	// 3. อัปเดต Cache
	cacheMutex.Lock()
	matchCache = &apiResponse
	lastUpdate = time.Now()
	cacheMutex.Unlock()

	// 4. Background Sync ลง DB
	// เช็คก่อนว่ามี Data และ Matches ไหม กัน Panic
	if apiResponse.Data.Matches != nil && len(apiResponse.Data.Matches) > 0 {
		go syncMatchesToDB(apiResponse.Data.Matches)
	} else {
		log.Println("⚠️ Warning: No matches found in API response")
	}

	return c.JSON(apiResponse)
}

func syncMatchesToDB(items []models.HtayMatch) {
	var dbMatches []models.Match

	for _, item := range items {
		// ป้องกัน Panic กรณีข้อมูลบาง field เป็น null
		homeName := "Unknown"
		if item.Home.EngName != "" {
			homeName = item.Home.EngName
		}

		awayName := "Unknown"
		if item.Away.EngName != "" {
			awayName = item.Away.EngName
		}

		leagueName := "Unknown"
		if item.League.Name != "" {
			leagueName = item.League.Name
		}

		matchIDStr := fmt.Sprintf("%d", item.MatchId)

		parsedTime, err := time.Parse(time.RFC3339, item.StartTime)
		if err != nil {
			// ถ้า parse ไม่ได้ ให้ลองใช้เวลาปัจจุบัน หรือข้าม
			log.Printf("⚠️ Date Parse Error for match %s: %v", matchIDStr, err)
			continue
		}

		dbMatches = append(dbMatches, models.Match{
			MatchID:   matchIDStr,
			HomeTeam:  homeName,
			AwayTeam:  awayName,
			MatchTime: parsedTime.Format("15:04"),
			StartTime: parsedTime,
			Status:    "OPEN",
			League:    leagueName,
			UpdatedAt: time.Now(),
		})
	}

	if len(dbMatches) > 0 {
		err := database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "match_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"home_team", "away_team", "start_time", "league", "updated_at", "status"}),
		}).CreateInBatches(&dbMatches, 100).Error

		if err != nil {
			log.Printf("⚠️ DB Sync Error: %v", err)
		} else {
			// log.Printf("✅ Synced %d matches", len(dbMatches))
		}
	}
}
