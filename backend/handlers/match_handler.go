package handlers

import (
	"log"
	"os" // เพิ่ม os เพื่ออ่าน Environment Variables
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/go-resty/resty/v2"
	"github.com/gofiber/fiber/v2"
)

// ใช้ global client ตัวเดียวเพื่อประหยัด Resource
var client = resty.New().SetTimeout(10 * time.Second)

// ฟังก์ชันช่วยดึง API Key (ถ้าไม่มีใน Env ให้ใช้ demoapi)
func getAPIKey() string {
	key := os.Getenv("HTAY_API_KEY")
	if key == "" {
		return "demoapi"
	}
	return key
}

func GetMatches(c *fiber.Ctx) error {
	path := c.Params("path")
	apiKey := getAPIKey()
	url := "https://htayapi.com/mmk-autokyay/v3/" + path + "?key=" + apiKey

	var result interface{}
	resp, err := client.R().
		// ✅ จำลองว่าเป็น Browser เพื่อป้องกันการโดนบล็อก
		SetHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36").
		SetResult(&result).
		Get(url)

	if err != nil {
		log.Printf("🚨 Network Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "Internal Server Error"})
	}

	if resp.IsError() {
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

	apiKey := getAPIKey()
	url := "https://htayapi.com/mmk-autokyay/v3/moung?key=" + apiKey

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

	// ใช้ global client (ไม่ต้องสร้างใหม่ข้างในนี้)
	_, err := client.R().
		SetHeader("User-Agent", "Mozilla/5.0").
		SetResult(&apiResponse).
		Get(url)

	if err != nil {
		log.Println("❌ [Sync] API Error:", err)
		return
	}

	if len(apiResponse.Data) == 0 {
		log.Println("⚠️ [Sync] No data received from API")
		return
	}

	for _, m := range apiResponse.Data {
		// ✅ ใช้ MatchID จาก API เป็นตัวเช็คในฐานข้อมูล (ถ้ามีแล้วให้ Update ถ้าไม่มีให้ Create)
		database.DB.Where(models.Match{MatchID: m.MatchID}).Assign(models.Match{
			HomeTeam: m.HomeName,
			AwayTeam: m.AwayName,
			HomeLogo: m.HomeLogo,
			AwayLogo: m.AwayLogo,
			// เพิ่มฟิลด์อื่นๆ ตาม Model ของคุณที่นี่
		}).FirstOrCreate(&models.Match{})
	}

	log.Printf("✅ [Sync] Updated %d matches in database", len(apiResponse.Data))
}
