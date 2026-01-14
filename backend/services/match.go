package services

import (
	"fmt"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/go-resty/resty/v2"
	"gorm.io/gorm/clause"
)

// ใช้ตัวแปร client ร่วมกันใน package
var client = resty.New().SetTimeout(15 * time.Second)

func SyncMatchesFromAPI(path string) error {
	apiKey := "eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke"
	url := fmt.Sprintf("https://htayapi.com/mmk-autokyay/%s?key=%s", path, apiKey)

	var apiResponse models.HtayV3Response
	resp, err := client.R().
		SetHeader("User-Agent", "Mozilla/5.0").
		SetResult(&apiResponse).
		Get(url)

	if err != nil || resp.IsError() {
		return fmt.Errorf("API request failed: %v", err)
	}

	if len(apiResponse.Data.Matches) > 0 {
		for _, item := range apiResponse.Data.Matches {
			parsedTime, _ := time.Parse(time.RFC3339, item.StartTime)
			database.DB.Clauses(clause.OnConflict{
				Columns:   []clause.Column{{Name: "match_id"}},
				DoUpdates: clause.AssignmentColumns([]string{"home_team", "away_team", "start_time", "updated_at"}),
			}).Create(&models.Match{
				MatchID:   fmt.Sprintf("%d", item.MatchId),
				HomeTeam:  item.Home.EngName,
				AwayTeam:  item.Away.EngName,
				StartTime: parsedTime,
				Status:    "open",
				UpdatedAt: time.Now(),
			})
		}
	}
	return nil
}
