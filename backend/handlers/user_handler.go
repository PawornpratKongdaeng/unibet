package handlers

import (
	"fmt"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func getIDFromLocals(c *fiber.Ctx) uint {
	val := c.Locals("user_id")
	switch v := val.(type) {
	case uint:
		return v
	case float64:
		return uint(v)
	default:
		return 0
	}
}

// GET /api/v3/user/balance
func GetBalance(c *fiber.Ctx) error {
	var user models.User
	// สมมติว่าเป็น User ID 1 เสมอ
	if err := database.DB.First(&user, 1).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"username": user.Username,
		"balance":  user.Credit,
	})
}

func GetProfile(c *fiber.Ctx) error {
	userID := c.Locals("user_id").(uint)

	var user models.User
	// ดึงข้อมูลทั้งหมด (ไม่ใช้ Select) หรือระบุให้ครบ
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"balance":  user.Credit,
		"role":     user.Role,
		"phone":    user.Phone, // ✅ เพิ่มบรรทัดนี้
	})
}

func GetMe(c *fiber.Ctx) error {
	userID := getIDFromLocals(c)
	if userID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user models.User
	if err := database.DB.Select("id", "username", "role", "credit", "phone", "full_name").First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}
func UpdateUserCredit(c *fiber.Ctx) error {
	// 1. ดึง ID ของแอดมินที่ล็อกอินอยู่
	rawAgentID := c.Locals("user_id")
	var agentID uint
	if v, ok := rawAgentID.(float64); ok {
		agentID = uint(v)
	} else {
		agentID = rawAgentID.(uint)
	}

	targetUserID := c.Params("id")

	type Request struct {
		Amount float64 `json:"amount"`
		Type   string  `json:"type"` // "deposit" หรือ "withdraw"
		Note   string  `json:"note"`
	}
	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var agent models.User
		var user models.User

		if err := tx.First(&agent, agentID).Error; err != nil {
			return err
		}
		if err := tx.First(&user, targetUserID).Error; err != nil {
			return err
		}

		var newBalance float64
		balanceBefore := user.Credit

		if body.Type == "deposit" {
			if agent.Credit < body.Amount {
				return fmt.Errorf("ยอดเงินในสต็อกของคุณไม่เพียงพอ (คงเหลือ: %.2f)", agent.Credit)
			}
			// หักเงินเอเย่นต์ และ เพิ่มเงินยูสเซอร์
			tx.Model(&agent).Update("credit", gorm.Expr("credit - ?", body.Amount))
			tx.Model(&user).Update("credit", gorm.Expr("credit + ?", body.Amount))
			newBalance = balanceBefore + body.Amount
		} else {
			if user.Credit < body.Amount {
				return fmt.Errorf("ยอดเงินของลูกค้าไม่เพียงพอ")
			}
			// หักเงินยูสเซอร์ และ คืนเงินเข้าสต็อกเอเย่นต์
			tx.Model(&user).Update("credit", gorm.Expr("credit - ?", body.Amount))
			tx.Model(&agent).Update("credit", gorm.Expr("credit + ?", body.Amount))
			newBalance = balanceBefore - body.Amount
		}

		// บันทึก Log
		newTx := models.Transaction{
			UserID:        user.ID,
			AdminID:       &agentID,
			Amount:        body.Amount,
			Type:          body.Type,
			Status:        "approved",
			BalanceBefore: balanceBefore,
			BalanceAfter:  newBalance,
			Note:          body.Note,
			CreatedAt:     time.Now(),
		}

		if err := tx.Create(&newTx).Error; err != nil {
			return err
		}
		return c.JSON(fiber.Map{"message": "ดำเนินการสำเร็จ", "balance_after": newBalance})
	})
}
func GetMyBets(c *fiber.Ctx) error {
	userID := getIDFromLocals(c)
	var singleBets []models.BetSlip
	var parlayBets []models.ParlayTicket

	// ดึงบอลเต็ง
	database.DB.Preload("Match").Where("user_id = ?", userID).Order("created_at desc").Find(&singleBets)
	// ดึงบอลชุด
	database.DB.Preload("Items").Where("user_id = ?", userID).Order("created_at desc").Find(&parlayBets)

	return c.JSON(fiber.Map{
		"single": singleBets,
		"parlay": parlayBets,
	})
}
func GetUserProfile(c *fiber.Ctx) error {
	// ดึง userID จาก JWT (ที่เก็บไว้ใน Locals)
	userID := c.Locals("user_id").(float64)

	var user models.User
	if err := database.DB.First(&user, uint(userID)).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// ✅ ส่ง JSON กลับไป (GORM จะใช้ json tags จาก struct models.User)
	return c.JSON(user)
}
func GetBetHistory(c *fiber.Ctx) error {
	// 1. ดึง userID จาก Middleware
	var userID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		userID = uint(v)
	case uint:
		userID = v
	default:
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}

	// 2. เตรียมตัวแปรรับข้อมูล
	var singleBets []models.BetSlip
	var parlayBets []models.ParlayTicket

	// ✅ เพิ่ม Preload("Match") เพื่อดึงข้อมูลการแข่งขันมาด้วย
	database.DB.Preload("Match").Where("user_id = ?", userID).Order("created_at desc").Find(&singleBets)

	// ✅ เพิ่ม Preload("Items") สำหรับบอลชุด
	database.DB.Preload("Items").Where("user_id = ?", userID).Order("created_at desc").Find(&parlayBets)

	return c.JSON(fiber.Map{
		"status": "success",
		"data": fiber.Map{
			"single": singleBets,
			"parlay": parlayBets,
		},
	})
}
