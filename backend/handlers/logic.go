package handlers

import (
	"strings"
)

// CalculateResult: คำนวณผลแพ้ชนะ (Win/Lose/Draw/Half)
func CalculateResult(side string, hdp string, homeScore int, awayScore int) string {
	// Logic แบบย่อ (ควรขยายเพิ่มตามราคาต่อรองจริง)
	// สำหรับ MVP: ถ้าแทง Home แล้ว Home ชนะ = won
	diff := homeScore - awayScore

	if side == "home" {
		if diff > 0 {
			return "won"
		}
		if diff < 0 {
			return "lost"
		}
		return "draw"
	}

	if side == "away" {
		if diff < 0 {
			return "won"
		}
		if diff > 0 {
			return "lost"
		}
		return "draw"
	}

	return "pending"
}

// CalculatePayout: คำนวณเงินรางวัล (รับ float64 ทั้งหมด)
func CalculatePayout(amount float64, odds float64, status string) float64 {
	status = strings.ToLower(status)
	switch status {
	case "won":
		return amount * odds
	case "draw":
		return amount // คืนทุน
	case "won_half":
		return amount + ((amount * (odds - 1)) / 2)
	case "lost_half":
		return amount / 2
	default:
		return 0
	}
}
