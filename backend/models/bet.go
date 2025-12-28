package models

import (
	"time"
)

type BetSlip struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	UserID uint `json:"user_id"`
	// ✅ เปลี่ยนจาก string เป็น uint ให้ตรงกับ ID ของตาราง Match
	MatchID uint `json:"match_id"`

	// ✅ กำหนด relationship ให้ชัดเจน
	// foreignKey คือฟิลด์ใน BetSlip (MatchID)
	// references คือฟิลด์ใน Match (ID)
	Match Match `gorm:"foreignKey:MatchID;references:ID" json:"match"`

	HomeTeam  string    `json:"home_team"`
	HomeLogo  string    `json:"home_logo"`
	AwayLogo  string    `json:"away_logo"`
	AwayTeam  string    `json:"away_team"`
	Amount    float64   `json:"amount"`
	Odds      float64   `json:"odds"`
	Hdp       float64   `json:"hdp" gorm:"type:decimal(10,2);default:0"`
	Pick      string    `json:"pick"`
	Status    string    `json:"status" gorm:"default:'pending'"`
	Payout    float64   `json:"payout" gorm:"default:0"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
