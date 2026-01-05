package database

import (
	"fmt"
	"log"
	"os"

	"github.com/PawornpratKongdaeng/soccer/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	dbUser := getEnv("DB_USER", "postgres")
	dbPass := getEnv("DB_PASSWORD", "admin123")
	dbHost := getEnv("DB_HOST", "soccer-db")
	dbPort := getEnv("DB_PORT", "5432")
	dbName := getEnv("DB_NAME", "soccer_db")
	// ดึงค่า sslmode จาก env ถ้าไม่มีให้ใช้ disable (สำคัญมากสำหรับ Docker)
	sslMode := getEnv("DB_SSLMODE", "disable")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=Asia/Bangkok",
		dbHost, dbUser, dbPass, dbName, dbPort, sslMode)

	log.Printf("📡 Connecting to Database: %s:%s (SSL: %s)...", dbHost, dbPort, sslMode)

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to Database:", err)
	}

	log.Println("✅ Connected to Database successfully!")

	FixMissingColumns()

	DB.AutoMigrate(
		&models.User{},
		&models.BetSlip{},
		&models.ParlayTicket{},
		&models.ParlayItem{},
		&models.Transaction{},
		&models.Match{},
		&models.BankAccount{},
		&models.SystemSetting{},
	)

	seedAdmin()
}

func FixMissingColumns() {
	m := DB.Migrator()
	if !m.HasColumn(&models.User{}, "full_name") {
		DB.Exec("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)")
	}
	if !m.HasColumn(&models.User{}, "phone") {
		DB.Exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50)")
	}
	if !m.HasColumn(&models.User{}, "role") {
		DB.Exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
	}
	if !m.HasColumn(&models.User{}, "credit") {
		DB.Exec("ALTER TABLE users ADD COLUMN credit DECIMAL(15,2) DEFAULT 0")
	}
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func seedAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)
	if count == 0 {
		password := "1234"
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), 10)
		admin := models.User{
			Username: "TideKung",
			Password: string(hashedPassword),
			Role:     "admin",
			Credit:   10000,
		}
		DB.Create(&admin)
		log.Println("✅ Default Admin 'TideKung' created!")
	}
}
