package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

// GetAdminBetSlips ดึงข้อมูลบิลทั้งหมด
func GetAdminBetSlips(c *fiber.Ctx) error {
	db := database.DB

	// 1. รับค่า Query Params
	dateParam := c.Query("date")
	usernameParam := c.Query("username")
	filterType := c.Query("type")

	var betslips []models.BetSlip

	// 2. Query Data
	query := db.Model(&models.BetSlip{}).
		Preload("User").
		Preload("Items"). // ดึงรายการบอลสเต็ป (ถ้ามี)
		Preload("Match"). // ดึงข้อมูลแมตช์ (ถ้ามี)
		Order("created_at DESC")

	// Filter Logic
	if dateParam != "" {
		query = query.Where("DATE(created_at) = ?", dateParam)
	}
	if usernameParam != "" {
		query = query.Joins("JOIN users ON users.id = bet_slips.user_id").
			Where("users.username LIKE ?", "%"+usernameParam+"%")
	}
	if filterType == "incomplete" {
		query = query.Where("bet_slips.status = ?", "pending")
	}

	if err := query.Find(&betslips).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"status": "error", "message": err.Error()})
	}

	// ==========================================
	// 🔥 Response Structs
	// ==========================================
	type BetItemResponse struct {
		ID          uint    `json:"id"`
		MatchID     uint    `json:"match_id"`
		League      string  `json:"league"`
		HomeTeam    string  `json:"home_team"`
		AwayTeam    string  `json:"away_team"`
		Pick        string  `json:"pick"`
		Odds        float64 `json:"odds"`
		Hdp         float64 `json:"hdp"`
		Price       int     `json:"price"`
		IsHomeUpper bool    `json:"is_home_upper"`
		Status      string  `json:"status"`
	}

	type BetSlipResponse struct {
		ID          uint              `json:"id"`
		VoucherID   string            `json:"voucher_id"`
		Username    string            `json:"username"`
		Remark      string            `json:"remark"`
		TotalAmount float64           `json:"total_amount"`
		BetDate     time.Time         `json:"bet_date"`
		Action      string            `json:"action"`
		Items       []BetItemResponse `json:"items"`
	}

	var response []BetSlipResponse

	for _, b := range betslips {
		userName := "Unknown"
		if b.User.ID != 0 {
			userName = b.User.Username
		}
		vID := fmt.Sprintf("%s - %d", userName, b.ID)

		// ---------------------------------------------------------
		// 🔥 Logic Processing
		// ---------------------------------------------------------
		var displayItems []BetItemResponse

		// กรณีที่ 1: บอลสเต็ป (มี Items ใน DB)
		if len(b.Items) > 0 {
			for _, item := range b.Items {
				// ✅ แก้ไข: ใช้ b.Status (สถานะของบิลแม่) แทน item.Status ที่ไม่มีอยู่จริง
				displayItems = append(displayItems, BetItemResponse{
					ID:          item.ID,
					MatchID:     0, // ข้ามไปก่อนถ้าไม่มี field นี้
					HomeTeam:    item.HomeTeam,
					AwayTeam:    item.AwayTeam,
					Pick:        item.Pick,
					Odds:        item.Odds,
					Hdp:         item.Hdp,
					Price:       item.Price,
					IsHomeUpper: item.IsHomeUpper,
					Status:      b.Status, // ใช้สถานะของบิลแม่แทน
					// League: item.League, // ถ้าไม่มีใน DB ให้คอมเมนต์ออก
				})
			}
		}

		// กรณีที่ 2: บอลเต็ง (Single) - สร้าง Dummy Item จากหัวบิล
		if len(displayItems) == 0 {
			leagueName := ""
			if b.Match.ID != 0 {
				leagueName = b.Match.League
			}

			// แปลง Pointer MatchID
			var mID uint = 0
			if b.MatchID != nil {
				mID = *b.MatchID
			}

			dummyItem := BetItemResponse{
				ID:          0,
				MatchID:     mID,
				League:      leagueName,
				HomeTeam:    b.HomeTeam,
				AwayTeam:    b.AwayTeam,
				Pick:        b.Pick,
				Odds:        b.Odds,
				Hdp:         b.Hdp,
				Price:       b.Price,
				IsHomeUpper: b.IsHomeUpper,
				Status:      b.Status, // บอลเต็งใช้สถานะบิลได้เลย
			}
			displayItems = append(displayItems, dummyItem)
		}

		res := BetSlipResponse{
			ID:          b.ID,
			VoucherID:   vID,
			Username:    userName,
			Remark:      strings.ToUpper(b.Status),
			TotalAmount: b.Amount,
			BetDate:     b.CreatedAt,
			Action:      "DELETE",
			Items:       displayItems,
		}
		response = append(response, res)
	}

	return c.JSON(response)
}

// DeleteBetSlip เหมือนเดิม
func DeleteBetSlip(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := database.DB.Delete(&models.BetSlip{}, id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Delete failed"})
	}
	return c.JSON(fiber.Map{"status": "success", "message": "Betslip deleted"})
}
