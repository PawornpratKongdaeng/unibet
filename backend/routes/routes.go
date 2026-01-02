package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// 1. Static Files (ควรอยู่นอกสุดเพื่อให้ดึงรูปภาพได้เสมอ)
	app.Static("/uploads", "./uploads")

	// สร้าง API Group หลัก
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes (ไม่ต้องมี Token) ---
	// วางไว้บนสุดเพื่อให้ Fiber หาเจอก่อนการเข้าเงื่อนไข Middleware
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Post("/transaction/withdraw-request", handlers.RequestWithdraw)
	api.Get("/me", handlers.GetMe)
	// --- 🔵 2. Member Routes (ต้อง Login เท่านั้น) ---
	// แนะนำให้ใช้ Prefix "/user" หรือ "/me" แทน "/" เพื่อป้องกัน Route ทับซ้อน
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		// ดึงข้อมูลส่วนตัว
		member.Get("/me", handlers.GetMe)
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)

		// ข้อมูลการแข่งขัน (หากต้องการให้ดูได้เฉพาะตอน Login เท่านั้น)
		member.Get("/match/:path", handlers.GetMatches)

		// การเงินและเดิมพัน
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 3. Admin Routes (ต้อง Login + เป็น Admin เท่านั้น) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)

		// Financial Stats
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// System Config
		admin.Put("/config/bank", handlers.UpdateAdminBank)
		admin.Get("/settings", handlers.GetSettings)
		admin.Put("/settings", handlers.UpdateSettings)

		// Game Control
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)
	}
}
