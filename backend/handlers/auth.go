package handlers

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("SECRET_KEY_NA_KRUB")

// ฟังก์ชันสำหรับสุ่มตัวเลข 5 หลัก
func generateUsername() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	randomNum := r.Intn(90000) + 10000 // สุ่ม 10000 - 99999
	return fmt.Sprintf("unibet%d", randomNum)
}
func IsAuthenticated(c *fiber.Ctx) error {
	// 1. ดึง Token จาก Header "Authorization"
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบ (Missing Token)"})
	}

	// รูปแบบปกติคือ "Bearer <token>" เราต้องตัดคำว่า Bearer ออก
	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	// 2. ตรวจสอบความถูกต้องของ Token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Token ไม่ถูกต้องหรือหมดอายุ"})
	}

	// 3. ดึงข้อมูล user_id และ role จาก Token เก็บไว้ใน Context (Locals)
	// เพื่อให้ Handler อื่นๆ เรียกใช้ได้ง่ายๆ
	claims := token.Claims.(jwt.MapClaims)
	c.Locals("user_id", claims["user_id"])
	c.Locals("role", claims["role"])

	return c.Next() // ผ่านด่านได้! ไปทำหน้าที่ใน Handler ถัดไป
}

// Register - รองรับข้อมูล 2 ขั้นตอนจาก Frontend
func Register(c *fiber.Ctx) error {
	// ปรับปรุง Struct เพื่อรับข้อมูลธนาคารและชื่อจริง
	type RegisterRequest struct {
		Phone       string `json:"phone"`
		Password    string `json:"password"`
		FirstName   string `json:"first_name"`   // เพิ่มใหม่
		LastName    string `json:"last_name"`    // เพิ่มใหม่
		BankName    string `json:"bank_name"`    // เพิ่มใหม่
		BankAccount string `json:"bank_account"` // เพิ่มใหม่
	}

	var body RegisterRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ตรวจสอบเบอร์โทรซ้ำ
	var existingUser models.User
	database.DB.Where("phone = ?", body.Phone).First(&existingUser)
	if existingUser.ID != 0 {
		return c.Status(400).JSON(fiber.Map{"error": "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"})
	}

	// 2. ตรวจสอบเลขบัญชีซ้ำ (ป้องกันการสมัครหลายไอดีเพื่อปั๊มโปรโมชั่น)
	var existingBank models.User
	database.DB.Where("bank_account = ?", body.BankAccount).First(&existingBank)
	if existingBank.ID != 0 {
		return c.Status(400).JSON(fiber.Map{"error": "เลขบัญชีธนาคารนี้มีอยู่ในระบบแล้ว"})
	}

	// 3. Gen Username จนกว่าจะไม่ซ้ำ
	var finalUsername string
	for {
		tempName := generateUsername()
		var count int64
		database.DB.Model(&models.User{}).Where("username = ?", tempName).Count(&count)
		if count == 0 {
			finalUsername = tempName
			break
		}
	}

	// 4. Hash Password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 14)

	// 5. บันทึกข้อมูลลงฐานข้อมูล
	user := models.User{
		Username:    finalUsername,
		Password:    string(hashedPassword),
		Phone:       body.Phone,
		FirstName:   body.FirstName,   // ต้องมีฟิลด์นี้ใน models.User
		LastName:    body.LastName,    // ต้องมีฟิลด์นี้ใน models.User
		BankName:    body.BankName,    // ต้องมีฟิลด์นี้ใน models.User
		BankAccount: body.BankAccount, // ต้องมีฟิลด์นี้ใน models.User
		Role:        "user",
		Credit:      0,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถสมัครสมาชิกได้"})
	}

	return c.JSON(fiber.Map{
		"message":  "สมัครสมาชิกสำเร็จ",
		"username": finalUsername,
	})
}

// Login
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

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		return c.Status(401).JSON(fiber.Map{"error": "รหัสผ่านผิด"})
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, _ := token.SignedString(jwtKey)

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
			"credit":   user.Credit,
			"phone":    user.Phone,
			"bank":     user.BankName,
		},
	})
}
