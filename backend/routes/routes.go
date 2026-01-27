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
	api.Post("/register", handlers.Register) // อันนี้คือสมัครสมาชิกหน้าเว็บ (ลูกค้าสมัครเอง)
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
	// Group นี้เช็คสิทธิ์ Admin เท่านั้น
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Get("/users/:id", handlers.GetUser)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)
		admin.Delete("/users/:id", handlers.DeleteUser)

		// ✅ แก้ไข: ใช้ handlers.CreateUser เพื่อให้รองรับการสร้าง Agent/Member และใส่ Role ได้
		// (ลบ app.Post ที่เขียนผิดด้านล่างออก แล้วใช้บรรทัดนี้แทน)
		admin.Post("/users", handlers.CreateUser)

		// Financial & Transactions
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)
		admin.Get("/transactions", handlers.GetLatestTransactions)
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
		admin.Get("/users/:id/bets", handlers.GetUserBetsAdmin)
		admin.Get("/matches-summary", handlers.GetMatchesSummary)
	}
}
