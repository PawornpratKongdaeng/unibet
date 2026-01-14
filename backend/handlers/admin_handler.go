package handlers

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ✅ 1. เพิ่มฟังก์ชัน GetUserID เพื่อดึงข้อมูลจาก Locals (ที่ Middleware เซตไว้)
func GetUserID(c *fiber.Ctx) uint {
	id, ok := c.Locals("user_id").(uint)
	if !ok {
		return 0
	}
	return id
}

func GetNextUsername(c *fiber.Ctx) error {
	// ✅ ปรับการเรียกใช้ (ไม่ต้องใส่ database.DB แล้ว)
	return c.JSON(fiber.Map{"next_username": generateUsername()})
}

// ✅ 2. ปรับ generateUsername ให้ใช้ database.DB ภายในตัวเลย ไม่ต้องรับพารามิเตอร์
func generateUsername() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for {
		newUsername := fmt.Sprintf("Thunibet%d", r.Intn(90000)+10000)
		var count int64
		// ใช้ database.DB โดยตรง
		database.DB.Model(&models.User{}).Where("username = ?", newUsername).Count(&count)
		if count == 0 {
			return newUsername
		}
	}
}
func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	// ดึงข้อมูลผู้ใช้ทั้งหมด (เรียงตาม ID ล่าสุด)
	if err := database.DB.Order("id desc").Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลผู้ใช้ได้"})
	}
	return c.JSON(users)
}

// ✅ แก้ปัญหา undefined: handlers.UpdateUser
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User

	// ตรวจสอบว่ามี User นี้จริงไหม
	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
	}

	// รับข้อมูลที่จะอัปเดต (เช่น ชื่อ, นามสกุล, เบอร์โทร)
	if err := c.BodyParser(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "อัปเดตข้อมูลไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตผู้ใช้งานเรียบร้อย", "user": user})
}

// ✅ แก้ปัญหา undefined: handlers.GetAllBets
func GetAllBets(c *fiber.Ctx) error {
	var bets []models.BetSlip // เปลี่ยนจาก models.Bet เป็น models.BetSlip

	// Preload("User") เพื่อดูว่าใครแทง และ Preload("Match") เพื่อดูรายละเอียดคู่บอล
	if err := database.DB.Preload("User").Preload("Match").Order("id desc").Find(&bets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงรายการเดิมพันได้"})
	}

	return c.JSON(bets)
}

// POST /api/v3/admin/users/:id/credit
// [ADMIN/AGENT] เติมเงินให้ลูกค้า (หักจากยอดเครดิตของ Agent)
func AdjustUserBalance(c *fiber.Ctx) error {
	// 1. ดึง ID ของ Agent ที่กำลัง Login อยู่
	agentID := c.Locals("user_id").(uint)
	targetUserID := c.Params("id")

	type Request struct {
		Amount float64 `json:"amount"`
		Type   string  `json:"type"`
		Note   string  `json:"note"`
	}

	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var agent models.User
		var targetUser models.User

		// 2. Lock และเช็คเครดิต Agent (คนที่กดเติม)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&agent, agentID).Error; err != nil {
			return fmt.Errorf("ไม่พบข้อมูล Agent")
		}

		// 3. Lock และเช็คข้อมูลลูกค้า (คนที่จะรับเงิน)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&targetUser, targetUserID).Error; err != nil {
			return fmt.Errorf("ไม่พบข้อมูลลูกค้า")
		}

		if body.Type == "deposit" {
			// เช็คว่า Agent มีเงินพอให้หักไหม
			if agent.Credit < body.Amount {
				return fmt.Errorf("เครดิตของคุณไม่เพียงพอสำหรับการเติมเงิน")
			}

			// --- ขั้นตอนการโยกเงิน ---
			// หักเงิน Agent
			tx.Model(&agent).Update("credit", gorm.Expr("credit - ?", body.Amount))
			// เพิ่มเงิน User
			tx.Model(&targetUser).Update("credit", gorm.Expr("credit + ?", body.Amount))

		} else {
			// กรณี Withdraw (ดึงเงินลูกค้ากลับเข้ากระเป๋า Agent)
			if targetUser.Credit < body.Amount {
				return fmt.Errorf("ยอดเงินลูกค้าไม่เพียงพอให้ดึงกลับ")
			}
			tx.Model(&targetUser).Update("credit", gorm.Expr("credit - ?", body.Amount))
			tx.Model(&agent).Update("credit", gorm.Expr("credit + ?", body.Amount))
		}

		// 4. บันทึก Transaction Log (ฝั่ง User)
		tx.Create(&models.Transaction{
			UserID:       targetUser.ID,
			Amount:       body.Amount,
			Type:         body.Type,
			Status:       "approved",
			BalanceAfter: targetUser.Credit + body.Amount, // คำนวณยอดหลังทำรายการ
			Note:         fmt.Sprintf("[AGENT:%s] %s", agent.Username, body.Note),
		})

		return c.JSON(fiber.Map{"message": "ดำเนินการเรียบร้อย"})
	})
}

// DELETE /api/v3/admin/users/:id
func DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if err := database.DB.Delete(&models.User{}, userID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ลบไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{"message": "ลบผู้ใช้เรียบร้อย"})
}

// ฟังก์ชันสุ่มชื่อผู้ใช้ใหม่ (ใช้ตอนสมัครสมาชิก)
func GenerateNextUsername(c *fiber.Ctx) error {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for {
		newUsername := fmt.Sprintf("Thunibet%d", r.Intn(90000)+10000)
		var count int64
		database.DB.Model(&models.User{}).Where("username = ?", newUsername).Count(&count)
		if count == 0 {
			return c.JSON(fiber.Map{"next_username": newUsername})
		}
	}
}
