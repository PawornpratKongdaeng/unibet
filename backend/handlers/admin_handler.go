package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// 1. ดูรายชื่อสมาชิกทั้งหมด
func GetUsers(c *fiber.Ctx) error {
	var users []models.User
	// ดึงเฉพาะฟิลด์ที่จำเป็นเพื่อความปลอดภัย
	database.DB.Select("id", "username", "role", "credit", "created_at").Find(&users)
	return c.JSON(users)
}

// 2. ดูบิลการแทงทั้งหมดในระบบ
func GetAllBets(c *fiber.Ctx) error {
	var bets []models.BetSlip
	result := database.DB.Order("id desc").Limit(100).Find(&bets)

	if result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลบิลได้"})
	}
	return c.JSON(bets)
}

// 3. โครงสร้างรับข้อมูลสำหรับปรับปรุงยอดเงิน
type AdjustBalanceRequest struct {
	UserID uint    `json:"user_id"`
	Amount float64 `json:"amount"`
}

// 4. ฟังก์ชันปรับเงิน (ใช้ตัวนี้ตัวเดียวสำหรับปุ่ม ฝาก/ถอน)
func AdjustUserBalance(c *fiber.Ctx) error {
	// 1. รับ ID จาก URL (:id)
	id := c.Params("id")
	if id == "" || id == "0" || id == "undefined" {
		return c.Status(400).JSON(fiber.Map{"error": "ID ไม่ถูกต้อง"})
	}

	// 2. รับ Amount จาก Body
	type Request struct {
		Amount float64 `json:"amount" xml:"amount" form:"amount"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "รูปแบบจำนวนเงินไม่ถูกต้อง"})
	}

	// 3. อัปเดต DB
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้"})
	}

	newCredit := user.Credit + req.Amount
	if newCredit < 0 {
		return c.Status(400).JSON(fiber.Map{"error": "เครดิตติดลบไม่ได้"})
	}

	database.DB.Model(&user).Update("credit", newCredit)

	return c.JSON(fiber.Map{"message": "ปรับปรุงสำเร็จ", "new_credit": newCredit})
}

// 5. ดูสถิติการเงิน (Dashboard)
func GetFinancialStats(c *fiber.Ctx) error {
	var stats struct {
		TotalDeposit  float64 `json:"total_deposit"`
		TotalWithdraw float64 `json:"total_withdraw"`
		NetProfit     float64 `json:"net_profit"`
	}

	// คำนวณยอดฝาก
	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "deposit", "approved").
		Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalDeposit)

	// คำนวณยอดถอน
	database.DB.Model(&models.Transaction{}).
		Where("type = ? AND status = ?", "withdraw", "approved").
		Select("COALESCE(SUM(amount), 0)").Scan(&stats.TotalWithdraw)

	stats.NetProfit = stats.TotalDeposit - stats.TotalWithdraw

	return c.JSON(stats)
}

// handlers/admin_handler.go

func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")

	type UpdateInput struct {
		Credit float64 `json:"credit"`
		Role   string  `json:"role"`
	}
	if id == "" || id == "0" || id == "undefined" {
		return c.Status(400).JSON(fiber.Map{"message": "ID ผู้ใช้งานไม่ถูกต้อง"})
	}

	var input UpdateInput
	if err := c.BodyParser(&input); err != nil {
		// เปลี่ยนจาก fiber.H เป็น fiber.Map
		return c.Status(400).JSON(fiber.Map{"message": "รูปแบบข้อมูลไม่ถูกต้อง"})
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		// เปลี่ยนจาก fiber.H เป็น fiber.Map
		return c.Status(404).JSON(fiber.Map{"message": "ไม่พบผู้ใช้งานนี้ในระบบ"})
	}

	updateData := map[string]interface{}{
		"credit": input.Credit,
		"role":   input.Role,
	}

	if err := database.DB.Model(&user).Updates(updateData).Error; err != nil {
		// เปลี่ยนจาก fiber.H เป็น fiber.Map
		return c.Status(500).JSON(fiber.Map{"message": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	// เปลี่ยนจาก fiber.H เป็น fiber.Map
	return c.JSON(fiber.Map{
		"status":  "success",
		"message": "อัปเดตข้อมูลเรียบร้อยแล้ว",
		"data":    user,
	})
}
func GetUserDetail(c *fiber.Ctx) error {
	id := c.Params("id")

	// เพิ่มตรงนี้เพื่อแก้ Log ID = 0 ✅
	if id == "" || id == "0" || id == "undefined" {
		return c.Status(400).JSON(fiber.Map{"error": "ไม่ระบุไอดีผู้ใช้"})
	}

	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบสมาชิก"})
	}
	return c.JSON(user)
}
func HandleCreditAdjustment(c *fiber.Ctx) error {
	id := c.Params("id")

	// ดัก ID 0 หรือค่าว่างทันทีเพื่อไม่ให้เกิด Log record not found
	if id == "" || id == "0" || id == "undefined" {
		return c.Status(400).JSON(fiber.Map{"error": "ID ผู้ใช้งานไม่ถูกต้อง"})
	}

	type Request struct {
		Amount float64 `json:"amount"`
	}
	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// ใช้ Transaction เพื่อความปลอดภัย
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, id).Error; err != nil {
			return err // ถ้าหาไม่เจอจะ Rollback เอง
		}

		if err := tx.Model(&user).Update("credit", user.Credit+req.Amount).Error; err != nil {
			return err
		}
		log := models.Transaction{
			UserID: user.ID,
			Amount: req.Amount,
			Type:   "adjustment", // ระบุว่าเป็นการปรับปรุงโดยแอดมิน
			Status: "approved",
		}
		if err := tx.Create(&log).Error; err != nil {
			return err // ถ้าบันทึก Log ไม่สำเร็จ ให้ยกเลิกการเติมเงินด้วย
		}
		return nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ปรับปรุงเครดิตล้มเหลว"})
	}
	return c.JSON(fiber.Map{"message": "สำเร็จ"})
}
