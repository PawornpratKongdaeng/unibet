package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

// GetSettings ดึงค่าการตั้งค่า ID 1
func GetSettings(c *fiber.Ctx) error {
	var settings models.SystemSetting
	// ค้นหา ID 1 ถ้าไม่มีให้สร้าง default
	result := database.DB.First(&settings, 1)
	if result.Error != nil {
		settings = models.SystemSetting{
			ID:        1, 
			SiteName:  "Soccer App", 
			MinBet:    50,
			MaxBet:    50000,
			MaxPayout: 200000,
		}
		database.DB.Create(&settings)
	}
	return c.JSON(settings)
}

// UpdateSettings อัปเดตข้อมูล
func UpdateSettings(c *fiber.Ctx) error {
	var body models.SystemSetting
	if err := c.BodyParser(&body); err != nil {
		// ✅ เปลี่ยนจาก fiber.H เป็น fiber.Map
		return c.Status(400).JSON(fiber.Map{"error": "Cannot parse JSON"})
	}

	// อัปเดตข้อมูลโดยยึด ID: 1 เสมอ
	// ใช้ Select("*") เพื่อให้มั่นใจว่าค่า Boolean (false) จะถูกอัปเดตลง DB ด้วย
	err := database.DB.Model(&models.SystemSetting{}).Where("id = ?", 1).Select("*").Updates(body).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update settings"})
	}

	// ✅ เปลี่ยนจาก fiber.H เป็น fiber.Map
	return c.JSON(fiber.Map{
		"message": "Settings updated successfully",
		"status":  "success",
	})
}