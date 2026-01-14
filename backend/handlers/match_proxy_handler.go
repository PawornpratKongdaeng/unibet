package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time" // เพิ่มสำหรับจัดการเวลา

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm/clause" // เพิ่มสำหรับใช้ Upsert (OnConflict)
)

func GetHtayMatches(c *fiber.Ctx) error {
	category := c.Query("type", "moung")
	apiKey := "eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke"

	url := fmt.Sprintf("https://htayapi.com/mmk-autokyay/%s?key=%s", category, apiKey)

	resp, err := http.Get(url)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch from HtayAPI"})
	}
	defer resp.Body.Close()

	// เรียกใช้จาก models โดยตรง
	var apiResponse models.HtayV3Response
	if err := json.NewDecoder(resp.Body).Decode(&apiResponse); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to parse JSON"})
	}

	// บันทึกลง Database
	for _, item := range apiResponse.Data.Matches {
		parsedTime, _ := time.Parse(time.RFC3339, item.StartTime)

		match := models.Match{
			// ระวังตัวพิมพ์เล็กพิมพ์ใหญ่: item.MatchId ต้องตรงกับที่นิยามใน models.HtayMatch
			MatchID:   fmt.Sprintf("%d", item.MatchId),
			HomeTeam:  item.Home.EngName,
			AwayTeam:  item.Away.EngName,
			StartTime: parsedTime,
			Status:    "open",
		}

		database.DB.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "match_id"}},
			DoUpdates: clause.AssignmentColumns([]string{"home_team", "away_team", "start_time"}),
		}).Create(&match)
	}

	return c.JSON(apiResponse)
}
