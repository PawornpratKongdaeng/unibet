package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Static("/uploads", "./uploads")
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes (ไม่ต้องใช้ Token) ---
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)

	// --- 🔵 2. Global Protected Routes (ต้องมี Token แต่ไม่ต้องมี Prefix) ---
	// ใช้ตัวนี้เพื่อให้เรียก /api/v3/me และ /api/v3/match ได้ตามที่ Frontend ต้องการ
	authOnly := api.Group("/", middleware.AuthMiddleware())
	{
		authOnly.Get("/me", handlers.GetMe)
		authOnly.Get("/match/:path", handlers.GetMatches) // ✅ แก้ 404 ของ match
	}

	// --- 🔵 3. Member Routes (/api/v3/user/...) ---
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 4. Admin Routes (/api/v3/admin/...) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		admin.Get("/users", handlers.GetUsers)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Put("/settings", handlers.UpdateSettings)
		admin.Post("/settle", services.ManualSettlement)
	}
}
