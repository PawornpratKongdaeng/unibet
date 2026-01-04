package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey = []byte("SECRET_KEY_NA_KRUB")

func IsAuthenticated(c *fiber.Ctx) error {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบ"})
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Session หมดอายุ"})
	}

	claims := token.Claims.(jwt.MapClaims)

	// ปรับตรงนี้: แปลงจาก float64 (JWT default) ให้เป็น uint ทันที
	userID := uint(claims["user_id"].(float64))

	c.Locals("user_id", userID)
	c.Locals("role", claims["role"])

	return c.Next()
}
func Register(c *fiber.Ctx) error {
	type RegisterRequest struct {
		Username  string `json:"username"`
		Phone     string `json:"phone"`
		Password  string `json:"password"`
		FullName  string `json:"fullName"`   // จาก Admin
		FirstName string `json:"first_name"` // จากหน้าเว็บ
		LastName  string `json:"last_name"`
	}

	var body RegisterRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ตรวจสอบเบอร์โทรซ้ำ (เฉพาะถ้ากรอกมา)
	if body.Phone != "" {
		var count int64
		database.DB.Model(&models.User{}).Where("phone = ?", body.Phone).Count(&count)
		if count > 0 {
			return c.Status(400).JSON(fiber.Map{"error": "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"})
		}
	}

	// 2. จัดการเรื่อง Username (ถ้าว่างให้ Auto-gen)
	finalUsername := body.Username
	if finalUsername == "" {
		finalUsername = generateUsername() // เรียกใช้ฟังก์ชันสุ่มชื่อที่คุณมี
	}

	// 3. จัดการเรื่องชื่อ (Logic การแยก FullName)
	fname := body.FirstName
	lname := body.LastName
	full := body.FullName

	if full != "" && fname == "" {
		// ถ้าส่ง FullName มา (เช่น "สมชาย ดีใจ") ให้แยกเป็น fname และ lname
		parts := strings.SplitN(full, " ", 2)
		fname = parts[0]
		if len(parts) > 1 {
			lname = parts[1]
		}
	} else if full == "" && fname != "" {
		// ถ้าส่งแยกมาแต่ไม่มี FullName ให้รวมร่างให้
		full = fmt.Sprintf("%s %s", fname, lname)
	}

	// 4. Hash Password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 14)

	// 5. สร้าง Object User
	user := models.User{
		Username:    finalUsername,
		Password:    string(hashedPassword),
		Phone:       body.Phone,
		FirstName:   fname,
		LastName:    lname,
		FullName:    full, // บันทึกลงช่อง FullName ด้วยเพื่อโชว์ในตาราง
		Role:        "user",
		Credit:      0,
		Status:      "active",
		BankName:    "",
		BankAccount: "",
	}

	// 6. บันทึกลงฐานข้อมูล
	if err := database.DB.Create(&user).Error; err != nil {
		// ส่ง Error จริงกลับไปเผื่อ Debug
		return c.Status(500).JSON(fiber.Map{"error": "สมัครไม่สำเร็จ: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":  "สมัครสมาชิกสำเร็จ",
		"username": finalUsername,
		"fullName": full,
	})
}
func Login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var user models.User
	// ใช้ Find เพื่อเช็คว่ามีตัวตนไหมโดยไม่พ่น Error Log
	if err := database.DB.Where("username = ?", body.Username).Limit(1).Find(&user).Error; err != nil || user.ID == 0 {
		return c.Status(401).JSON(fiber.Map{"error": "ไม่พบผู้ใช้นี้ หรือรหัสผ่านผิด"})
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
		},
	})
}
