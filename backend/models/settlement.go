package models

import (
	"time"
)

type Settlement struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	AgentID     uint      `gorm:"index" json:"agent_id"`
	TotalAmount float64   `json:"total_amount"`
	Status      string    `json:"status"` // เช่น "pending", "completed"
	Remark      string    `json:"remark"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
