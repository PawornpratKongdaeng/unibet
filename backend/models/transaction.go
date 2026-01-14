package models

import (
	"time"
)

type Transaction struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	UserID        uint      `json:"user_id"`
	User          User      `gorm:"foreignKey:UserID;references:ID" json:"user"`
	AdminID       *uint     `json:"admin_id"`
	Amount        float64   `json:"amount"`
	Type          string    `json:"type"`                            // deposit, withdraw, adjustment
	Status        string    `gorm:"default:'pending'" json:"status"` // pending, approved, rejected
	BankName      string    `json:"bank_name"`
	BankAccount   string    `json:"account_number"`
	AccountName   string    `json:"account_name"`
	BalanceBefore float64   `json:"balance_before"`
	BalanceAfter  float64   `json:"balance_after"`
	SlipURL       string    `json:"slip_url"`
	Note          string    `json:"note"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
