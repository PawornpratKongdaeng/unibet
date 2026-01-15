package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	Username    string  `gorm:"unique;not null" json:"username"`
	Password    string  `gorm:"not null" json:"-"`
	Role        string  `gorm:"default:user" json:"role"` // admin, user
	Phone       string  `json:"phone"`                    // เอา unique ออกเพื่อให้ค่าว่างซ้ำกันได้
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	FullName    string  `json:"fullName"` // สำหรับแสดงผลชื่อเต็ม
	BankName    string  `json:"bank_name"`
	BankAccount string  `json:"bank_account"` // เอา unique ออก
	Credit      float64 `gorm:"default:0" json:"credit"`

	// --- ส่วนที่แก้ไข ---
	ParentID *uint `json:"parent_id"`
	Parent   *User `json:"parent" gorm:"foreignKey:ParentID"` // ✅ เพิ่มบรรทัดนี้ครับ
	// ------------------

	Share     float64        `gorm:"default:0" json:"share"`
	Com       float64        `gorm:"default:0" json:"com"`
	Status    string         `json:"status" gorm:"default:active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
