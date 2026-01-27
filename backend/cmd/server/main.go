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

	// 🟢 3. Middleware: CORS (ตั้งค่าที่นี่จุดเดียวจบ)
	// ต้องใส่ https://thunibet.com เพื่อให้หน้าเว็บจริงเข้าได้
	app.Use(cors.New(cors.Config{
		// 👇👇 เพิ่ม backoffice เข้าไปในรายการนี้ครับ (คั่นด้วย comma) 👇👇
		AllowOrigins: "https://thunibet.com, https://backoffice.thunibet.com, http://localhost:3000",

		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH, OPTIONS",
		AllowCredentials: true, // อันนี้ถูกต้องแล้ว ห้ามเอาออก
	}))

	// 4. Setup Routes
	routes.SetupRoutes(app)

	// 5. Initialize Cron Job
	c := cron.New(cron.WithChain(
		cron.Recover(cron.DefaultLogger),
	))

	// Task 1: Auto-Settlement (Every 5 mins)
	_, err := c.AddFunc("*/5 * * * *", func() {
		log.Println("⏰ [Cron] Task: Auto-Settlement running...")
		services.AutoSettlement()
	})

	// Task 2: Sync Matches (Every 10 mins)
	_, err = c.AddFunc("*/10 * * * *", func() {
		log.Println("⏰ [Cron] Task Started: Syncing matches...")
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
