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
