package middleware

import (
	"strings"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// ต้องใช้ Key เดียวกับที่ใช้ใน handlers/auth.go (Login)
var jwtKey = []byte("SECRET_KEY_NA_KRUB")

// AuthMiddleware: ตรวจสอบ Token (รองรับทั้ง Header และ Cookie)
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		var tokenString string

		// ---------------------------------------------------------
		// 1. ลองดึงจาก Header (Authorization: Bearer <token>)
		// ---------------------------------------------------------
		authHeader := c.Get("Authorization")
		if authHeader != "" {
			parts := strings.Split(authHeader, " ")
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenString = parts[1]
			}
		}

		// ---------------------------------------------------------
		// 2. ถ้าใน Header ไม่มี -> ให้ลองดึงจาก Cookie
		// (สำคัญมากสำหรับระบบ Subdomain SSO)
		// ---------------------------------------------------------
		if tokenString == "" {
			tokenString = c.Cookies("token") // ชื่อ cookie ต้องตรงกับตอน Set ใน Login
		}

		// ถ้าหาไม่เจอทั้งคู่ -> Error
		if tokenString == "" {
			return c.Status(401).JSON(fiber.Map{"error": "ไม่ได้ Login (No Token)"})
		}

		// ---------------------------------------------------------
		// 3. แกะ Token และตรวจสอบความถูกต้อง
		// ---------------------------------------------------------
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Token หมดอายุ หรือไม่ถูกต้อง"})
		}

		// 4. *** ฝัง UserID และ Role เข้าไปใน Context ***
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID := uint(claims["user_id"].(float64))

			// ดึง User จาก DB
			var user models.User
			if err := database.DB.First(&user, userID).Error; err != nil {
				return c.Status(401).JSON(fiber.Map{"error": "ไม่พบข้อมูลผู้ใช้ในระบบ"})
			}

			// Save ลง Locals เพื่อใช้ต่อใน Handler ถัดไป
			c.Locals("user", &user)
			c.Locals("role", strings.ToLower(user.Role)) // แปลงเป็นตัวเล็กกันพลาด
			c.Locals("user_id", user.ID)

			return c.Next()
		}

		return c.Status(401).JSON(fiber.Map{"error": "ข้อมูลใน Token ผิดพลาด"})
	}
}

// RequireAdminRole: ตรวจสอบว่าเป็น Admin หรือไม่
func RequireAdminRole() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role != "admin" {
			return c.Status(403).JSON(fiber.Map{"error": "ห้ามเข้า! เฉพาะ Admin เท่านั้น"})
		}
		return c.Next()
	}
}

// RequireAgentRole: อนุญาต Agent, Master และ Admin
func RequireAgentRole() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || (role != "agent" && role != "master" && role != "admin") {
			return c.Status(403).JSON(fiber.Map{"error": "สิทธิ์ของคุณไม่เพียงพอ (Agent Only)"})
		}
		return c.Next()
	}
}

// RequireAdminOrAgent: อนุญาตทั้ง Admin และ Agent (Logic เหมือน RequireAgentRole แต่เขียนแยกให้ชัดเจน)
func RequireAdminOrAgent() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string)

		if !ok || (role != "admin" && role != "agent" && role != "master") {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Access Denied: สำหรับ Admin หรือ Agent เท่านั้น",
			})
		}

		return c.Next()
	}
}
