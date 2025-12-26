package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`
	Role     string `gorm:"default:user" json:"role"` // admin, master, agent, user
	Phone    string `gorm:"unique;not null" json:"phone"`

	// --- ข้อมูลส่วนตัวและธนาคาร (เพิ่มใหม่) ---
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	BankName    string `json:"bank_name"`
	BankAccount string `gorm:"unique" json:"bank_account"`

	// --- ส่วนของระบบ Agent ---
	Credit   float64 `json:"credit"`
	ParentID *uint   `json:"parent_id"`
	Parent   *User   `gorm:"foreignKey:ParentID" json:"-"`

	Share float64 `gorm:"default:0" json:"share"`
	Com   float64 `gorm:"default:0" json:"com"`

	Status    string         `gorm:"default:active" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
