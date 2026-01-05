package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/PawornpratKongdaeng/soccer/services"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// 1. Static Files (สำหรับเก็บรูปภาพอัปโหลด)
	app.Static("/uploads", "./uploads")

	// สร้าง API Group หลักเวอร์ชัน 3
	api := app.Group("/api/v3")

	// --- 🟢 1. Public Routes (ไม่ต้องใช้ Token) ---
	// กลุ่มนี้ใครก็เข้าถึงได้ เช่น หน้า Login, Register หรือดูตั้งค่าเริ่มต้น
	api.Post("/login", handlers.Login)
	api.Post("/register", handlers.Register)
	api.Get("/settings", handlers.GetSettings)
	api.Get("/config/bank", handlers.GetAdminBank)
	// สำหรับหน้าแจ้งถอนแบบไม่ต้อง Login (ถ้ามี)
	api.Post("/transaction/withdraw-request", handlers.RequestWithdraw)

	// --- 🔵 2. Root Protected Routes (ต้องมี Token และไม่มี Prefix /user) ---
	// **สำคัญ**: แก้ปัญหา 404/401 เพราะ Frontend เรียก /api/v3/me และ /api/v3/match
	authOnly := api.Group("/", middleware.AuthMiddleware())
	{
		authOnly.Get("/me", handlers.GetMe)               // ดึงข้อมูลตัวเอง
		authOnly.Get("/match/:path", handlers.GetMatches) // ดึงข้อมูลการแข่งขัน (live, results, etc.)
	}

	// --- 🔵 3. Member Routes (เรียกผ่าน /api/v3/user/...) ---
	// กลุ่มนี้สำหรับฟังก์ชันที่เจาะจงว่าเป็น User
	member := api.Group("/user", middleware.AuthMiddleware())
	{
		member.Get("/balance", handlers.GetBalance)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
		member.Get("/bet-history", handlers.GetBetHistory)
		member.Post("/bet", handlers.PlaceBet)
	}

	// --- 🔴 4. Admin Routes (เรียกผ่าน /api/v3/admin/...) ---
	// ต้อง Login + เป็น Admin เท่านั้น
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// User Management
		admin.Get("/users", handlers.GetUsers)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)
		admin.Delete("/users/:id", handlers.DeleteUser)

		// Financial & Transactions
		admin.Get("/finance/summary", handlers.GetFinanceSummary)
		admin.Get("/transactions/pending", handlers.GetPendingTransactions)
		admin.Get("/transactions/history", handlers.GetTransactionHistory)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// System Configuration
		admin.Put("/config/bank", handlers.UpdateAdminBank)
		admin.Put("/settings", handlers.UpdateSettings)

		// Game & Settlement
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", services.ManualSettlement)
	}
}
