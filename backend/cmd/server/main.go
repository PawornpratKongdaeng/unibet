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
	app := fiber.New()

	// 3. Middleware: CORS (แก้ไขตรงนี้ ✅)
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "https://unibet-lyart.vercel.app", // อนุญาตทุกที่
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, HEAD, PUT, DELETE, PATCH",
		AllowCredentials: true, // เปลี่ยนเป็น false ตรงนี้!
	}))

	// 4. Setup Routes
	routes.SetupRoutes(app)

	// 5. Initialize Cron Job
	c := cron.New(cron.WithChain(
		cron.Recover(cron.DefaultLogger),
	))

	_, err := c.AddFunc("*/5 * * * *", func() {
		log.Println("⏰ [Cron] Task Started: Checking match results...")
		services.AutoSettlement()
	})

	if err != nil {
		log.Fatalf("❌ [Cron] Error: %v", err)
	}

	c.Start()
	log.Println("🚀 Cron Job: Running every 5 minutes")

	// 6. Start Server (แก้ไขตรงนี้ ✅)
	// ดึงค่า Port จากระบบ ถ้าไม่มีให้ใช้ 8080 (Koyeb มักจะใช้ค่า PORT เป็นหลัก)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000" // เปลี่ยนจาก 8000 เป็น 8080 เพื่อความชัวร์
	}

	log.Printf("📡 Server is starting on port %s", port)
	log.Fatal(app.Listen(":" + port))
}
