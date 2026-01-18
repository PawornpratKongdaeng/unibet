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

	// API Group V3
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes ---
	api.Post("/login", handlers.Login)
	api.Post("/register", handlers.Register)
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	api.Post("/transaction/withdraw-request", handlers.RequestWithdraw)

	// --- 🔵 2. Root Protected Routes ---
	authOnly := api.Group("/", middleware.AuthMiddleware())
	{
		authOnly.Get("/me", handlers.GetMe)
		authOnly.Get("/match/:path", handlers.GetMatches)
	}

	// --- 🔵 3. Member Routes ---
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet-history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 4. Admin Routes ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Get("/users/:id", handlers.GetUser)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)
		admin.Delete("/users/:id", handlers.DeleteUser)
		admin.Post("/users", handlers.Register)
		app.Post("/admin/users", handlers.IsAuthenticated, handlers.CreateUser)

		// Financial & Transactions
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)
		admin.Get("/transactions", handlers.GetLatestTransactions)

		// ✅ แก้ไข 1: เพิ่มฟังก์ชันนี้ใน Handler แล้ว ใช้งานได้เลย
		admin.Get("/users/:id/transactions", handlers.GetUserTransactions)

		admin.Get("/betslips", handlers.GetAdminBetSlips)
		admin.Delete("/betslips/:id", handlers.DeleteBetSlip)
		admin.Post("/transactions/approve-only/:id", handlers.ApproveDepositSlipOnly)

		// System Configuration
		admin.Put("/config/bank", handlers.UpdateAdminBank)
		admin.Put("/settings", handlers.UpdateSettings)

		// Game & Settlement
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)

		// User Actions
		admin.Post("/users/:id/password", handlers.UpdatePassword)
		admin.Post("/users/:id/toggle-lock", handlers.ToggleUserLock)

		// ✅ แก้ไข 2: เปลี่ยนชื่อเรียกให้ตรงกับ Handler ใหม่ (GetUserBetsAdmin)
		admin.Get("/users/:id/bets", handlers.GetUserBetsAdmin)

		admin.Get("/matches-summary", handlers.GetMatchesSummary)
	}
}
