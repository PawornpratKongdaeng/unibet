package handlers

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

type DepositRequest struct {
	Amount  float64 `json:"amount"`
	SlipURL string  `json:"slipUrl"` // ต้องสะกด camelCase ให้ตรงกับที่ React ส่งมา
}

// 2. แก้ไขฟังก์ชัน CreateDeposit
func CreateDeposit(c *fiber.Ctx) error {
	// 1. ดึง User ID จาก Middleware
	val := c.Locals("user_id")
	var userID uint
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	}

	// 2. รับค่าจาก Form (เปลี่ยนจาก BodyParser เพราะเราจะรับไฟล์ด้วย)
	amountStr := c.FormValue("amount")
	amount, _ := strconv.ParseFloat(amountStr, 64)

	if amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ยอดฝากขั้นต่ำ 100 บาท"})
	}

	// 3. รับไฟล์รูปภาพสลิปจากหน้าเว็บ
	fileHeader, err := c.FormFile("slip")
	if err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "กรุณาแนบไฟล์สลิป"})
	}

	// 4. ขั้นตอนการอัปโหลดไปที่ Supabase ด้วย Service Role Key (Admin)
	file, _ := fileHeader.Open()
	defer file.Close()

	// ตั้งชื่อไฟล์ใหม่เพื่อไม่ให้ซ้ำกัน
	fileName := fmt.Sprintf("%d_%s", time.Now().Unix(), fileHeader.Filename)

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY") // ต้องใช้คีย์ลับฝั่ง Backend
	uploadURL := fmt.Sprintf("%s/storage/v1/object/slips/%s", supabaseURL, fileName)

	// ส่งไฟล์ไปยัง Supabase Storage
	req, _ := http.NewRequest("POST", uploadURL, file)
	req.Header.Set("Authorization", "Bearer "+serviceKey)
	req.Header.Set("Content-Type", fileHeader.Header.Get("Content-Type"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		return c.Status(500).JSON(fiber.Map{"error": "ไม่สามารถอัปโหลดไฟล์ไปที่ Storage ได้"})
	}

	// สร้าง Public URL เพื่อเก็บลงฐานข้อมูล
	finalSlipURL := fmt.Sprintf("%s/storage/v1/object/public/slips/%s", supabaseURL, fileName)

	// 5. บันทึกลง Database
	tx := models.Transaction{
		UserID:  userID,
		Amount:  amount,
		Type:    "deposit",
		Status:  "pending",
		SlipURL: finalSlipURL, // เก็บ URL ที่สร้างจาก Backend
	}

	if err := database.DB.Create(&tx).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "เกิดข้อผิดพลาดในการบันทึกข้อมูล"})
	}

	return c.JSON(fiber.Map{
		"message": "แจ้งฝากสำเร็จ รอการตรวจสอบ",
		"data":    tx,
	})
}

// [USER] แจ้งถอนเงิน (ใหม่!)
func CreateWithdraw(c *fiber.Ctx) error {
	val := c.Locals("user_id")
	var userID uint
	// ตรวจสอบ type ของ user_id ให้ครอบคลุม
	if v, ok := val.(float64); ok {
		userID = uint(v)
	} else if v, ok := val.(uint); ok {
		userID = v
	} else {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	}

	// --- ส่วนที่แก้ไข: เพิ่มการรับค่าธนาคาร ---
	type Request struct {
		Amount        float64 `json:"amount"`
		BankName      string  `json:"bank_name"`      // เพิ่ม
		AccountNumber string  `json:"account_number"` // เพิ่ม (ให้ตรงกับที่ React ส่งมา)
		AccountName   string  `json:"account_name"`   // เพิ่ม
	}

	var body Request
	if err := c.BodyParser(&body); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "ข้อมูลไม่ถูกต้อง"})
	}

	if body.Amount < 100 {
		return c.Status(400).JSON(fiber.Map{"error": "ถอนขั้นต่ำ 100 บาท"})
	}

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, userID).Error; err != nil {
			return err
		}

		if user.Credit < body.Amount {
			return fmt.Errorf("ยอดเงินไม่เพียงพอ")
		}

		// หักเครดิต
		if err := tx.Model(&user).Update("credit", gorm.Expr("credit - ?", body.Amount)).Error; err != nil {
			return err
		}

		// --- ส่วนที่แก้ไข: บันทึกข้อมูลธนาคารลง Transaction ---
		newTx := models.Transaction{
			UserID:        userID,
			Amount:        body.Amount,
			Type:          "withdraw",
			Status:        "pending",
			BankName:      body.BankName,      // บันทึกชื่อธนาคาร
			BankAccount:   body.AccountNumber, // บันทึกเลขบัญชี (mapping account_number -> BankAccount)
			AccountName:   body.AccountName,   // บันทึกชื่อบัญชี
			BalanceBefore: user.Credit,
			BalanceAfter:  user.Credit - body.Amount,
		}

		if err := tx.Create(&newTx).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "ส่งคำขอถอนเงินแล้ว"})
	})
}

