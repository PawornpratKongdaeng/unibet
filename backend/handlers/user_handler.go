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
	// สมมติว่าคุณเก็บ user_id ไว้ใน locals หลังจากผ่าน middleware
	userID := c.Locals("user_id").(uint)

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// ✅ ต้องมั่นใจว่าส่ง balance กลับไปใน JSON
	return c.JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"balance":  user.Credit, // <--- จุดสำคัญ
		"role":     user.Role,
	})
}

func GetMe(c *fiber.Ctx) error {
	// 1. ดึง UserID จาก Middleware (ที่เก็บไว้ใน c.Locals ตอน Check Token)
	userID := c.Locals("user_id")

	if userID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	var user models.User
	// 2. ดึงข้อมูลจาก DB (เลือกเฉพาะฟิลด์ที่จำเป็นเพื่อความปลอดภัย)
	result := database.DB.Select("id", "username", "role", "credit").First(&user, userID)

	if result.Error != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// 3. ส่ง JSON กลับไป (ชื่อ field credit)
	return c.JSON(fiber.Map{
		"id":       user.ID,
		"username": user.Username,
		"role":     user.Role,
		"credit":   user.Credit, // ✅ ถูกต้อง! ชื่อ field credit ตรงกับที่ frontend รอรับ
	})
}
