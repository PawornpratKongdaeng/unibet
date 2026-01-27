package handlers

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ✅ 1. เพิ่มฟังก์ชัน GetUserID เพื่อดึงข้อมูลจาก Locals (ที่ Middleware เซตไว้)
func GetUserID(c *fiber.Ctx) uint {
	id, ok := c.Locals("user_id").(uint)
	if !ok {
		return 0
	}
	return id
}

func GetNextUsername(c *fiber.Ctx) error {
	// ✅ ปรับการเรียกใช้ (ไม่ต้องใส่ database.DB แล้ว)
	return c.JSON(fiber.Map{"next_username": generateUsername()})
}

// ✅ 2. ปรับ generateUsername ให้ใช้ database.DB ภายในตัวเลย ไม่ต้องรับพารามิเตอร์
func generateUsername() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for {
		newUsername := fmt.Sprintf("Thunibet%d", r.Intn(90000)+10000)
		var count int64
		// ใช้ database.DB โดยตรง
		database.DB.Model(&models.User{}).Where("username = ?", newUsername).Count(&count)
		if count == 0 {
			return newUsername
		}
	}
}
func GetUsers(c *fiber.Ctx) error {
	role := c.Locals("role").(string)
	userID := c.Locals("user_id").(uint)

	var users []models.User
	query := database.DB.Order("id desc")

	// ถ้าเป็น Agent -> ให้เห็นเฉพาะ User ที่มี ParentID เป็นตัว Agent เอง
	if role == "agent" {
		query = query.Where("parent_id = ?", userID)
	}

	// (ถ้าเป็น Admin ก็จะไม่ติด Where คือเห็นทั้งหมดเหมือนเดิม)

	if err := query.Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงข้อมูลผู้ใช้ได้"})
	}
	return c.JSON(users)
}

// ✅ แก้ปัญหา undefined: handlers.UpdateUser
func UpdateUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User

	// ตรวจสอบว่ามี User นี้จริงไหม
	if err := database.DB.First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "ไม่พบผู้ใช้งาน"})
	}

	// รับข้อมูลที่จะอัปเดต (เช่น ชื่อ, นามสกุล, เบอร์โทร)
	if err := c.BodyParser(&user); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if err := database.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "อัปเดตข้อมูลไม่สำเร็จ"})
	}

	return c.JSON(fiber.Map{"message": "อัปเดตผู้ใช้งานเรียบร้อย", "user": user})
}

// ✅ แก้ปัญหา undefined: handlers.GetAllBets
func GetAllBets(c *fiber.Ctx) error {
	var bets []models.BetSlip // เปลี่ยนจาก models.Bet เป็น models.BetSlip

	// Preload("User") เพื่อดูว่าใครแทง และ Preload("Match") เพื่อดูรายละเอียดคู่บอล
	if err := database.DB.Preload("User").Preload("Match").Order("id desc").Find(&bets).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถดึงรายการเดิมพันได้"})
	}

	return c.JSON(bets)
}

// POST /api/v3/admin/users/:id/credit
// [ADMIN/AGENT] เติมเงินให้ลูกค้า (หักจากยอดเครดิตของ Agent)
func AdjustUserBalance(c *fiber.Ctx) error {
	// 1. ดึง ID ของ Agent ที่กำลัง Login อยู่
	agentID := c.Locals("user_id").(uint)
	targetUserID := c.Params("id")

	type Request struct {
		Amount float64 `json:"amount"`
		Type   string  `json:"type"`
		Note   string  `json:"note"`
	}

	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var agent models.User
		var targetUser models.User

		// 2. Lock และเช็คเครดิต Agent (คนที่กดเติม)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&agent, agentID).Error; err != nil {
			return fmt.Errorf("ไม่พบข้อมูล Agent")
		}

		// 3. Lock และเช็คข้อมูลลูกค้า (คนที่จะรับเงิน)
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&targetUser, targetUserID).Error; err != nil {
			return fmt.Errorf("ไม่พบข้อมูลลูกค้า")
		}

		if body.Type == "deposit" {
			// เช็คว่า Agent มีเงินพอให้หักไหม
			if agent.Credit < body.Amount {
				return fmt.Errorf("เครดิตของคุณไม่เพียงพอสำหรับการเติมเงิน")
			}

			// --- ขั้นตอนการโยกเงิน ---
			// หักเงิน Agent
			tx.Model(&agent).Update("credit", gorm.Expr("credit - ?", body.Amount))
			// เพิ่มเงิน User
			tx.Model(&targetUser).Update("credit", gorm.Expr("credit + ?", body.Amount))

		} else {
			// กรณี Withdraw (ดึงเงินลูกค้ากลับเข้ากระเป๋า Agent)
			if targetUser.Credit < body.Amount {
				return fmt.Errorf("ยอดเงินลูกค้าไม่เพียงพอให้ดึงกลับ")
			}
			tx.Model(&targetUser).Update("credit", gorm.Expr("credit - ?", body.Amount))
			tx.Model(&agent).Update("credit", gorm.Expr("credit + ?", body.Amount))
		}

		// 4. บันทึก Transaction Log (ฝั่ง User)
		tx.Create(&models.Transaction{
			UserID:       targetUser.ID,
			Amount:       body.Amount,
			Type:         body.Type,
			Status:       "approved",
			BalanceAfter: targetUser.Credit + body.Amount, // คำนวณยอดหลังทำรายการ
			Note:         fmt.Sprintf("[AGENT:%s] %s", agent.Username, body.Note),
		})

		return c.JSON(fiber.Map{"message": "ดำเนินการเรียบร้อย"})
	})
}

