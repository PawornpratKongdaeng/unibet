package main

import (
	"log"

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/routes"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/robfig/cron/v3"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	// 1. Initialize Database
	database.InitDB()

	// 2. Setup Fiber App
	app := fiber.New()

	// 3. Middleware: CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH",
	}))

	// 4. Setup Routes
	routes.SetupRoutes(app)

	// 5. Initialize Cron Job (แทนที่การใช้ time.Sleep แบบเดิม)
	// สร้าง Cron instance ใหม่
	c := cron.New(cron.WithChain(
		cron.Recover(cron.DefaultLogger), // ป้องกัน Cron ตายถ้าข้างในเกิด Panic
	))

	// ตั้งเวลาให้รัน AutoSettlement ทุกๆ 5 นาที (หรือปรับเป็น "*/10 * * * *" สำหรับ 10 นาที)
	_, err := c.AddFunc("*/5 * * * *", func() {
		log.Println("⏰ [Cron] Task Started: Checking match results...")
		services.AutoSettlement()
	})

	if err != nil {
		log.Fatalf("❌ [Cron] Error: %v", err)
	}

	// เริ่มต้นการทำงานของ Cron แบบ Background
	c.Start()
	log.Println("🚀 Cron Job: Running every 5 minutes")

	// (Option) หากคุณมี worker อื่นในแพ็กเกจ workers ก็สามารถรันต่อได้
	// go workers.RunAutoSettlement()

	// 6. Start Server
	log.Fatal(app.Listen(":8080"))
}
