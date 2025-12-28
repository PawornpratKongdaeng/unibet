package handlers

import (
	"math"
	"strconv"
	"strings"
)

// CalculatePayout: ฟังก์ชันหลักที่ระบบ Auto Settlement จะเรียกใช้
// 1. เปลี่ยน hdpStr string เป็น hdp float64

// calculateMoneyBurmese: คำนวณเงินรางวัล (พม่า)
func calculateMoneyBurmese(amount, odds float64, status string) float64 {
	isNegativeOdds := odds < 0
	absOdds := math.Abs(odds)

	switch status {
	case "won":
		if isNegativeOdds {
			return amount + amount // น้ำแดง: ได้เต็ม + ทุนเต็ม
		}
		return amount + (amount * absOdds) // น้ำดำ: ได้ตามน้ำ + ทุน

	case "won_half":
		if isNegativeOdds {
			return amount + (amount / 2) // น้ำแดงชนะครึ่ง: ทุน + 50% ของยอดแทง
		}
		return amount + ((amount * absOdds) / 2) // น้ำดำชนะครึ่ง: ทุน + (กำไร/2)

	case "draw":
		return amount // เสมอคืนทุน

	case "lost_half":
		if isNegativeOdds {
			return amount - ((amount * absOdds) / 2) // น้ำแดงเสียครึ่ง: คืนเงินส่วนที่ไม่ได้เสีย
		}
		return amount / 2 // น้ำดำเสียครึ่ง: คืนทุนครึ่งหนึ่ง

	case "lost":
		if isNegativeOdds {
			return amount - (amount * absOdds) // น้ำแดงแพ้: คืนส่วนต่าง (เช่น น้ำ -0.8 คืน 20)
		}
		return 0 // น้ำดำแพ้: ไม่คืนเงิน

	default:
		return 0
	}
}

// parseHDP: แปลงข้อความราคาต่อรองเป็นตัวเลข
func parseHDP(hdpStr string) float64 {
	hdpStr = strings.ReplaceAll(hdpStr, "/", "-")
	if strings.Contains(hdpStr, "-") {
		parts := strings.Split(hdpStr, "-")
		if len(parts) == 2 {
			v1, _ := strconv.ParseFloat(parts[0], 64)
			v2, _ := strconv.ParseFloat(parts[1], 64)
			return (v1 + v2) / 2
		}
	}
	val, _ := strconv.ParseFloat(hdpStr, 64)
	return val
}
