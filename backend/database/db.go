package database

import (
	"fmt"
	"log"
	"os" // เพิ่มตัวนี้เข้ามาเพื่อดึงค่าจากระบบ

	"github.com/PawornpratKongdaeng/soccer/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	// 1. ดึงค่าจาก Environment Variables
	// ถ้าไม่มีค่า (เช่น รันในเครื่อง) ให้ใช้ค่า Default (localhost:3307)
	dbUser := getEnv("DB_USER", "root")
	dbPass := getEnv("DB_PASSWORD", "admin123")
	dbHost := getEnv("DB_HOST", "127.0.0.1")
	dbPort := getEnv("DB_PORT", "3307")
	dbName := getEnv("DB_NAME", "soccer_db")

	// ประกอบ DSN จากตัวแปร
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local&tls=skip-verify",
		dbUser, dbPass, dbHost, dbPort, dbName)

	log.Printf("📡 Connecting to DB (Secure): %s:%s...", dbHost, dbPort)
	// 2. เชื่อมต่อ MySQL
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		// เปลี่ยนจาก log.Fatal เป็น log.Println เพื่อไม่ให้แอปตายทันที (ตัวเลือก)
		// แต่ส่วนใหญ่ DB พังแอปก็ทำงานไม่ได้อยู่ดี
		log.Fatal("❌ Failed to connect to MySQL:", err)
	}

	log.Println("✅ Connected to Database successfully!")

	// 3. AutoMigrate
	DB.AutoMigrate(
		&models.User{},
		&models.BetSlip{},
		&models.ParlayTicket{},
		&models.ParlayItem{},
		&models.Settlement{},
		&models.Transaction{},
		&models.Match{},
		&models.BankAccount{},
		&models.SystemSetting{},
	)

	seedAdmin()
}

// ฟังก์ชันช่วยดึงค่า Environment หรือใช้ค่า Default ถ้าไม่มีการตั้งไว้
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// ... ส่วนของ seedAdmin เหมือนเดิม ...

func seedAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		password := "1234"
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), 10)
		if err != nil {
			log.Fatal("Failed to hash password")
		}

		admin := models.User{
			Username: "TideKung",
			Password: string(hashedPassword),
			Role:     "admin",
			Credit:   10000,
		}

		if err := DB.Create(&admin).Error; err != nil {
			log.Println("❌ Error seeding admin:", err)
		} else {
			log.Println(" Default Admin 'TideKung' created successfully!")
		}
	}
}
