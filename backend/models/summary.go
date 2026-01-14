package models

import "time"

type MatchSummary struct {
	MatchID    string    `json:"match_id"`
	HomeTeam   string    `json:"home_team"`
	AwayTeam   string    `json:"away_team"`
	StartTime  time.Time `json:"start_time"`
	TotalHome  float64   `json:"total_home"`
	TotalAway  float64   `json:"total_away"`
	TotalOver  float64   `json:"total_over"`
	TotalUnder float64   `json:"total_under"`
	TotalEven  float64   `json:"total_even"`
}
