package services

func CalculatePayout(amount float64, odds float64, hdp float64, pick string, homeScore int, awayScore int) (string, float64) {
	scoreDiff := float64(homeScore - awayScore)

	if pick == "away" {
		scoreDiff = -scoreDiff
	}

	result := scoreDiff - hdp

	// สูตรราคาน้ำพม่า: กำไร = (เงินเดิมพัน * ราคา) / 100
	profitFull := (amount * odds) / 100
	profitHalf := profitFull / 2

	switch {
	case result >= 0.5:
		// ชนะเต็ม: คืนทุน + กำไรเต็ม
		return "win", amount + profitFull
	case result == 0.25:
		// ชนะครึ่ง: คืนทุน + กำไรครึ่งเดียว
		return "win_half", amount + profitHalf
	case result == 0:
		// เสมอ: คืนทุน
		return "draw", amount
	case result == -0.25:
		// เสียครึ่ง: คืนทุนให้ครึ่งหนึ่งของเงินเดิมพัน
		return "lose_half", amount / 2
	default:
		// แพ้เต็ม: ไม่เหลืออะไรเลย
		return "loss", 0
	}
}
