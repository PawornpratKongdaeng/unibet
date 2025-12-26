package database

import (
	"log"

	"github.com/PawornpratKongdaeng/soccer/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/mysql" // เปลี่ยนจาก sqlite เป็น mysql
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var err error

	// 1. ตั้งค่า DSN (Data Source Name) ให้ตรงกับ docker-compose.yml
	// รูปแบบ: "user:password@tcp(127.0.0.1:3306)/dbname?charset=utf8mb4&parseTime=True&loc=Local"
	dsn := "root:admin123@tcp(127.0.0.1:3306)/soccer_db?charset=utf8mb4&parseTime=True&loc=Local"

	// 2. เชื่อมต่อ MySQL
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to MySQL (Docker):", err)
	}

	log.Println("✅ Connected to MySQL on Docker successfully!")

	// 3. AutoMigrate: สร้างตารางตาม Model ทั้งหมด
	// เพิ่ม ParlayTicket และ ParlayItem เข้าไปด้วยเพื่อให้ระบบสเต็ปทำงานได้
	DB.AutoMigrate(
		&models.User{},
		&models.BetSlip{},
		&models.ParlayTicket{},
		&models.ParlayItem{},
	)

	// 4. Seeding: สร้าง Admin เริ่มต้น
	seedAdmin()
}

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
			log.Println("👤 Default Admin 'TideKung' created successfully!")
		}
	}
}
