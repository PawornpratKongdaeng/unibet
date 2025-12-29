package handlers

import (
	"fmt"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
)

func SubmitDeposit(c *fiber.Ctx) error {
	// 1. ดึง UserID จาก Token (สมมติว่าคุณเก็บไว้ใน Locals)
	userID := c.Locals("user_id").(uint)

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
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบรูปสลิป"})
	}

	// ตั้งชื่อไฟล์ใหม่ป้องกันชื่อซ้ำ: user_1_timestamp.jpg
	fileName := fmt.Sprintf("slip_%d_%d_%s", userID, time.Now().Unix(), file.Filename)
	filePath := fmt.Sprintf("./uploads/%s", fileName)

	// เซฟไฟล์ลงเครื่อง (ในโฟลเดอร์ uploads)
	if err := c.SaveFile(file, filePath); err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถบันทึกรูปภาพได้"})
	}

	// 4. บันทึกลงฐานข้อมูล
	request := models.TopupRequest{
		UserID:  userID,
		Amount:  amount,
		Type:    "deposit",
		SlipURL: "/uploads/" + fileName, // เก็บ Path ไว้ไปเปิดดูในเว็บ
		Status:  "pending",
	}

	if err := database.DB.Create(&request).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	return c.JSON(fiber.Map{"message": "แจ้งฝากเรียบร้อยแล้ว รอแอดมินตรวจสอบ", "data": request})
}
