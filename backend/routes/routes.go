package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// กรุ๊ปหลักของ API v3
	api := app.Group("/api/v3")

	// --- Zone 1: Public (ไม่ต้องมี Token) ---
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/match/:path", handlers.GetMatches)
	app.Get("/api/admin/config/bank", handlers.GetAdminBank)

	// --- Zone 2: Member (ต้องมี Token) ---
	member := api.Group("/", middleware.AuthMiddleware())
	{
		member.Get("/me", handlers.GetMe)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/bet", handlers.PlaceBet)
		member.Get("/bet/history", handlers.GetHistory)

		// 🔥 เพิ่มใหม่: ระบบแจ้งฝากเงินสำหรับ User
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw) // แจ้งถอน
	}

	// --- Zone 3: Admin (ต้องมี Token + เป็น Admin) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		admin.Get("/users", handlers.GetUsers)
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/create-user", handlers.CreateDownline)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/adjust-balance", handlers.AdjustUserBalance)
		admin.Post("/settle", handlers.ManualSettlement)

		// 🔥 เพิ่มใหม่: ระบบอนุมัติเงินฝากสำหรับ Admin
		// ใช้ PUT เพราะเป็นการอัปเดตสถานะ Transaction เดิมที่มีอยู่แล้ว
		admin.Put("/approve-deposit/:id", handlers.ApproveDeposit)
		admin.Put("/approve-withdraw/:id", handlers.ApproveWithdraw) // อนุมัติถอน
		admin.Put("/config/bank", handlers.UpdateAdminBank)
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
