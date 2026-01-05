// models/api_result.go
package models

type HtayResultResponse struct {
	Status string        `json:"status"`
	Data   []MatchResult `json:"data"`
}

type MatchResult struct {
	ID       string `json:"id"`
	HomeTeam string `json:"home_team"`
	AwayTeam string `json:"away_team"`
	Status   string `json:"status"`    // "completed"
	OddsTeam string `json:"odds_team"` // ทีมที่ต่อ (home หรือ away)
	Odds     struct {
		Handicap struct {
			HomeLine  string  `json:"home_line"` // เช่น "-1", "+0.5"
			AwayLine  string  `json:"away_line"`
			HomePrice float64 `json:"home_price"`
			AwayPrice float64 `json:"away_price"`
		} `json:"handicap"`
	} `json:"odds"`
	Scores struct {
		FullTime struct {
			Home int `json:"home"`
			Away int `json:"away"`
		} `json:"full_time"`
	} `json:"scores"`
}

// APIResponse สำหรับรับค่า Array ของ Data
type APIResponse struct {
	Status string        `json:"status"`
	Data   []MatchResult `json:"data"`
}
