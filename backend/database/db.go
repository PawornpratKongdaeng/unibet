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
	dbPass := getEnv("DB_PASSWORD", "6SSDfEd6gtdaUDJX")
	dbHost := getEnv("DB_HOST", "db.esicpsnbsacemrinbhnk.supabase.co")
	dbPort := getEnv("DB_PORT", "5432")
	dbName := getEnv("DB_NAME", "postgres")

	// ✅ 2. เปลี่ยนรูปแบบ DSN ให้เป็นของ Postgres
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=Asia/Bangkok",
		dbHost, dbUser, dbPass, dbName, dbPort)

	log.Printf("📡 Connecting to Supabase (Postgres): %s:%s...", dbHost, dbPort)

	// ✅ 3. เปลี่ยน gorm.Open เป็น postgres.Open
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to Supabase:", err) // เปลี่ยนข้อความ Error ให้ตรงกัน
	}

	log.Println("✅ Connected to Supabase successfully!")

	// แก้ไขคอลัมน์อัตโนมัติ
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

// ฟังก์ชันสำหรับเช็คและเพิ่มคอลัมน์ที่ขาดหายไป (ปลอดภัยสำหรับ MySQL)
func FixMissingColumns() {
	m := DB.Migrator()

	// 1. เช็คคอลัมน์ full_name
	if !m.HasColumn(&models.User{}, "full_name") {
		log.Println("🛠 Adding missing column: full_name")
		DB.Exec("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)")
	}

	// 2. เช็คคอลัมน์ phone
	if !m.HasColumn(&models.User{}, "phone") {
		log.Println("🛠 Adding missing column: phone")
		DB.Exec("ALTER TABLE users ADD COLUMN phone VARCHAR(50)")
	}

	// 3. เช็คคอลัมน์ role
	if !m.HasColumn(&models.User{}, "role") {
		log.Println("🛠 Adding missing column: role")
		DB.Exec("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'")
	}

	// 4. เช็คคอลัมน์ credit
	if !m.HasColumn(&models.User{}, "credit") {
		log.Println("🛠 Adding missing column: credit")
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

		if err := DB.Create(&admin).Error; err != nil {
			log.Println("❌ Error seeding admin:", err)
		} else {
			log.Println("✅ Default Admin 'TideKung' created!")
		}
	}
}
