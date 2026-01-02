package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	api := app.Group("/api/v3")

	// --- Public ---
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/match/:path", handlers.GetMatches)
	api.Get("/config/bank", handlers.GetAdminBank) // ดึงบัญชีแอดมินให้ลูกค้าดู
	app.Static("/uploads", "./uploads")
	app.Post("/transaction/withdraw", handlers.RequestWithdraw)

	// --- Member ---
	member := api.Group("/", middleware.AuthMiddleware())
	{
		member.Get("/me", handlers.GetMe)
		member.Post("/deposit", handlers.CreateDeposit) // ตรงกับหน้า DepositPage
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
		member.Get("/user/balance", handlers.GetBalance)
		member.Get("/user/profile", handlers.GetProfile)
		member.Post("/transaction/withdraw", handlers.RequestWithdraw)
	}

	// --- Admin ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance) // ตัวปรับยอดเงินแอดมิน
		admin.Patch("/users/:id", handlers.UpdateUser)

		// Financial (ตรงกับ UI FinanceStats ที่คุณทำ)
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)

		// ปุ่ม Approve/Reject ในหน้า UI
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// System Config
		admin.Put("/config/bank", handlers.UpdateAdminBank)

		// Game Control
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)

		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// System Config
		admin.Put("/config/bank", handlers.UpdateAdminBank)

		// Game Control
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)
		admin.Get("/settings", handlers.GetSettings)
		admin.Put("/settings", handlers.UpdateSettings)
	}
}
