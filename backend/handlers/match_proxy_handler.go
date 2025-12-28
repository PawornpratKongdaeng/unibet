package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gofiber/fiber/v2"
)

func GetHtayMatches(c *fiber.Ctx) error {
	category := c.Query("type", "live") // รับค่า moung, body-goalboung, live, results
	apiKey := "demoapi"
	url := fmt.Sprintf("https://htayapi.com/mmk-autokyay/v3/%s?key=%s", category, apiKey)

	// ใช้ http.Get เพื่อไปดึงข้อมูลจาก HtayAPI
	resp, err := http.Get(url)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch data from provider"})
	}
	defer resp.Body.Close()

	var result interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	return c.JSON(result)
}
