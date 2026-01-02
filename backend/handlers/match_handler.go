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
	apiKey := "demoapi"
	url := "https://htayapi.com/mmk-autokyay/v3/" + path + "?key=" + apiKey

	var result interface{}
	resp, err := client.R().
		// ✅ จำลองว่าเราเป็น Chrome Browser เพื่อหลบการโดนบล็อก
		SetHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36").
		SetResult(&result).
		Get(url)

	if err != nil {
		log.Printf("🚨 Network Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal Server Error"})
	}

	if resp.IsError() {
		// หากยังติด 403 ให้ลองดูรายละเอียดที่เขาส่งกลับมา
		log.Printf("⚠️ API External Error [%d]: %s", resp.StatusCode(), resp.String())
		return c.Status(resp.StatusCode()).JSON(fiber.Map{
			"error":      "API ภายนอกปฏิเสธการเชื่อมต่อ",
			"debug_info": resp.String(),
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
