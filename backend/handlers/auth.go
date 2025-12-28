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

func generateUsername() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	randomNum := r.Intn(90000) + 10000
	return fmt.Sprintf("unibet%d", randomNum)
}

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
		Phone       string `json:"phone"`
		Password    string `json:"password"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		BankName    string `json:"bank_name"`
		BankAccount string `json:"bank_account"`
	}

	var body RegisterRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// ใช้ .Find() แทน .First() เพื่อไม่ให้ GORM พ่น Log "Record Not Found" สีแดงกวนใจ
	var users []models.User

	// 1. ตรวจสอบเบอร์โทร
	database.DB.Where("phone = ?", body.Phone).Limit(1).Find(&users)
	if len(users) > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"})
	}

	// 2. ตรวจสอบเลขบัญชี
	database.DB.Where("bank_account = ?", body.BankAccount).Limit(1).Find(&users)
	if len(users) > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "เลขบัญชีธนาคารนี้มีอยู่ในระบบแล้ว"})
	}

	// 3. Gen Username
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

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(body.Password), 14)

	user := models.User{
		Username:    finalUsername,
		Password:    string(hashedPassword),
		Phone:       body.Phone,
		FirstName:   body.FirstName,
		LastName:    body.LastName,
		BankName:    body.BankName,
		BankAccount: body.BankAccount,
		Role:        "user",
		Credit:      0,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถสมัครสมาชิกได้"})
	}

	return c.JSON(fiber.Map{"message": "สมัครสำเร็จ", "username": finalUsername})
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
