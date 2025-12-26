package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

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
	// 1. ดึง UserID จาก Middleware
	userID := c.Locals("user_id")

	if userID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user models.User
	// 2. ดึงข้อมูลจาก DB (เพิ่ม "phone" ลงใน Select)
	// หมายเหตุ: ตรวจสอบชื่อคอลัมน์ใน DB ของคุณ ปกติจะเป็น "phone" (ตัวพิมพ์เล็ก)
	result := database.DB.Select("id", "username", "role", "credit", "phone").First(&user, userID)

	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// 3. ส่ง JSON กลับไป
	return c.JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"phone":    user.Phone, // ✅ เปลี่ยน key เป็น "phone" (ตัวพิมพ์เล็ก) ให้ตรงกับ frontend
		"credit":   user.Credit,
	})
}
