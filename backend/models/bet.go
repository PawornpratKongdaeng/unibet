package models

type BetSlip struct {
	ID      uint    `gorm:"primaryKey"`
	UserID  uint    `json:"user_id"`
	MatchID string  `json:"match_id"`
	Amount  float64 `json:"amount"`
	Odds    float64 `json:"odds"`
	Hdp     float64 `json:"hdp" gorm:"type:decimal(10,2);default:0"` // ระบุ Type ใน DB ให้ชัดเจน
	Pick    string  `json:"pick"`
	Status  string  `json:"status" gorm:"default:'pending'"`
	Payout  float64 `json:"payout" gorm:"default:0"`
}
