package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Username string `gorm:"unique;not null" json:"username"`
	Password string `gorm:"not null" json:"-"`        // "-" คือไม่ส่งออกไปใน JSON เพื่อความปลอดภัย
	Role     string `gorm:"default:user" json:"role"` // admin, master, agent, user

	// --- ส่วนสำคัญของระบบ Agent ---
	Credit   float64 `json:"credit"`                       // เครดิตคงเหลือ
	ParentID *uint   `json:"parent_id"`                    // ID ของคนที่เป็นคนสร้าง (หัวหน้า)
	Parent   *User   `gorm:"foreignKey:ParentID" json:"-"` // ทำ Self-referencing สำหรับดึงข้อมูลสายบน

	Share float64 `gorm:"default:0" json:"share"` // % การถือหุ้น (เช่น 80%)
	Com   float64 `gorm:"default:0" json:"com"`   // % ค่าคอมมิชชั่น (เช่น 0.2%)
	// -----------------------------

	Status    string         `gorm:"default:active" json:"status"` // active, banned
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
