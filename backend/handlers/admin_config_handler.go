package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

// ดึงข้อมูลบัญชีล่าสุด (ใช้ ID 1 เป็นหลัก)
func GetAdminBank(c *fiber.Ctx) error {
	var bank models.AdminBank
	// ค้นหาข้อมูลแถวแรก ถ้าไม่มีให้สร้างข้อมูลเริ่มต้น
	database.DB.FirstOrCreate(&bank, models.AdminBank{ID: 1})
	return c.JSON(bank)
}

// อัปเดตข้อมูลบัญชีธนาคาร
func UpdateAdminBank(c *fiber.Ctx) error {
	var req models.AdminBank
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var bank models.AdminBank
	database.DB.First(&bank, 1)

	bank.BankName = req.BankName
	bank.AccountName = req.AccountName
	bank.AccountNumber = req.AccountNumber

	if err := database.DB.Save(&bank).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตบัญชีธนาคารสำเร็จ", "data": bank})
}
