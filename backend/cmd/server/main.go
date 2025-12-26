package main

import (
	"log"
	"time" // เพิ่ม import time

	"github.com/PawornpratKongdaeng/soccer/database"
	"github.com/PawornpratKongdaeng/soccer/handlers" // ต้อง import handlers เพื่อเรียกใช้ AutoSettlement
	"github.com/PawornpratKongdaeng/soccer/routes"
	"github.com/PawornpratKongdaeng/soccer/workers"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	database.InitDB()

	app := fiber.New()

	go workers.RunAutoSettlement()

	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000",
		// ✅ เพิ่ม "Authorization" ลงใน AllowHeaders
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, HEAD, PUT, DELETE, PATCH",
	}))

	routes.SetupRoutes(app)

	go func() {
		for {
			log.Println("Worker: Checking match results...")

			handlers.AutoSettlement()

			time.Sleep(10 * time.Minute)
		}
	}()

	// 5. Start Server
	log.Fatal(app.Listen(":8080"))
}
