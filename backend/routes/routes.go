package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Static("/uploads", "./uploads")

	// สร้าง API Group หลัก
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes (เข้าได้เลย) ---
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)

	// --- 🔵 2. Protected Root Routes (ต้องมี Token และห้ามมี /user นำหน้า) ---
	// กลุ่มนี้แก้ปัญหา 404 ของ Match และ 401 ของ /me
	rootAuth := api.Group("/", middleware.AuthMiddleware())
	{
		rootAuth.Get("/me", handlers.GetMe)               // แก้ 401: ให้เรียก /api/v3/me ได้
		rootAuth.Get("/match/:path", handlers.GetMatches) // แก้ 404: ให้เรียก /api/v3/match/... ได้เลย
	}

	// --- 🔵 3. Member Routes (เรียกผ่าน /api/v3/user/...) ---
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 4. Admin Routes (เรียกผ่าน /api/v3/admin/...) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		admin.Get("/users", handlers.GetUsers)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)
		admin.Put("/config/bank", handlers.UpdateAdminBank)
		admin.Put("/settings", handlers.UpdateSettings)
		admin.Post("/settle", services.ManualSettlement)
	}
}
