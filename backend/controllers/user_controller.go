package controllers

import (
	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
)

type CreateUserRequest struct {
	Username string  `json:"username"`
	Password string  `json:"password"`
	Role     string  `json:"role"`
	Share    float64 `json:"share"`
	Com      float64 `json:"com"`
}

func CreateSubordinate(c *fiber.Ctx) error {
	// 1. ดึงข้อมูลของ "ผู้สร้าง" จาก Token (คนที่กำลังล็อคอินอยู่)
	creator := c.Locals("user").(*models.User)

	var req CreateUserRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 2. ตรวจสอบสิทธิ์การสร้าง (Hierarchy Logic)
	isValidRole := false
	if creator.Role == "admin" && req.Role == "master" {
		isValidRole = true
	}
	if creator.Role == "master" && req.Role == "agent" {
		isValidRole = true
	}
	if creator.Role == "agent" && req.Role == "user" {
		isValidRole = true
	}

	if !isValidRole {
		return c.Status(403).JSON(fiber.Map{"error": "คุณไม่มีสิทธิ์สร้างสมาชิกในระดับนี้"})
	}

	// 3. ตรวจสอบ % หุ้น (Share) ห้ามเกินกว่าที่หัวหน้าถืออยู่
	if req.Share > creator.Share && creator.Role != "admin" {
		return c.Status(400).JSON(fiber.Map{"error": "ห้ามตั้งค่าหุ้นเกินกว่าที่คุณถืออยู่"})
	}

	// 4. เตรียมข้อมูล User ใหม่
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(req.Password), 10)

	newUser := models.User{
		Username: req.Username,
		Password: string(hashedPassword),
		Role:     req.Role,
		ParentID: &creator.ID, // ผูก ID ของคนสร้างลงในช่อง ParentID
		Share:    req.Share,
		Com:      req.Com,
		Credit:   0, // เริ่มต้นที่ 0 เสมอ (ค่อยเติมเงินทีหลัง)
		Status:   "active",
	}

	// 5. บันทึกลง Database
	if err := database.DB.Create(&newUser).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถสร้างสมาชิกได้ (Username อาจซ้ำ)"})
	}

	return c.JSON(fiber.Map{"message": "สร้างสมาชิกสำเร็จ", "user": newUser})
}
