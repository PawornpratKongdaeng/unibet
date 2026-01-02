package handlers

import (
	"errors"
	"fmt"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// --- 1. สร้างสมาชิกใหม่ตามสายงาน (Create Downline) ---
func CreateDownline(c *fiber.Ctx) error {
	// ดึงข้อมูลผู้สร้างจาก Middleware (ต้องเป็นตัวตนที่ Login อยู่)
	creator, ok := c.Locals("user").(*models.User)
	if !ok {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: ไม่สามารถระบุตัวตนผู้สร้างได้"})
	}

	type Request struct {
		Username  string  `json:"username"`
		Password  string  `json:"password"`
		Role      string  `json:"role"` // master, agent, user
		FirstName string  `json:"first_name"`
		LastName  string  `json:"last_name"`
		Phone     string  `json:"phone"`
		Share     float64 `json:"share"` // % ถือสู้
		Com       float64 `json:"com"`   // % ค่าคอม
	}

	var req Request
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูล Input ไม่ถูกต้อง"})
	}

	// [Logic] ตรวจสอบสิทธิ์การสร้าง (Hierarchy)
	isValidHierarchy := false
	switch creator.Role {
	case "admin":
		isValidHierarchy = (req.Role == "master" || req.Role == "agent" || req.Role == "user")
	case "master":
		isValidHierarchy = (req.Role == "agent" || req.Role == "user")
	case "agent":
		isValidHierarchy = (req.Role == "user")
	}

	if !isValidHierarchy {
		return c.Status(403).JSON(fiber.Map{"error": "ท่านไม่มีสิทธิ์สร้างสมาชิกในระดับ " + req.Role})
	}

	// [Logic] ตรวจสอบค่าหุ้นและค่าคอม (ห้ามเกินตัวพ่อ)
	if creator.Role != "admin" {
		if req.Share > creator.Share {
			return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("ค่า Share ห้ามเกิน %.2f%%", creator.Share)})
		}
		if req.Com > creator.Com {
			return c.Status(400).JSON(fiber.Map{"error": fmt.Sprintf("ค่า Com ห้ามเกิน %.2f%%", creator.Com)})
		}
	}

	// เข้ารหัส Password
	hashed, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

	newUser := models.User{
		Username:  req.Username,
		Password:  string(hashed),
		Role:      req.Role,
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		ParentID:  &creator.ID,
		Share:     req.Share,
		Com:       req.Com,
		Credit:    0,
		Status:    "active",
	}

	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Username นี้ถูกใช้งานไปแล้ว"})
	}

	return c.JSON(fiber.Map{"message": "สร้างบัญชีลูกข่ายสำเร็จ", "user_id": newUser.ID})
}

// --- 2. การจัดการเครดิต (Transfer Credit: Deposit/Withdraw) ---
func HandleCreditTransfer(c *fiber.Ctx) error {
	parentID := c.Locals("user_id").(uint) // ID ของคนโอน (Agent)

	type Request struct {
		ToUserID uint    `json:"to_user_id"`
		Amount   float64 `json:"amount"`
		Type     string  `json:"type"` // deposit หรือ withdraw
	}

	var req Request
	if err := c.BodyParser(&req); err != nil || req.Amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "จำนวนเงินหรือข้อมูลไม่ถูกต้อง"})
	}

	// เริ่ม Transaction เพื่อป้องกันเงินหาย
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		var parent, child models.User

		// ล็อกแถวใน DB ป้องกัน Race Condition
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&parent, parentID).Error; err != nil {
			return errors.New("ไม่พบข้อมูลผู้ทำรายการ")
		}
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&child, req.ToUserID).Error; err != nil {
			return errors.New("ไม่พบข้อมูลสมาชิกปลายทาง")
		}

		// ตรวจสอบว่าสายงานถูกต้องไหม (ลูกต้องมี ParentID ตรงกับคนโอน)
		if parent.Role != "admin" && (child.ParentID == nil || *child.ParentID != parent.ID) {
			return errors.New("สมาชิกท่านนี้ไม่ได้อยู่ในสายงานของท่าน")
		}

		var beforeBal, afterBal float64
		beforeBal = child.Credit

		if req.Type == "deposit" {
			// [เติมเงิน]
			if parent.Role != "admin" && parent.Credit < req.Amount {
				return errors.New("เครดิตของคุณไม่เพียงพอสำหรับการโอน")
			}
			afterBal = child.Credit + req.Amount

			if parent.Role != "admin" {
				tx.Model(&parent).Update("credit", gorm.Expr("credit - ?", req.Amount))
			}
			tx.Model(&child).Update("credit", afterBal)

		} else if req.Type == "withdraw" {
			// [ดึงเงินกลับ]
			if child.Credit < req.Amount {
				return errors.New("เครดิตของลูกข่ายไม่เพียงพอสำหรับการดึงคืน")
			}
			afterBal = child.Credit - req.Amount

			if parent.Role != "admin" {
				tx.Model(&parent).Update("credit", gorm.Expr("credit + ?", req.Amount))
			}
			tx.Model(&child).Update("credit", afterBal)
		} else {
			return errors.New("ประเภทรายการไม่ถูกต้อง")
		}

		// บันทึก Log การเงิน
		log := models.CreditLog{
			FromUserID: parent.ID,
			ToUserID:   child.ID,
			Amount:     req.Amount,
			Type:       req.Type,
			BeforeBal:  beforeBal,
			AfterBal:   afterBal,
		}
		return tx.Create(&log).Error
	})

	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"message": "ทำรายการเครดิตสำเร็จ"})
}

// --- 3. สรุปยอด Win/Loss และค่าคอม (Settlement Summary) ---
func GetSettlementSummary(c *fiber.Ctx) error {
	agentID := c.Locals("user_id").(uint)
	var agent models.User
	database.DB.First(&agent, agentID)

	type Result struct {
		TotalTurnover float64 `json:"total_turnover"`
		TotalWinLoss  float64 `json:"total_win_loss"`  // ยอดแพ้ชนะรวมของลูกทีม
		AgentShareAmt float64 `json:"agent_share_amt"` // ส่วนที่ Agent ต้องรับผิดชอบ
		AgentComAmt   float64 `json:"agent_com_amt"`   // ค่าคอมที่ Agent ได้
		NetSettlement float64 `json:"net_settlement"`  // ยอดสุทธิที่ต้องเคลียร์
	}

	var res Result

	// Query คำนวณยอดจาก Table Bets โดย Join กับลูกทีม
	database.DB.Table("users").
		Select("COALESCE(SUM(bets.amount), 0) as total_turnover, "+
			"COALESCE(SUM(bets.amount - bets.payout), 0) as total_win_loss").
		Joins("INNER JOIN bets ON bets.user_id = users.id").
		Where("users.parent_id = ?", agent.ID).
		Scan(&res)

	// คำนวณตามสัดส่วนของ Agent
	res.AgentShareAmt = res.TotalWinLoss * (agent.Share / 100)
	res.AgentComAmt = res.TotalTurnover * (agent.Com / 100)
	res.NetSettlement = res.AgentShareAmt + res.AgentComAmt

	return c.JSON(res)
}

// --- 4. ดึงรายชื่อลูกทีมพร้อม Pagination ---
func GetTeam(c *fiber.Ctx) error {
	agentID := c.Locals("user_id").(uint)

	var team []models.User
	err := database.DB.Where("parent_id = ?", agentID).
		Order("id DESC").
		Find(&team).Error

	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลทีมได้"})
	}

	return c.JSON(fiber.Map{"team": team})
}
