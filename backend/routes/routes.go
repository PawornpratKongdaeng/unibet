package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// 1. Static Files
	app.Static("/uploads", "./uploads")

	// สร้าง API Group หลัก
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes (ไม่ต้องมี Token) ---
	// เส้นทางเหล่านี้ใครก็เข้าถึงได้
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Post("/transaction/withdraw-request", handlers.RequestWithdraw)

	// --- 🔵 2. Protected Routes (ต้องมี Token - แบบไม่มี Prefix) ---
	// แก้ไขเพื่อให้เรียก /api/v3/me ได้โดยตรง (ตามที่ Next.js เรียก)
	// และต้องผ่าน AuthMiddleware เพื่อให้ Handler มีข้อมูล User
	api.Get("/me", middleware.AuthMiddleware(), handlers.GetMe)

	// --- 🔵 3. Member Routes (ต้อง Login เท่านั้น - /api/v3/user/...) ---
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		// ดึงข้อมูลส่วนตัว (ใส่ไว้เผื่อเรียกผ่าน /user/me ด้วย)
		member.Get("/me", handlers.GetMe)
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)

		// ข้อมูลการแข่งขัน
		member.Get("/match/:path", handlers.GetMatches)

		// การเงินและเดิมพัน
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 4. Admin Routes (ต้อง Login + เป็น Admin เท่านั้น - /api/v3/admin/...) ---
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
