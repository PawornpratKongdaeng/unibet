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
	// ดึงข้อมูลหัวหน้าจาก Locals (ตรวจสอบให้แน่ใจว่า Middleware ของคุณส่งมาเป็น *models.User)
	parent, ok := c.Locals("user").(*models.User)
	if !ok {
		// กรณี Middleware ส่งมาแค่ ID ให้ดึงข้อมูลใหม่ หรือแจ้ง Error
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลผู้สร้างได้"})
	}

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
	if parent.Role == "admin" && (req.Role == "master" || req.Role == "agent" || req.Role == "user") {
		isValid = true
	} else if parent.Role == "master" && (req.Role == "agent" || req.Role == "user") {
		isValid = true
	} else if parent.Role == "agent" && req.Role == "user" {
		isValid = true
	}

	if !isValid {
		return c.Status(403).JSON(fiber.Map{"error": "คุณไม่มีสิทธิ์สร้างสมาชิกในระดับนี้"})
	}

	// 3. ตรวจสอบค่า Share ห้ามเกินหัวหน้า
	if parent.Role != "admin" && req.Share > parent.Share {
		return c.Status(400).JSON(fiber.Map{"error": "ห้ามตั้งค่าหุ้นเกินกว่าที่คุณถืออยู่"})
	}

	// 4. เข้ารหัสรหัสผ่าน
	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

	newUser := models.User{
		Username: req.Username,
		Password: string(hashed),
		Role:     req.Role,
		ParentID: &parent.ID,
		Share:    req.Share,
		Com:      req.Com,
		Credit:   0,
		Status:   "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ชื่อผู้ใช้งานนี้ถูกใช้ไปแล้ว"})
	}

	return c.JSON(fiber.Map{"message": "สร้างบัญชีสำเร็จ", "user": newUser})
}

// --- Step 3: การโอนเครดิต (Transfer Credit) ---
func TransferCredit(c *fiber.Ctx) error {
	var body struct {
		ReceiverUsername string  `json:"username"`
		Amount           float64 `json:"amount"`
	}

	if err := c.BodyParser(&body); err != nil || body.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง หรือยอดเงินต้องมากกว่า 0"})
	}

	// 1. ดึง ID ผู้โอน (รองรับทั้ง float64 จาก JWT หรือ uint)
	var senderID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		senderID = uint(v)
	case uint:
		senderID = v
	}

	// 2. เริ่มต้น Database Transaction
	return database.DB.Transaction(func(tx *gorm.DB) error {
		var sender models.User
		if err := tx.First(&sender, senderID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้โอน"})
		}

		// 3. ตรวจสอบเครดิตผู้โอน
		if sender.Credit < body.Amount {
			return c.Status(400).JSON(fiber.Map{"error": "เครดิตของคุณไม่เพียงพอ"})
		}

		// 4. ค้นหาผู้รับ
		var receiver models.User
		if err := tx.Where("username = ?", body.ReceiverUsername).First(&receiver).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้รับคนนี้ในระบบ"})
		}

		// ตรวจสอบสิทธิ์: โอนให้คนในสายงานตัวเองเท่านั้น (ยกเว้น Admin โอนได้ทุกคน)
		if sender.Role != "admin" {
			if receiver.ParentID == nil || *receiver.ParentID != sender.ID {
				return c.Status(403).JSON(fiber.Map{"error": "คุณสามารถโอนให้สมาชิกภายใต้สายงานของคุณเท่านั้น"})
			}
		}

		// 5. บันทึกยอดเงินก่อนโอน เพื่อลง Log
		balanceBefore := sender.Credit
		balanceAfter := sender.Credit - body.Amount

		// 6. อัปเดตเครดิต (Atomic operations)
		if err := tx.Model(&sender).Update("credit", gorm.Expr("credit - ?", body.Amount)).Error; err != nil {
			return err
		}
		if err := tx.Model(&receiver).Update("credit", gorm.Expr("credit + ?", body.Amount)).Error; err != nil {
			return err
		}

		// 7. บันทึก Transaction Log (ปรับให้เข้ากับ Model ใหม่)
		log := models.Transaction{
			UserID:        sender.ID,
			TargetID:      &receiver.ID, // ใช้ Pointer ตาม Model
			Amount:        body.Amount,
			Type:          "transfer",
			Status:        "success",
			BalanceBefore: balanceBefore,
			BalanceAfter:  balanceAfter,
		}
		if err := tx.Create(&log).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{
			"message":     "โอนเครดิตสำเร็จ!",
			"new_balance": balanceAfter,
		})
	})
}

// --- สรุปยอดเคลียร์เงิน ---
func GetSettlementSummary(c *fiber.Ctx) error {
	// ดึงข้อมูลเอเย่นต์
	var agentID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		agentID = uint(v)
	case uint:
		agentID = v
	}

	var agent models.User
	database.DB.First(&agent, agentID)

	type SettlementResult struct {
		TotalTurnover float64 `json:"total_turnover"`
		TotalWinLoss  float64 `json:"total_win_loss"`
		AgentShareAmt float64 `json:"agent_share_amt"`
		AgentComAmt   float64 `json:"agent_com_amt"`
		NetSettlement float64 `json:"net_settlement"`
	}

	var result SettlementResult

	// คำนวณยอดจากลูกทีม
	database.DB.Table("users").
		Select("COALESCE(SUM(bets.amount), 0) as total_turnover, "+
			"(COALESCE(SUM(bets.amount), 0) - COALESCE(SUM(bets.payout), 0)) as total_win_loss").
		Joins("LEFT JOIN bets ON bets.user_id = users.id").
		Where("users.parent_id = ?", agent.ID).
		Scan(&result)

	result.AgentShareAmt = result.TotalWinLoss * (agent.Share / 100)
	result.AgentComAmt = result.TotalTurnover * (agent.Com / 100)
	result.NetSettlement = result.AgentShareAmt + result.AgentComAmt

	return c.JSON(result)
}

// --- ดึงประวัติการเคลียร์เงิน ---
func GetSettlementRecords(c *fiber.Ctx) error {
	userID := c.Locals("user_id")
	var records []models.Settlement

	err := database.DB.Where("agent_id = ?", userID).
		Order("created_at desc").
		Find(&records).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลประวัติได้"})
	}

	return c.JSON(records)
}

// --- ดึงรายชื่อลูกทีม ---
func GetTeam(c *fiber.Ctx) error {
	var agentID uint
	switch v := c.Locals("user_id").(type) {
	case float64:
		agentID = uint(v)
	case uint:
		agentID = v
	}

	var team []models.User
	err := database.DB.Where("parent_id = ?", agentID).Find(&team).Error
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ดึงข้อมูลลูกทีมไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"team": team})
}
