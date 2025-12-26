package services

// CalculatePayout ผลลัพธ์: status (win, loss, etc.), payout (ยอดเงิน), multiplier (ตัวคูณสำหรับสเต็ป)
func CalculatePayout(amount float64, odds float64, hdp float64, pick string, homeScore int, awayScore int) (string, float64, float64) {
	scoreDiff := float64(homeScore - awayScore)

	// ถ้าแทงทีมเยือน ให้กลับค่าส่วนต่างประตูเพื่อคำนวณ
	if pick == "away" {
		scoreDiff = -scoreDiff
	}

	// คำนวณผลต่างหลังหักราคาต่อ
	result := scoreDiff - hdp

	switch {
	case result > 0.25:
		// ชนะเต็ม
		return "win", amount + (amount * odds), odds
	case result == 0.25:
		// ชนะครึ่ง: สูตรคือ 1 + (ราคา / 2)
		return "win_half", amount + (amount * odds / 2), 1 + (odds / 2)
	case result == 0:
		// เสมอ (เจ๊า): คืนทุน
		return "draw", amount, 1.0
	case result == -0.25:
		// เสียครึ่ง: คืนทุนครึ่งหนึ่ง
		return "lose_half", amount / 2, 0.5
	default:
		// แพ้เต็ม
		return "loss", 0, 0
	}
}
