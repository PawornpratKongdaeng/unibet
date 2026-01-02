package models

import "time"

type CreditLog struct {
	ID         uint      `gorm:"primaryKey"`
	FromUserID uint      `json:"from_user_id"` // ใครโอน
	ToUserID   uint      `json:"to_user_id"`   // โอนให้ใคร
	Amount     float64   `json:"amount"`       // จำนวน
	Type       string    `json:"type"`         // deposit / withdraw
	BeforeBal  float64   `json:"before_balance"`
	AfterBal   float64   `json:"after_balance"`
	CreatedAt  time.Time `json:"created_at"`
}
type TransferRequest struct {
	ToUserID uint    `json:"to_user_id" validate:"required"`
	Amount   float64 `json:"amount" validate:"required,gt=0"`
	Type     string  `json:"type" validate:"required,oneof=deposit withdraw"` // เติม หรือ ดึง
}
