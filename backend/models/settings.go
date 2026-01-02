package models

import "time"

type SystemSetting struct {
	ID               uint      `gorm:"primaryKey" json:"id"`
	SiteName         string    `json:"site_name"`
	MaintenanceMode  bool      `json:"maintenance_mode"`
	MinBet           float64   `json:"min_bet"`
	MaxBet           float64   `json:"max_bet"`
	MaxPayout        float64   `json:"max_payout"`
	LineID           string    `json:"line_id"`
	TelegramLink     string    `json:"telegram_link"`
	MetaDescription  string    `json:"meta_description"`
	AnnouncementText string    `json:"announcement_text"`
	UpdatedAt        time.Time `json:"updated_at"`
}
