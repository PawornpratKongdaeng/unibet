package handlers

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ✅ 1. เพิ่มฟังก์ชัน GetUserID เพื่อดึงข้อมูลจาก Locals (ที่ Middleware เซตไว้)
func GetUserID(c *fiber.Ctx) uint {
	id, ok := c.Locals("user_id").(uint)
	if !ok {
		return 0
	}
	return id
}

func AdjustUserBalance(c *fiber.Ctx) error {
	targetID := c.Params("id")
	var req struct {
		Amount float64 `json:"amount"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := database.DB.Model(&models.User{}).Where("id = ?", targetID).
		UpdateColumn("credit", gorm.Expr("credit + ?", req.Amount)).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "อัปเดตเครดิตไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{"message": "อัปเดตเครดิตเรียบร้อย"})
}

func DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")

	// ตรวจสอบว่ามี User นี้อยู่จริงไหมก่อนลบ
	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งานนี้ในระบบ"})
	}

	// ลบผู้ใช้งาน (แนะนำเป็น Soft Delete หากโมเดลรองรับ)
	if err := database.DB.Delete(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถลบผู้ใช้งานได้"})
	}

	return c.JSON(fiber.Map{"message": "ลบผู้ใช้งานเรียบร้อยแล้ว"})
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
