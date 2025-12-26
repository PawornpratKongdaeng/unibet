package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware" // อย่าลืม import middleware
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// 🚩 เปลี่ยนตรงนี้ให้ระวัง: ถ้าหน้าบ้านเรียก /api/me
	// แต่ตรงนี้เป็น /api/v3 Path จะไม่ตรงกันครับ
	api := app.Group("/api/v3")

	// --- Zone 1: Public (ไม่ต้องมี Token) ---
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/match/:path", handlers.GetMatches)

	// --- Zone 2: Member (ต้องมี Token) ---
	// ใช้ api.Group เพื่อสืบทอด /api/v3 มา แล้วใส่ Middleware ครอบไว้
	member := api.Group("/", middleware.AuthMiddleware())
	{
		// ✅ เปลี่ยนจาก auth.Get เป็น member.Get
		// ✅ เพิ่ม /me เข้ามาในโซนนี้เพื่อให้ใช้ Token ตรวจสอบได้
		member.Get("/me", handlers.GetMe)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/bet", handlers.PlaceBet)
		member.Get("/bet/history", handlers.GetHistory)
	}

	// --- Zone 3: Admin (ต้องมี Token + เป็น Admin) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		admin.Get("/users", handlers.GetUsers)
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/create-user", handlers.CreateDownline) // ใช้ฟังก์ชัน CreateDownline ที่เราเขียนไว้

		// 🔥 เพิ่มบรรทัดนี้เข้าไปครับ เพื่อรองรับ PATCH /api/v3/admin/users/:id
		admin.Patch("/users/:id", handlers.UpdateUser)

		admin.Post("/adjust-balance", handlers.AdjustUserBalance)
		admin.Post("/settle", handlers.ManualSettlement)
	}

	// --- Zone 4: Agent ---
	agent := api.Group("/agent", middleware.AuthMiddleware())
	{
		agent.Get("/team", handlers.GetTeam)
		agent.Post("/create-downline", handlers.CreateDownline)
		agent.Post("/transfer", handlers.TransferCredit)
		agent.Get("/report", handlers.GetWinLossReport)
		agent.Get("/settlements", handlers.GetSettlementRecords)
	}
}
