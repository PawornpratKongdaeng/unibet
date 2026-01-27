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

// 🟢 แก้ไข: เพิ่มการอ่าน Token จาก Cookie ด้วย
func IsAuthenticated(c *fiber.Ctx) error {
	var tokenString string

	// 1. ลองอ่านจาก Cookie ก่อน (สำคัญมากสำหรับ Cross-Domain)
	tokenString = c.Cookies("token")

	// 2. ถ้าไม่มีใน Cookie ให้ไปดูใน Header (เผื่อใช้กับ Mobile App หรือ Postman)
	if tokenString == "" {
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			tokenString = strings.TrimPrefix(authHeader, "Bearer ")
		}
	}

	// ถ้าหาไม่เจอทั้งคู่ -> Error
	if tokenString == "" {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบ"})
	}

	// Parse Token
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		return c.Status(401).JSON(fiber.Map{"error": "Session หมดอายุ"})
	}

	claims := token.Claims.(jwt.MapClaims)

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
		Role      string `json:"role"`
	}

	var body RegisterRequest
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	// 1. ตรวจสอบเบอร์โทรซ้ำ
	if body.Phone != "" {
		var count int64
		database.DB.Model(&models.User{}).Where("phone = ?", body.Phone).Count(&count)
		if count > 0 {
			return c.Status(400).JSON(fiber.Map{"error": "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"})
		}
	}

	// 2. จัดการเรื่อง Username
	finalUsername := body.Username
	if finalUsername == "" {
		finalUsername = generateUsername()
	}

	// 3. จัดการเรื่องชื่อ
	fname := body.FirstName
	lname := body.LastName
	full := body.FullName

	if full != "" && fname == "" {
		parts := strings.SplitN(full, " ", 2)
		fname = parts[0]
		if len(parts) > 1 {
			lname = parts[1]
		}
	} else if full == "" && fname != "" {
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
		FullName:    full,
		Role:        "user",
		Credit:      0,
		Status:      "active",
		BankName:    "",
		BankAccount: "",
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "สมัครไม่สำเร็จ: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message":  "สมัครสมาชิกสำเร็จ",
		"username": finalUsername,
		"fullName": full,
	})
}

// 🟢 แก้ไข: เพิ่มการ Set Cookie ในฟังก์ชัน Login
func Login(c *fiber.Ctx) error {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	var user models.User
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

	// ---------------------------------------------------------
	// 🍪 สร้าง Cookie (ส่วนที่เพิ่มมา)
	// ---------------------------------------------------------
	cookie := new(fiber.Cookie)
	cookie.Name = "token"
	cookie.Value = tokenString
	cookie.Expires = time.Now().Add(24 * time.Hour)

	// ✅ จุดสำคัญ: ใส่จุดข้างหน้าเพื่อให้ Subdomain (backoffice) อ่านได้
	cookie.Domain = ".thunibet.com"

	cookie.Path = "/"
	cookie.Secure = true     // ต้องเป็น true เพราะเว็บจริงเป็น https
	cookie.HTTPOnly = false  // false เพื่อให้ JS อ่านได้ (หรือจะ true ก็ได้ถ้า API จัดการเองหมด)
	cookie.SameSite = "None" // สำคัญสำหรับการข้ามโดเมน

	// สั่ง Set Cookie ไปใน Header ตอบกลับ
	c.Cookie(cookie)
	// ---------------------------------------------------------

	return c.JSON(fiber.Map{
		"token": tokenString,
		"user": fiber.Map{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
