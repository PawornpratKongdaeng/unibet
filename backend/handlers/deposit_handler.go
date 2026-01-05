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
	// 1. ดึง UserID จาก Locals (ที่ได้จาก Middleware Auth)
	rawUserID := c.Locals("user_id")
	if rawUserID == nil {
		return c.Status(401).JSON(fiber.Map{"error": "กรุณาเข้าสู่ระบบใหม่"})
	}
	userID := rawUserID.(uint)

	// 2. รับค่าจำนวนเงิน
	amountStr := c.FormValue("amount")
	var amount float64
	fmt.Sscanf(amountStr, "%f", &amount)

	if amount <= 0 {
		return c.Status(400).JSON(fiber.Map{"error": "จำนวนเงินต้องมากกว่า 0"})
	}

	// 3. จัดการไฟล์รูปสลิป
	file, err := c.FormFile("slip")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบรูปสลิปที่ถูกต้อง"})
	}

	// ✅ ตรวจสอบและสร้างโฟลเดอร์ uploads หากยังไม่มี
	uploadDir := "./uploads"
	if _, err := os.Stat(uploadDir); os.IsNotExist(err) {
		log.Println("สร้างโฟลเดอร์ uploads ใหม่...")
		os.MkdirAll(uploadDir, 0777)
	}

	// ตั้งชื่อไฟล์: slip_userID_timestamp_filename
	fileName := fmt.Sprintf("slip_%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	filePath := fmt.Sprintf("%s/%s", uploadDir, fileName)

	// ✅ เซฟไฟล์ลงเครื่อง พร้อมเช็ค Error อย่างละเอียด
	if err := c.SaveFile(file, filePath); err != nil {
		log.Printf("❌ Upload Error: %v | Path: %s", err, filePath)
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถบันทึกรูปภาพได้ กรุณาติดต่อแอดมิน"})
	}

	// 4. บันทึกลงฐานข้อมูล
	request := models.TopupRequest{
		UserID:  userID,
		Amount:  amount,
		Type:    "deposit",
		SlipURL: "/uploads/" + fileName,
		Status:  "pending",
	}

	if err := database.DB.Create(&request).Error; err != nil {
		log.Printf("❌ Database Error: %v", err)
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงฐานข้อมูล"})
	}

	return c.JSON(fiber.Map{
		"message": "แจ้งฝากเรียบร้อยแล้ว รอแอดมินตรวจสอบ",
		"data":    request,
	})
}
