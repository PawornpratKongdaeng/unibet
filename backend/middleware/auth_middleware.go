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

// AuthMiddleware: ตรวจสอบ Token ว่าล็อกอินมาจริงไหม
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// 1. ดึง Token จาก Header (Authorization: Bearer <token>)
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(401).JSON(fiber.Map{"error": "ไม่ได้ Login (No Token)"})
		}

		// ตัดคำว่า "Bearer " ออก
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.Status(401).JSON(fiber.Map{"error": "รูปแบบ Token ไม่ถูกต้อง"})
		}
		tokenString := parts[1]

		// 2. แกะ Token และตรวจสอบ
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			return c.Status(401).JSON(fiber.Map{"error": "Token หมดอายุ หรือไม่ถูกต้อง"})
		}

		// 3. *** ฝัง UserID และ Role เข้าไปใน Context (Locals) ***
		// Fiber ใช้ c.Locals ในการส่งค่าข้ามฟังก์ชัน (ต่างจาก Gin ที่ใช้ c.Set)
		// ...ในฟังก์ชัน AuthMiddleware()...
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID := uint(claims["user_id"].(float64))
			// ไปดึง User เต็มๆ จาก DB
			var user models.User
			if err := database.DB.First(&user, userID).Error; err != nil {
				return c.Status(401).JSON(fiber.Map{"error": "ไม่พบข้อมูลผู้ใช้ในระบบ"})
			}
			// ----> ตรงนี้!
			c.Locals("user", &user)
			c.Locals("role", user.Role)
			c.Locals("user_id", user.ID) // <-- ต้องมี!! เพื่อให้ handler อื่นดึง user_id ได้
			return c.Next()
		}

		return c.Status(401).JSON(fiber.Map{"error": "ข้อมูลใน Token ผิดพลาด"})
	}
}

// RequireAdminRole: ตรวจสอบว่าเป็น Admin หรือไม่ (ต้องผ่าน AuthMiddleware มาก่อน)
func RequireAdminRole() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// ดึงออกมาแล้วระบุว่าเป็น string ให้ชัดเจน
		role, ok := c.Locals("role").(string)

		// ตรวจสอบทั้งกรณีที่ไม่มีค่า หรือค่าไม่ใช่ admin
		// แนะนำใช้ strings.ToLower เพื่อกันเหนียวเรื่องตัวพิมพ์เล็ก-ใหญ่ครับ
		if !ok || strings.ToLower(role) != "admin" {
			return c.Status(403).JSON(fiber.Map{"error": "ห้ามเข้า! เฉพาะ Admin เท่านั้น"})
		}
		return c.Next()
	}
}
func RequireAgentRole() fiber.Handler {
	return func(c *fiber.Ctx) error {
		role, ok := c.Locals("role").(string) // ตรวจสอบก่อนว่าเป็น string ไหม
		if !ok || (role != "agent" && role != "master" && role != "admin") {
			return c.Status(403).JSON(fiber.Map{"error": "สิทธิ์ของคุณไม่เพียงพอ"})
		}
		return c.Next()
	}
}
