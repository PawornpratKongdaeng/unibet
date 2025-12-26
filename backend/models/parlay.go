package models

import "time"

type ParlayTicket struct {
	ID        uint         `gorm:"primaryKey" json:"id"`
	UserID    uint         `json:"user_id"`
	Amount    float64      `json:"amount"`     // เงินต้น
	TotalOdds float64      `json:"total_odds"` // ราคาน้ำรวม (จะคำนวณเมื่อจบหมด)
	Status    string       `json:"status"`     // pending, win, loss, draw
	Payout    float64      `json:"payout"`     // ยอดจ่ายจริง
	Items     []ParlayItem `gorm:"foreignKey:TicketID"`
	CreatedAt time.Time
}

type ParlayItem struct {
	ID       uint    `gorm:"primaryKey"`
	TicketID uint    `json:"ticket_id"`
	MatchID  string  `json:"match_id"`
	Hdp      float64 `json:"hdp"` // เปลี่ยนจาก HDP เป็น Hdp ให้เหมือนกัน
	Pick     string  `json:"pick"`
	Odds     float64 `json:"odds"`
	Status   string  `json:"status"` // pending, win, win_half, draw, lose_half, loss
}
