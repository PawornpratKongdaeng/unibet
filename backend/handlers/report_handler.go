package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

func GetWinLossReport(c *fiber.Ctx) error {
	agent := c.Locals("user").(*models.User)

	// รับค่าจาก Query Params สำหรับการกรองวันที่ (เช่น ?start=2024-01-01&end=2024-01-31)
	startDate := c.Query("start")
	endDate := c.Query("end")

	type ReportRow struct {
		Username   string  `json:"username"`
		Turnover   float64 `json:"turnover"`
		Payout     float64 `json:"payout"`
		WinLoss    float64 `json:"win_loss"`
		Commission float64 `json:"commission"`
	}

	var report []ReportRow

	// ใช้ SQL Query เพื่อ Join ตาราง Users กับ Bets
	// และกรองเฉพาะลูกทีมที่มี ParentID ตรงกับ Agent คนนี้
	query := database.DB.Table("users").
		Select("users.username, "+
			"COALESCE(SUM(bets.amount), 0) as turnover, "+
			"COALESCE(SUM(bets.payout), 0) as payout, "+
			"(COALESCE(SUM(bets.amount), 0) - COALESCE(SUM(bets.payout), 0)) as win_loss, "+
			"(COALESCE(SUM(bets.amount), 0) * users.com / 100) as commission").
		Joins("LEFT JOIN bets ON bets.user_id = users.id").
		Where("users.parent_id = ?", agent.ID)

	if startDate != "" && endDate != "" {
		query = query.Where("bets.created_at BETWEEN ? AND ?", startDate, endDate)
	}

	query.Group("users.id").Scan(&report)

	return c.JSON(fiber.Map{
		"agent_username": agent.Username,
		"report":         report,
	})
}
