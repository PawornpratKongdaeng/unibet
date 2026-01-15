package models

import (
	"time"

	"gorm.io/gorm"
)

// ==========================================
// 1. Core Database Models (User & Transactions)
// ==========================================

// Betslip: บิลหลัก (Header)
type Betslip struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	VoucherID string `gorm:"uniqueIndex;size:20" json:"voucher_id"` // รหัสบิลที่ Gen เอง
	UserID    uint   `gorm:"index" json:"user_id"`
	User      User   `gorm:"foreignKey:UserID" json:"user,omitempty"`

	TotalStake  float64 `json:"total_stake"`  // ยอดแทง
	TotalPayout float64 `json:"total_payout"` // ยอดที่อาจจะชนะ (คำนวณไว้ก่อน)
	TotalRisk   float64 `json:"total_risk"`   // ยอดที่หักจริง (Risk)

	BetType string `json:"bet_type"`                              // "single", "mixplay"
	Status  string `gorm:"default:'PENDING';index" json:"status"` // PENDING, WON, LOST, DRAW, CANCELLED

	Items []BetItem `gorm:"foreignKey:BetslipID" json:"items"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// BetItem: รายการย่อยในบิล (Details)
type BetItem struct {
	ID        uint `gorm:"primaryKey" json:"id"`
	BetslipID uint `gorm:"index" json:"betslip_id"`

	MatchID    string `gorm:"index" json:"match_id"`
	LeagueName string `json:"league_name"`
	HomeTeam   string `json:"home_team"`
	AwayTeam   string `json:"away_team"`
	BetSlipID  uint   `json:"bet_slip_id"`

	// ข้อมูลการแทง
	Pick        string  `json:"pick"`          // home, away, over, under
	BetType     string  `json:"bet_type"`      // HDP, OU, 1X2
	Hdp         float64 `json:"hdp"`           // แต้มต่อที่เลือกตอนแทง
	Odds        float64 `json:"odds"`          // ค่าน้ำ (0.95, -0.90)
	Price       int     `json:"price"`         // ราคาพม่าดิบๆ (95, -90) เก็บไว้ดูดั้งเดิม
	IsHomeUpper bool    `json:"is_home_upper"` // ทีมเหย้าต่อหรือไม่

	// ผลลัพธ์ (รอ Settlement มาอัปเดต)
	Result    string `gorm:"default:'PENDING'" json:"result"` // WON, LOST, DRAW, WON_HALF, LOST_HALF
	ScoreHome *int   `json:"score_home"`                      // คะแนนจบเกม
	ScoreAway *int   `json:"score_away"`                      // คะแนนจบเกม

	CreatedAt time.Time `json:"created_at"`
}

// ==========================================
// 2. Match Database Model (ข้อมูลบอลที่ดึงมาเก็บไว้)
// ==========================================

type Match struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	MatchID   string    `gorm:"uniqueIndex" json:"match_id"` // เก็บ ID เป็น String เพื่อความยืดหยุ่น
	HomeTeam  string    `json:"home_team"`
	AwayTeam  string    `json:"away_team"`
	MatchTime string    `json:"match_time"` // เวลาแสดงผล (เช่น 22:00)
	HomeLogo  string    `json:"home_logo"`
	AwayLogo  string    `json:"away_logo"`
	StartTime time.Time `json:"start_time"` // เวลาคำนวณ (Time Object)
	Status    string    `json:"status"`     // เช่น "OPEN", "FT"
	League    string    `json:"league"`

	// เพิ่ม field เพื่อเก็บเรทล่าสุด (Optional: ถ้าอยากเก็บ history ราคา)
	RawData string `gorm:"type:text" json:"-"` // เก็บ JSON ดิบจาก API เผื่อไว้

	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// ==========================================
// 3. API Request Models (รับค่าจาก Frontend React)
// ==========================================

// Payload ที่ส่งมาจากหน้าบ้าน (ต้องตรงกับใน BetSlipModal.tsx)
type PlaceBetRequest struct {
	BetType     string  `json:"bet_type" validate:"required,oneof=single mixplay"`
	TotalStake  float64 `json:"total_stake" validate:"required,min=1"`
	TotalPayout float64 `json:"total_payout"`
	TotalRisk   float64 `json:"total_risk"`

	// กรณี Mixplay (Parlay)
	Items []BetItemRequest `json:"items"`

	// กรณี Single Bet (Fields จะอยู่ชั้นเดียวกับ Root เลย หรือจะใส่ใน Items ตัวเดียวก็ได้ แต่ตาม Frontend เดิมส่งแบบ Flat)
	// เพื่อความง่าย แนะนำให้ Frontend ส่งเป็น Items array เสมอ แม้จะเป็น Single
	// แต่ถ้าต้องรับแบบเดิม ให้เพิ่ม Field ตรงนี้:
	MatchID     string  `json:"match_id,omitempty"`
	Pick        string  `json:"pick,omitempty"`
	Hdp         float64 `json:"hdp,omitempty"`
	Price       int     `json:"price,omitempty"`
	IsHomeUpper bool    `json:"is_home_upper,omitempty"`
	HomeTeam    string  `json:"home_team,omitempty"`
	AwayTeam    string  `json:"away_team,omitempty"`
	Odds        float64 `json:"odds,omitempty"`
}

type BetItemRequest struct {
	MatchID     string  `json:"match_id"`
	Side        string  `json:"side"` // Frontend ส่ง side หรือ pick
	Pick        string  `json:"pick"` // รองรับทั้งสองชื่อ
	Hdp         float64 `json:"hdp"`
	Price       int     `json:"price"`
	IsHomeUpper bool    `json:"is_home_upper"`
	HomeTeam    string  `json:"home_team"`
	AwayTeam    string  `json:"away_team"`
	Odds        float64 `json:"odds"`
}

// ==========================================
// 4. HTAY API Models (รับ JSON จากเว็บนอก)
// ==========================================
// (ส่วนนี้คือ Code เดิมของคุณ ถูกต้องแล้ว)

type HtayResponse struct {
	Status string   `json:"status"`
	Data   HtayData `json:"data"`
}

type HtayData struct {
	Matches []HtayMatch `json:"matches"`
}

type HtayMatch struct {
	ID        int      `json:"id"`
	MatchId   int64    `json:"matchId"` // API ส่งมาเป็น int64
	StartTime string   `json:"startTime"`
	Home      HtayTeam `json:"home"`
	Away      HtayTeam `json:"away"`

	Odds           float64 `json:"odds"`           // แต้มต่อ (HDP)
	Price          float64 `json:"price"`          // ราคาน้ำ (เช่น -10, 80)
	HomeUpper      bool    `json:"homeUpper"`      // เจ้าบ้านต่อ?
	GoalTotal      float64 `json:"goalTotal"`      // สูงต่ำ (OU)
	GoalTotalPrice float64 `json:"goalTotalPrice"` // น้ำสูงต่ำ

	League HtayLeague `json:"league"`
	Active bool       `json:"active"`
	Status int        `json:"status"`
}

type HtayTeam struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	EngName string `json:"engName"`
}

type HtayLeague struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

// ==========================================
// 5. Settlement & Response Models
// ==========================================

type MatchResult struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Scores struct {
		FullTime struct {
			Home int `json:"home"`
			Away int `json:"away"`
		} `json:"fullTime"`
	} `json:"scores"`
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

// Aliases
type HtayV3Response = HtayResponse
type HtayMatchResult = MatchResult
