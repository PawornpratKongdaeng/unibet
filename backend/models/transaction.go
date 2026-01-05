package models

import (
	"time"
)

type Transaction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"user_id"`
	User          User      `gorm:"foreignKey:UserID" json:"User"`
	Amount        float64   `json:"amount"`
	Type          string    `json:"type"`
	Status        string    `gorm:"default:'pending'" json:"status"`
	BankName      string    `json:"bank_name"`
	BankAccount   string    `json:"account_number"` // เปลี่ยน tag เป็น account_number ให้ตรงกับ Frontend
	AccountName   string    `json:"account_name"`   // เพิ่มฟิลด์ชื่อบัญชี
	BalanceBefore float64   `json:"balance_before"`
	BalanceAfter  float64   `json:"balance_after"`
	SlipURL       string    `json:"slip_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
