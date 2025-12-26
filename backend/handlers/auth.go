package handlers

import (
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("SECRET_KEY_NA_KRUB") // เก็บใน ENV ดีที่สุด

// Register
func Register(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 10)

	// ✅ เปลี่ยน PasswordHash -> Password และ Balance -> Credit
	user := models.User{
		Username: body.Username,
		Password: string(hashedPassword), // ✅ แก้จาก PasswordHash เป็น Password
		Role:     "member",
		Credit:   0,
	}

	if result := database.DB.Create(&user); result.Error != nil {
		return c.Status(500).JSON(fiber.Map{"error": "สมัครไม่ผ่าน (ชื่อซ้ำ)"})
	}

	return c.JSON(fiber.Map{"message": "สมัครสมาชิกสำเร็จ!"})
}

// Login - ปรับปรุงการตรวจสอบ Password และการส่งข้อมูลกลับ
func Login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Request ผิดพลาด"})
	}

	var user models.User
	database.DB.Where("username = ?", body.Username).First(&user)

	if user.ID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "ไม่พบผู้ใช้นี้"})
	}

	// ✅ เปลี่ยน user.PasswordHash -> user.Password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "รหัสผ่านผิด"})
	}

	// สร้าง Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, _ := token.SignedString(jwtKey)

	// ✅ ส่งข้อมูลกลับโดยใช้ชื่อฟิลด์ใหม่ (credit, share, com)
	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"credit":   user.Credit,
			"share":    user.Share,
			"com":      user.Com,
		},
	})
}
