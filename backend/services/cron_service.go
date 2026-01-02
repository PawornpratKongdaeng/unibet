package services

import (
	"log"
	// ปรับตาม path ของคุณ
	"github.com/robfig/cron/v3"
)

func InitCron() {
	// สร้าง Cron instance ใหม่
	c := cron.New()

	// 🕒 ตั้งค่าให้รัน AutoSettlement ทุกๆ 5 นาที
	// Format: "*/5 * * * *" (นาที ชั่วโมง วัน เดือน วันในสัปดาห์)
	_, err := c.AddFunc("*/5 * * * *", func() {
		log.Println("⏰ [Cron] Starting AutoSettlement task...")
		AutoSettlement()
	})

	if err != nil {
		log.Fatalf("❌ [Cron] Error scheduling task: %v", err)
	}

	// เริ่มรัน Cron ใน Background
	c.Start()
	log.Println("🚀 [Cron] Scheduler started (running every 5 minutes)")
}
