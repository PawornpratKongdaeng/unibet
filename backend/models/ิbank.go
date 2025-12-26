package models

import "gorm.io/gorm"

type BankAccount struct {
	gorm.Model
	BankName      string `json:"bank_name"`      // เช่น กสิกรไทย, ไทยพาณิชย์
	AccountName   string `json:"account_name"`   // ชื่อเจ้าของบัญชี
	AccountNumber string `json:"account_number"` // เลขบัญชี
	IsActive      bool   `json:"is_active" gorm:"default:true"`
}

// models/transaction.go
