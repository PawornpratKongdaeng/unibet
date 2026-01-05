package handlers

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

func SubmitDeposit(c *fiber.Ctx) error {
	// 1. ดึง UserID จาก Locals พร้อมตรวจสอบ Type อย่างละเอียด (ป้องกัน Panic 500)
	rawUserID := c.Locals("user_id")
	if rawUserID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}

	var userID uint
	switch v := rawUserID.(type) {
	case uint:
		userID = v
	case float64:
		userID = uint(v)
	case int:
		userID = uint(v)
	default:
		log.Printf("❌ Invalid UserID type: %T", rawUserID)
		return c.Status(500).JSON(fiber.Map{"error": "ข้อมูลผู้ใช้งานไม่ถูกต้อง"})
	}

	// 2. รับค่าจำนวนเงิน
	amountStr := c.FormValue("amount")
	var amount float64
	_, err := fmt.Sscanf(amountStr, "%f", &amount)
	if err != nil || amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "จำนวนเงินต้องมากกว่า 0 และเป็นตัวเลขเท่านั้น"})
	}

	// 3. จัดการไฟล์รูปสลิป
	file, err := c.FormFile("slip")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบรูปสลิปที่ถูกต้อง"})
	}

	// ✅ ตรวจสอบและสร้างโฟลเดอร์ uploads หากยังไม่มี
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		log.Println("Creating uploads directory...")
		err := os.MkdirAll(uploadDir, 0777)
		if err != nil {
			log.Printf("❌ Failed to create directory: %v", err)
			return c.Status(500).JSON(fiber.Map{"error": "เซิร์ฟเวอร์ไม่สามารถสร้างโฟลเดอร์เก็บรูปได้"})
		}
	}

	// ตั้งชื่อไฟล์ป้องกันชื่อซ้ำ: slip_userID_timestamp_filename
	fileName := fmt.Sprintf("slip_%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	filePath := fmt.Sprintf("%s/%s", uploadDir, fileName)

	// ✅ เซฟไฟล์ลงเครื่อง
	if err := c.SaveFile(file, filePath); err != nil {
		log.Printf("❌ Upload Error: %v | Path: %s", err, filePath)
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถบันทึกรูปภาพได้ กรุณาเช็ค Permission"})
	}

	// 4. บันทึกลงฐานข้อมูล (ใช้รุ่น Transaction ตามที่คุณปรับมา)
	request := models.Transaction{
		UserID:    userID,
		Amount:    amount,
		Type:      "deposit",
		SlipURL:   "/uploads/" + fileName,
		Status:    "pending",
		CreatedAt: time.Now(),
	}

	if err := database.DB.Create(&request).Error; err != nil {
		log.Printf("❌ Database Error: %v", err)
		// ถ้าพังตรงนี้ ให้ลบไฟล์ที่เพิ่งเซฟไปทิ้งเพื่อไม่ให้ไฟล์ขยะค้าง
		os.Remove(filePath)
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + err.Error()})
	}

	return c.JSON(fiber.Map{
		"message": "แจ้งฝากเรียบร้อยแล้ว รอแอดมินตรวจสอบ",
		"data":    request,
	})
}
