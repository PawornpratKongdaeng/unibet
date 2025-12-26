package models

import "time"

type AdminBank struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	BankName      string    `json:"bank_name"`      // เช่น "กสิกรไทย", "SCB"
	AccountName   string    `json:"account_name"`   // ชื่อเจ้าของบัญชี
	AccountNumber string    `json:"account_number"` // เลขบัญชี
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
