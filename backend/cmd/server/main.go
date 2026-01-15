package main

import (
	"log"
	"os"

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
	app := fiber.New(fiber.Config{
		BodyLimit: 10 * 1024 * 1024,
	})

	// 3. Middleware: CORS
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://thunibet.com",
		AllowCredentials: false,
	}))

	// 4. Setup Routes
	routes.SetupRoutes(app)

	// 5. Initialize Cron Job
	c := cron.New(cron.WithChain(
		cron.Recover(cron.DefaultLogger),
	))

	// Task 1: ตรวจสอบผลและจ่ายเงิน (ทุก 5 นาที)
	_, err := c.AddFunc("*/5 * * * *", func() {
		log.Println("⏰ [Cron] Task: Auto-Settlement running...")
		services.AutoSettlement()
	})

	// Task 2: ดึงแมตช์ใหม่จาก API มาลง DB (ทุก 10 นาที) ✅ เพิ่มส่วนนี้
	_, err = c.AddFunc("*/10 * * * *", func() {
		log.Println("⏰ [Cron] Task Started: Syncing matches...")

		// ✅ เรียกใช้ผ่าน services (ตรวจสอบให้มั่นใจว่า import github.com/.../services มาแล้ว)
		// ❌ ห้ามตั้งชื่อตัวแปรว่า SyncMatchesFromAPI := services.SyncMatchesFromAPI("moung")
		errSync := services.SyncMatchesFromAPI("moung")

		if errSync != nil {
			log.Printf("❌ [Cron] Sync Error: %v", errSync)
		} else {
			log.Println("✅ [Cron] Sync Completed")
		}
	})

	if err != nil {
		log.Fatalf("❌ [Cron] Error: %v", err)
	}

	c.Start()
	log.Println("🚀 Cron System: Active (Settlement & Sync)")

	// 6. Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("📡 Server is starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
