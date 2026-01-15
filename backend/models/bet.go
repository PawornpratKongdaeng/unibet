package models

import (
	"time"
)

type BetSlip struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	UserID uint `json:"user_id"`
	User   User `gorm:"foreignKey:UserID;references:ID" json:"user"`

	// สำหรับบอลเต็ง (Single)
	MatchID *uint `json:"match_id"`
	Match   Match `gorm:"foreignKey:MatchID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"match"`

	// 🔥 field นี้จะทำงานได้ ต้องมี struct BetItem ด้านล่าง และมี field BetSlipID
	Items []BetItem `gorm:"foreignKey:BetSlipID" json:"items"`

	// --- ข้อมูลทีม ---
	HomeTeam string `json:"home_team"`
	HomeLogo string `json:"home_logo"`
	AwayTeam string `json:"away_team"`
	AwayLogo string `json:"away_logo"`

	// --- ข้อมูลการเดิมพัน ---
	Pick   string  `json:"pick"`
	Amount float64 `gorm:"column:amount" json:"total_stake"`

	Hdp         float64 `json:"hdp" gorm:"type:decimal(10,2);default:0"`
	Price       int     `json:"price" gorm:"default:0"`
	IsHomeUpper bool    `json:"is_home_upper" gorm:"default:true"`

	Odds   float64 `json:"odds"`
	Payout float64 `json:"payout" gorm:"default:0"`
	Status string  `json:"status" gorm:"default:'pending'"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// 🔥🔥🔥 เพิ่ม struct นี้ต่อท้ายในไฟล์ models.go 🔥🔥🔥
