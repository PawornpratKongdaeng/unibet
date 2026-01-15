package models

import "time"

type ParlayTicket struct {
	ID          uint         `gorm:"primaryKey" json:"id"`
	UserID      uint         `json:"user_id"`
	Amount      float64      `json:"amount"`     // เงินต้น
	TotalOdds   float64      `json:"total_odds"` // ราคาน้ำรวม (จะคำนวณเมื่อจบหมด)
	Status      string       `json:"status"`     // pending, win, loss, draw
	Payout      float64      `json:"payout"`     // ยอดจ่ายจริง
	Price       int          `json:"price"`      // ค่าน้ำพม่า เช่น -80, 55
	IsHomeUpper bool         `json:"is_home_upper" gorm:"default:true"`
	Items       []ParlayItem `gorm:"foreignKey:TicketID" json:"items"`
	CreatedAt   time.Time
}

type ParlayItem struct {
	ID          uint    `gorm:"primaryKey"`
	TicketID    uint    `json:"ticket_id"`
	MatchID     string  `json:"match_id"`
	HomeTeam    string  `json:"home_team"`
	AwayTeam    string  `json:"away_team"`
	Hdp         float64 `json:"hdp"`
	Pick        string  `json:"pick"`
	Price       int     `json:"price"`
	IsHomeUpper bool    `json:"is_home_upper" gorm:"default:true"`
	Status      string  `json:"status"`
}
