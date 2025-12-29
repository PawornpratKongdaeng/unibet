package models

import (
	"time"
)

type TopupRequest struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"-"` // ความสัมพันธ์กับตาราง User
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`                          // "deposit" หรือ "withdraw"
	SlipURL   string    `json:"slip_url"`                      // ที่อยู่ไฟล์รูปสลิป
	Status    string    `json:"status" gorm:"default:pending"` // pending, approved, rejected
	CreatedAt time.Time `json:"created_at"`
}
