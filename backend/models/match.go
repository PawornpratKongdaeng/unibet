package models

import (
	"time"

	"gorm.io/gorm"
)

type Match struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	MatchID   string         `gorm:"uniqueIndex" json:"match_id"` // ID จาก API นอก
	HomeTeam  string         `json:"home_team"`
	AwayTeam  string         `json:"away_team"`
	HomeLogo  string         `json:"home_logo"`
	AwayLogo  string         `json:"away_logo"`
	StartTime time.Time      `json:"start_time"`
	Status    string         `json:"status"` // เช่น "FT", "In-Play"
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
