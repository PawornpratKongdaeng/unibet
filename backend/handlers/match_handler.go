package handlers

import (
	"log"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

var client = resty.New().SetTimeout(10 * time.Second)

func GetMatches(c *fiber.Ctx) error {
	path := c.Params("path")
	apiKey := "demoapi" // ⚠️ หากมีคีย์จริงให้เปลี่ยนตรงนี้

	// ตรวจสอบ URL ที่สร้างขึ้นว่าถูกต้องไหม
	url := "https://htayapi.com/mmk-autokyay/v3/" + path + "?key=" + apiKey

	var result interface{}
	resp, err := client.R().
		SetResult(&result).
		Get(url)

	// 🔴 เพิ่มการ Log เพื่อดูสาเหตุที่ API ไม่มา
	if err != nil {
		log.Printf("Network Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "เชื่อมต่อ API ภายนอกไม่ได้"})
	}

	if resp.IsError() {
		log.Printf("API Error Response: %s", resp.String()) // จะเห็นว่า API ตอบกลับมาว่าอะไร (เช่น Key expired)
		return c.Status(resp.StatusCode()).JSON(fiber.Map{
			"error":   "API ตอบกลับผิดพลาด",
			"details": resp.String(),
		})
	}

	return c.JSON(result)
}
func SyncMatches() {
	log.Println("🔄 [Sync] Fetching fixtures from API...")

	client := resty.New()
	url := "https://htayapi.com/mmk-autokyay/v3/moung?key=demoapi"

	var apiResponse struct {
		Data []struct {
			MatchID   string `json:"match_id"`
			HomeName  string `json:"home_name"`
			AwayName  string `json:"away_name"`
			HomeLogo  string `json:"home_logo"`
			AwayLogo  string `json:"away_logo"`
			StartTime string `json:"start_time"`
		} `json:"data"`
	}

	_, err := client.R().SetResult(&apiResponse).Get(url)
	if err != nil {
		log.Println("❌ [Sync] API Error:", err)
		return
	}

	for _, m := range apiResponse.Data {
		// ใช้ FirstOrCreate หรือ Upsert เพื่อบันทึกลงตาราง matches
		// ✅ สำคัญ: ต้องบันทึก MatchID จาก API ลงคอลัมน์ match_id ใน DB
		database.DB.Where(models.Match{MatchID: m.MatchID}).Assign(models.Match{
			HomeTeam: m.HomeName, // แก้เป็นชื่อฟิลด์ใน Model ของคุณ
			AwayTeam: m.AwayName,
			HomeLogo: m.HomeLogo,
			AwayLogo: m.AwayLogo,
		}).FirstOrCreate(&models.Match{})
	}
	log.Printf("✅ [Sync] Updated %d matches in database", len(apiResponse.Data))
}