// [ADMIN] กดยืนยันยอดฝาก (Approve Deposit)
func ApproveDeposit(c *fiber.Ctx) error {
	requestID := c.Params("id")

	return database.DB.Transaction(func(tx *gorm.DB) error {
		var req models.TopupRequest
		if err := tx.First(&req, requestID).Error; err != nil {
			return err
		}

		if req.Status != "pending" {
			return fmt.Errorf("รายการนี้ถูกดำเนินการไปแล้ว")
		}

		// 1. อัปเดตสถานะคำขอ
		tx.Model(&req).Update("status", "approved")

		// 2. เพิ่มเครดิตให้ลูกค้า
		var user models.User
		tx.First(&user, req.UserID)
		tx.Model(&user).Update("credit", user.Credit+req.Amount)

		// 3. บันทึก Transaction Log
		tx.Create(&models.Transaction{
			UserID: req.UserID,
			Amount: req.Amount,
			Type:   "deposit",
			Status: "success",
		})

		return nil
	})
}

// [ADMIN] กดยืนยันยอดถอน (Approve Withdraw)
func ApproveWithdraw(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(dbTx *gorm.DB) error {
		var transaction models.Transaction
		if err := dbTx.First(&transaction, txID).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "ไม่พบรายการ"})
		}

		if transaction.Status != "pending" || transaction.Type != "withdraw" {
			return c.Status(400).JSON(fiber.Map{"error": "รายการนี้ถูกดำเนินการไปแล้ว"})
		}

		// ✅ แค่อัปเดตเป็น success (เพราะเงินถูกหักไปแล้วตั้งแต่ตอน CreateWithdraw)
		transaction.Status = "approved" // หรือ "success" ตามที่คุณใช้ใน UI
		if err := dbTx.Save(&transaction).Error; err != nil {
			return err
		}

		return c.JSON(fiber.Map{"message": "อนุมัติการถอนเงินเรียบร้อย"})
	})
}
func RejectWithdraw(c *fiber.Ctx) error {
	txID := c.Params("id")

	return database.DB.Transaction(func(dbTx *gorm.DB) error {
		var transaction models.Transaction
		dbTx.First(&transaction, txID)

		if transaction.Status != "pending" {
			return fmt.Errorf("รายการไม่อยู่ในสถานะที่รอการตรวจสอบ")
		}

		// 1. คืนเงินให้ลูกค้า
		if err := dbTx.Model(&models.User{}).Where("id = ?", transaction.UserID).
			Update("credit", gorm.Expr("credit + ?", transaction.Amount)).Error; err != nil {
			return err
		}

		// 2. อัปเดตสถานะเป็น rejected
		transaction.Status = "rejected"
		dbTx.Save(&transaction)

		return c.JSON(fiber.Map{"message": "ปฏิเสธรายการและคืนเครดิตเรียบร้อย"})
	})
}
