package models

import (
	"time"
)

type Settlement struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	AgentID       uint      `json:"agent_id"`
	AgentUsername string    `json:"agent_username"`
	TotalTurnover float64   `json:"total_turnover"`
	TotalWinLoss  float64   `json:"total_win_loss"`
	NetSettlement float64   `json:"net_settlement"`
	PeriodStart   time.Time `json:"period_start"`
	PeriodEnd     time.Time `json:"period_end"`
	CreatedAt     time.Time `json:"created_at"`
}
