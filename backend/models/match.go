package models

import (
	"time"

	"gorm.io/gorm"
)

// ==========================================
// 1. Database Models (สำหรับเก็บลงฐานข้อมูล)
// ==========================================

type Match struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	MatchID   string         `gorm:"uniqueIndex" json:"match_id"` // เก็บ ID เป็น String ใน DB
	HomeTeam  string         `json:"home_team"`
	AwayTeam  string         `json:"away_team"`
	MatchTime string         `json:"match_time"` // เวลาแสดงผล (เช่น 22:00)
	HomeLogo  string         `json:"home_logo"`
	AwayLogo  string         `json:"away_logo"`
	StartTime time.Time      `json:"start_time"` // เวลาคำนวณ (Time Object)
	Status    string         `json:"status"`     // เช่น "OPEN", "FT"
	League    string         `json:"league"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

type MatchSummaryResponse struct {
	MatchID    string    `json:"match_id"`
	HomeTeam   string    `json:"home_team"`
	AwayTeam   string    `json:"away_team"`
	StartTime  time.Time `json:"start_time"`
	TotalHome  float64   `json:"total_home"`
	TotalAway  float64   `json:"total_away"`
	TotalOver  float64   `json:"total_over"`
	TotalUnder float64   `json:"total_under"`
}

// ==========================================
// 2. HTAY API Models (สำหรับรับ JSON จากเว็บนอก)
// ==========================================

// HtayResponse: โครงสร้างหลักที่รับ JSON ทั้งก้อน
type HtayResponse struct {
	Status string   `json:"status"`
	Data   HtayData `json:"data"`
}

// HtayData: ก้อน data ข้างใน
type HtayData struct {
	Matches []HtayMatch `json:"matches"`
}

// HtayMatch: รายละเอียดแต่ละคู่ (แมปตาม JSON เป๊ะๆ)
type HtayMatch struct {
	ID        int      `json:"id"`
	MatchId   int64    `json:"matchId"`   // รับเป็น int64 หรือ int
	StartTime string   `json:"startTime"` // รับเป็น String (เดี๋ยวไปแปลงใน Handler)
	Home      HtayTeam `json:"home"`
	Away      HtayTeam `json:"away"`

	// ราคาพม่า (Burmese Odds)
	Odds           float64 `json:"odds"`           // แต้มต่อ (เช่น 0.5, 1)
	Price          float64 `json:"price"`          // ราคาน้ำ (เช่น -10, 80)
	HomeUpper      bool    `json:"homeUpper"`      // เจ้าบ้านต่อ?
	GoalTotal      float64 `json:"goalTotal"`      // สูงต่ำ
	GoalTotalPrice float64 `json:"goalTotalPrice"` // น้ำสูงต่ำ

	// ข้อมูลลีก
	League HtayLeague `json:"league"`

	// สถานะ
	Active bool `json:"active"`
	Status int  `json:"status"`
}

// HtayTeam: ข้อมูลทีม
type HtayTeam struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`    // ชื่อพม่า
	EngName string `json:"engName"` // ชื่ออังกฤษ
}

// HtayLeague: ข้อมูลลีก
type HtayLeague struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// ==========================================
// 3. Settlement Models (สำหรับเช็คผลแพ้ชนะ)
// ==========================================

type MatchResult struct {
	ID     string `json:"id"`
	Status string `json:"status"` // "completed", "canceled"
	Scores struct {
		FullTime struct {
			Home int `json:"home"`
			Away int `json:"away"`
		} `json:"fullTime"`
	} `json:"scores"`
}

// ==========================================
// 4. Aliases (ส่วนสำคัญที่แก้ Error)
// ==========================================
// บรรทัดเหล่านี้ทำให้ Code เก่าที่เรียกชื่อเดิม ยังทำงานได้
type HtayV3Response = HtayResponse
type HtayMatchResult = MatchResult
