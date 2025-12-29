package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
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
func UpdateUserCredit(c *fiber.Ctx) error {
	userID := c.Params("id")

	// รับค่าจาก Body (ที่ส่งมาจาก fetch)
	type Request struct {
		Amount float64 `json:"amount"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// เริ่ม Transaction เพื่อความปลอดภัย
	dbTx := database.DB.Begin()

	// 1. อัปเดตเครดิต (ใช้ gorm.Expr เพื่อป้องกัน Race Condition)
	// หมายเหตุ: ตรวจสอบว่าใน DB ของคุณใช้ชื่อ "credit" หรือ "balance"
	result := dbTx.Model(&models.User{}).Where("id = ?", userID).
		UpdateColumn("credit", gorm.Expr("credit + ?", req.Amount))

	if result.Error != nil {
		dbTx.Rollback()
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปเดตเครดิตได้"})
	}

	// 2. (แนะนำ) บันทึกประวัติการเติมเงิน (Audit Log)
	// เพื่อให้เจ้าของเว็บเช็คได้ว่าแอดมินคนไหนเติมให้ใคร
	/*
		log := models.AdminLog{
			AdminID: c.Locals("admin_id").(uint), // ดึง ID แอดมินจาก Middleware
			Action:  "ADJUST_CREDIT",
			Target:  userID,
			Details: fmt.Sprintf("ปรับเครดิตจำนวน: %.2f", req.Amount),
		}
		dbTx.Create(&log)
	*/

	dbTx.Commit()
	return c.JSON(fiber.Map{"message": "อัปเดตเครดิตสำเร็จ"})
}
func GetMyBets(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	var bets []models.BetSlip

	// ✅ ต้องมี .Preload("Match") เพื่อให้ข้อมูลชื่อทีมในตาราง Match ถูกดึงออกมาด้วย
	if err := database.DB.Preload("Match").Where("user_id = ?", userID).Find(&bets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(bets)
}
