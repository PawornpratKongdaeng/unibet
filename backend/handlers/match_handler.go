package handlers

import (
	"log"
	"time"

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
