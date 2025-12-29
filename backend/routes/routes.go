package routes

import (
	"github.com/PawornpratKongdaeng/soccer/handlers"
	"github.com/PawornpratKongdaeng/soccer/middleware"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	// กรุ๊ปหลักของ API v3
	api := app.Group("/api/v3")

	// --- Zone 1: Public ---
	api.Post("/register", handlers.Register)
	api.Post("/login", handlers.Login)
	api.Get("/match/:path", handlers.GetMatches)

	// ดึงข้อมูลธนาคารหน้าเว็บ (สำหรับให้ลูกค้าดูตอนฝากเงิน)
	api.Get("/config/bank", handlers.GetAdminBank)
	app.Static("/uploads", "./uploads")
	app.Post("/api/deposit", handlers.SubmitDeposit)

	// --- Zone 2: Member (ต้องมี Token) ---
	member := api.Group("/", middleware.AuthMiddleware())
	{
		member.Get("/me", handlers.GetMe)
		member.Get("/profile", handlers.GetProfile)
		member.Post("/bet", handlers.PlaceBet)
		member.Get("/bet/history", handlers.GetBetHistory)
		member.Post("/deposit", handlers.CreateDeposit)
		member.Post("/withdraw", handlers.CreateWithdraw)
	}

	// --- Zone 3: Admin (ต้องมี Token + เป็น Admin) ---
	admin := api.Group("/admin", middleware.AuthMiddleware(), middleware.RequireAdminRole())
	{
		// 1. User Management
		admin.Get("/users", handlers.GetUsers)

		// เก็บตัวนี้ไว้ตัวเดียว และลบตัวล่างสุด (บรรทัดที่ 57) ทิ้งไปเลยครับ
		admin.Post("/users/:id/credit", handlers.AdjustUserBalance)

		admin.Put("/users/:id/status", handlers.UpdateUserStatus)
		admin.Patch("/users/:id", handlers.UpdateUser)
		admin.Post("/create-user", handlers.CreateDownline)

		// 2. Financial & Transactions (ตรงตาม UI ที่ทำ)
		admin.Get("/finance/summary", handlers.GetFinanceSummary)           // สรุปยอดฝาก/ถอน/กำไร
		admin.Get("/transactions/pending", handlers.GetPendingTransactions) // รายการรออนุมัติ
		admin.Get("/transactions/history", handlers.GetTransactionHistory)  // ประวัติธุรกรรมทั้งหมด

		// อนุมัติ/ปฏิเสธ (ใช้ POST ตาม API Fetch ใน Frontend)
		admin.Post("/transactions/approve/:id", handlers.ApproveTransaction)
		admin.Post("/transactions/reject/:id", handlers.RejectTransaction)

		// 3. System Config
		admin.Put("/config/bank", handlers.UpdateAdminBank) // แก้ไขเลขบัญชีรับโอน

		// 4. Game Control
		admin.Get("/bets", handlers.GetAllBets)
		admin.Post("/settle", handlers.ManualSettlement)
		admin.Post("/users/:id/credit", handlers.UpdateUserCredit)
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
