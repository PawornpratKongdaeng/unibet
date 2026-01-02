package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// สร้าง API Group หลัก
	api := app.Group("/api/v3")

	// --- 1. 🟢 Public Routes (ไม่ต้องมี Token / ไม่มี Middleware กั้น) ---
	// ย้าย GetMatches และ GetSettings มาไว้บนสุดเพื่อให้ Fiber หาเจอก่อนเพื่อน
	// 🔒 ต้องล็อกอินเท่านั้นถึงจะดู match ได้
	member := api.Group("/", middleware.AuthMiddleware())
	member.Get("/match/:path", handlers.GetMatches)
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)

	// Static files และ Withdraw Request (Public ตามโค้ดเดิม)
	app.Static("/uploads", "./uploads")
	api.Post("/transaction/withdraw-request", handlers.RequestWithdraw) // เปลี่ยนชื่อนิดหน่อยกันงงกับ member

	// --- 2. 🔵 Member Routes (ต้อง Login เท่านั้น) ---
	{
		member.Get("/me", handlers.GetMe)
		member.Get("/user/balance", handlers.GetBalance)
		member.Get("/user/profile", handlers.GetProfile)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 3. 🔴 Admin Routes (ต้อง Login + เป็น Admin เท่านั้น) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)

		// Financial
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// System Config (Admin จัดการได้)
		admin.Put("/config/bank", handlers.UpdateAdminBank)
		admin.Get("/settings", handlers.GetSettings)    // Admin ดูในหน้าหลังบ้านได้
		admin.Put("/settings", handlers.UpdateSettings) // Admin แก้ไขได้

		// Game Control
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)
	}
}
