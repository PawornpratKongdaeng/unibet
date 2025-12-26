package models

import (
	"time"
)

type Transaction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"user_id"`   // ใครเป็นคนทำรายการ
	TargetID      *uint     `json:"target_id"` // ใช้กรณี transfer (โอนให้ใคร)
	Amount        float64   `json:"amount"`
	Type          string    `json:"type"`                          // "deposit", "withdraw", "transfer"
	Status        string    `gorm:"default:pending" json:"status"` // "pending", "success", "rejected"
	BankName      string    `json:"bank_name"`                     // ธนาคารที่โอนเข้า/ถอนออก
	BankAccount   string    `json:"bank_account"`                  // เลขบัญชี
	BalanceBefore float64   `json:"balance_before"`
	BalanceAfter  float64   `json:"balance_after"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
