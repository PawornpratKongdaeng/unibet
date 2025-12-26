// models/api_result.go
package models

type HtayResultResponse struct {
	Status string        `json:"status"`
	Data   []MatchResult `json:"data"`
}

type MatchResult struct {
	MatchID   string `json:"match_id"`
	HomeScore int    `json:"home_score"`
	AwayScore int    `json:"away_score"`
	Status    string `json:"status"` // เช่น "Finished" หรือ "FT"
}
