package handlers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// --- Step 2: สร้างสมาชิกใหม่ตามสายงาน ---
func CreateDownline(c *fiber.Ctx) error {
	// 1. ดึงข้อมูลหัวหน้า (คนที่ล็อกอินอยู่) จาก Middleware
	parent := c.Locals("user").(*models.User)

	type Request struct {
		Username string  `json:"username"`
		Password string  `json:"password"`
		Role     string  `json:"role"`  // master, agent, user
		Share    float64 `json:"share"` // % หุ้น
		Com      float64 `json:"com"`   // % ค่าคอม
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 2. ตรวจสอบลำดับขั้น (Hierarchy Logic)
	isValid := false
	if parent.Role == "admin" && req.Role == "master" {
		isValid = true
	}
	if parent.Role == "master" && req.Role == "agent" {
		isValid = true
	}
	if parent.Role == "agent" && req.Role == "user" {
		isValid = true
	}

	if !isValid {
		return c.Status(403).JSON(fiber.Map{"error": "คุณไม่มีสิทธิ์สร้างสมาชิกในระดับนี้"})
	}

	// 3. ตรวจสอบค่า Share ห้ามเกินหัวหน้า (ยกเว้น Admin)
	if parent.Role != "admin" && req.Share > parent.Share {
		return c.Status(400).JSON(fiber.Map{"error": "ห้ามตั้งค่าหุ้นเกินกว่าที่คุณถืออยู่"})
	}

	// 4. เข้ารหัสรหัสผ่าน
	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

	newUser := models.User{
		Username: req.Username,
		Password: string(hashed),
		Role:     req.Role,
		ParentID: &parent.ID, // ✅ ผูก ID ของหัวหน้า
		Share:    req.Share,
		Com:      req.Com,
		Credit:   0, // เริ่มต้นที่ 0
		Status:   "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว"})
	}

	return c.JSON(fiber.Map{"message": "สร้างบัญชีสำเร็จ", "user": newUser})
}

// --- Step 3: การโอนเครดิต (Transfer Credit) ---
func TransferCredit(c *fiber.Ctx) error {
	sender := c.Locals("user").(*models.User)

	type Request struct {
		ToUserID uint    `json:"to_user_id"`
		Amount   float64 `json:"amount"` // ยอดเงินที่จะโอน
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ตรวจสอบยอดเงินคนส่ง (ยกเว้น Admin ที่เสกเงินได้)
	if sender.Role != "admin" && sender.Credit < req.Amount {
		return c.Status(400).JSON(fiber.Map{"error": "เครดิตของคุณไม่พอ"})
	}

	// 2. ใช้ Database Transaction เพื่อความปลอดภัย (ต้องสำเร็จทั้งคู่หรือล้มเหลวทั้งคู่)
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var recipient models.User
		if err := tx.First(&recipient, req.ToUserID).Error; err != nil {
			return err // หาคนรับไม่เจอ
		}

		// 3. ตรวจสอบว่าเป็นลูกน้องในสายงานจริงไหม (ป้องกันการข้ามสาย)
		if recipient.ParentID == nil || *recipient.ParentID != sender.ID {
			return fiber.NewError(403, "สมาชิกคนนี้ไม่ได้อยู่ในสายงานของคุณ")
		}

		// 4. หักเงินคนส่ง (ถ้าไม่ใช่ Admin)
		if sender.Role != "admin" {
			if err := tx.Model(sender).Update("credit", sender.Credit-req.Amount).Error; err != nil {
				return err
			}
		}

		// 5. เพิ่มเงินคนรับ
		if err := tx.Model(&recipient).Update("credit", recipient.Credit+req.Amount).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "โอนเครดิตสำเร็จ"})
}
func GetSettlementSummary(c *fiber.Ctx) error {
	agent := c.Locals("user").(*models.User)

	type SettlementResult struct {
		TotalTurnover float64 `json:"total_turnover"`
		TotalWinLoss  float64 `json:"total_win_loss"`  // ยอดแพ้ชนะรวมของลูกทีม
		AgentShareAmt float64 `json:"agent_share_amt"` // ยอดที่เอเย่นต์ต้องรับผิดชอบ (ตาม % หุ้น)
		AgentComAmt   float64 `json:"agent_com_amt"`   // ค่าคอมมิชชั่นที่เอเย่นต์ได้รับ
		NetSettlement float64 `json:"net_settlement"`  // ยอดสุทธิที่ต้องเคลียร์กัน
	}

	var result SettlementResult

	// คำนวณยอดรวมจากลูกทีมทุกคน
	err := database.DB.Table("users").
		Select("COALESCE(SUM(bets.amount), 0) as total_turnover, "+
			"(COALESCE(SUM(bets.amount), 0) - COALESCE(SUM(bets.payout), 0)) as total_win_loss").
		Joins("LEFT JOIN bets ON bets.user_id = users.id").
		Where("users.parent_id = ?", agent.ID).
		Scan(&result).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "คำนวณยอดผิดพลาด"})
	}

	// คำนวณส่วนของเอเย่นต์ตาม Share และ Com ที่ผูกกับตัวเอเย่นต์เอง
	result.AgentShareAmt = result.TotalWinLoss * (agent.Share / 100)
	result.AgentComAmt = result.TotalTurnover * (agent.Com / 100)
	result.NetSettlement = result.AgentShareAmt + result.AgentComAmt

	return c.JSON(result)
}
func GetSettlementRecords(c *fiber.Ctx) error {
	agent := c.Locals("user").(*models.User)
	var records []models.Settlement

	// ดึงข้อมูลประวัติการเคลียร์เงินที่เคยบันทึกไว้ในฐานข้อมูล
	err := database.DB.Where("agent_id = ?", agent.ID).
		Order("created_at desc").
		Find(&records).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลประวัติได้"})
	}

	return c.JSON(records)
}
func GetTeam(c *fiber.Ctx) error {
	agent := c.Locals("user").(*models.User)
	var team []models.User

	// หา User ทุกคนที่มี ParentID เท่ากับ ID ของเอเย่นต์คนนี้
	err := database.DB.Where("parent_id = ?", agent.ID).Find(&team).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลลูกทีมไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"team": team})
}