// DELETE /api/v3/admin/users/:id
func DeleteUser(c *fiber.Ctx) error {
	userID := c.Params("id")
	if err := database.DB.Delete(&models.User{}, userID).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ลบไม่สำเร็จ"})
	}
	return c.JSON(fiber.Map{"message": "ลบผู้ใช้เรียบร้อย"})
}

// ฟังก์ชันสุ่มชื่อผู้ใช้ใหม่ (ใช้ตอนสมัครสมาชิก)
func GenerateNextUsername(c *fiber.Ctx) error {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for {
		newUsername := fmt.Sprintf("Thunibet%d", r.Intn(90000)+10000)
		var count int64
		database.DB.Model(&models.User{}).Where("username = ?", newUsername).Count(&count)
		if count == 0 {
			return c.JSON(fiber.Map{"next_username": newUsername})
		}
	}
}
func CreateUser(c *fiber.Ctx) error {
	// 1. ตรวจสอบคนสร้าง (ดึงจาก JWT Middleware)
	// ใช้การเช็ค ok เพื่อป้องกัน panic ถ้าค่าเป็น nil
	creatorID, okID := c.Locals("user_id").(uint)
	creatorRole, okRole := c.Locals("role").(string)

	if !okID || !okRole {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized: ไม่พบข้อมูลผู้ใช้งาน"})
	}

	// Struct สำหรับรับค่า
	type CreateUserRequest struct {
		Username  string  `json:"username"`
		Password  string  `json:"password"`
		FirstName string  `json:"first_name"`
		LastName  string  `json:"last_name"`
		Phone     string  `json:"phone"`
		Role      string  `json:"role"`   // admin ส่งมาเป็น 'agent' หรือ 'user'
		Credit    float64 `json:"credit"` // เผื่อกรณีสร้าง Agent แล้วอยากใส่เครดิตตั้งต้นเลย
	}

	var body CreateUserRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "JSON Format ไม่ถูกต้อง"})
	}

	// 2. Validate ข้อมูลพื้นฐาน
	if body.Username == "" || body.Password == "" {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณากรอก Username และ Password"})
	}

	// 3. ตรวจสอบ Username ซ้ำ
	var count int64
	database.DB.Model(&models.User{}).Where("username = ?", body.Username).Count(&count)
	if count > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Username นี้ถูกใช้งานแล้ว"})
	}

	// 4. Logic กำหนด Role และ Parent (หัวใจสำคัญ)
	targetRole := "user" // ค่าเริ่มต้น
	var parentID *uint   // ค่าเริ่มต้น nil

	if creatorRole == "admin" {
		// --- กรณี Admin เป็นคนสร้าง ---
		// อนุญาตให้กำหนด Role ได้ แต่ต้องเป็นค่าที่ระบบรองรับเท่านั้น
		if body.Role == "agent" || body.Role == "user" {
			targetRole = body.Role
		}
		// Admin สร้าง User ไม่มี Parent (หรือคุณอาจจะไม่ได้ส่ง ParentID มา)
	} else if creatorRole == "agent" {
		// --- กรณี Agent เป็นคนสร้าง ---
		// บังคับเป็น User เท่านั้น
		targetRole = "user"
		// บังคับผูก Parent เป็น Agent คนนี้
		parentID = &creatorID
	} else {
		// กรณี User ธรรมดาพยายามยิง API สร้าง (ไม่ควรเกิดขึ้นถ้า Middleware กันไว้ดี)
		return c.Status(403).JSON(fiber.Map{"error": "ไม่มีสิทธิ์สร้างบัญชี"})
	}

	// 5. Hash Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(body.Password), 14)
	if err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Encryption error"})
	}

	// 6. เตรียม Object
	newUser := models.User{
		Username:  body.Username,
		Password:  string(hashedPassword),
		FirstName: body.FirstName,
		LastName:  body.LastName,
		Phone:     body.Phone,
		Role:      targetRole,  // ✅ Role ที่ผ่าน Logic แล้ว
		ParentID:  parentID,    // ✅ ParentID ที่ถูกต้อง
		Credit:    body.Credit, // ใส่เครดิตตั้งต้น (ถ้ามี)
		Status:    "active",
	}

	// 7. บันทึกลง Database
	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Database error: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "สร้างบัญชีสำเร็จ",
		"user": fiber.Map{
			"id":        newUser.ID,
			"username":  newUser.Username,
			"role":      newUser.Role, // เช็คค่านี้ตอน Return กลับไป
			"parent_id": newUser.ParentID,
			"credit":    newUser.Credit,
		},
	})
}

// ตัวอย่าง handlers/user.go
func GetUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var user models.User

	// ตอนนี้ .Preload("Parent") จะทำงานได้แล้ว เพราะเราประกาศใน Model แล้ว
	if err := database.DB.Preload("Parent").First(&user, id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}
