package models

import (
	"time"
)

type BetSlip struct {
	ID      uint  `gorm:"primaryKey" json:"id"`
	UserID  uint  `json:"user_id"`
	User    User  `gorm:"foreignKey:UserID;references:ID" json:"user"`
	MatchID uint  `json:"match_id"`
	Match   Match `gorm:"foreignKey:MatchID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;" json:"match"`

	// --- ข้อมูลทีม ---
	HomeTeam string `json:"home_team"`
	HomeLogo string `json:"home_logo"`
	AwayTeam string `json:"away_team"`
	AwayLogo string `json:"away_logo"`

	// --- ข้อมูลการเดิมพัน (หัวใจหลักของราคาพม่า) ---
	Pick   string  `json:"pick"` // "home", "away", "over", "under"
	Amount float64 `gorm:"column:amount" json:"total_stake"`

	// ราคาต่อรอง (Hdp/GoalTotal)
	Hdp float64 `json:"hdp" gorm:"type:decimal(10,2);default:0"` // เก็บแต้มต่อ (เช่น 0, 1, 2)

	// ราคาน้ำพม่า (สำคัญมาก)
	Price int `json:"price" gorm:"default:0"` // เก็บค่าน้ำ -80, -10, 50

	// ระบุว่าตอนที่แทง ใครเป็นทีมต่อ (ใช้คำนวณผล Handicap)
	IsHomeUpper bool `json:"is_home_upper" gorm:"default:true"`

	// --- สถานะและผลตอบแทน ---
	Odds   float64 `json:"odds"`                            // เก็บ Odds ทั่วไป (ถ้ามี)
	Payout float64 `json:"payout" gorm:"default:0"`         // ยอดที่จะได้หากชนะเต็ม
	Status string  `json:"status" gorm:"default:'pending'"` // pending, win, win_half, lost, lost_half, draw

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
