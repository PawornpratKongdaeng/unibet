// services/betService.ts
import { apiFetch } from "../lib/api";

export const betService = {
  // ฟังก์ชันวางเดิมพันรายใบ
  placeSingleBet: async (payload: any) => {
    return apiFetch("/user/bet", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // (Optional) หากในอนาคต Go Backend รองรับการส่งทีละหลายใบ (Batch)
  // จะช่วยลด Network Request และป้องกันเงินหักไม่ครบได้ดีมาก
  placeBulkBets: async (bets: any[]) => {
    return apiFetch("/user/bet/bulk", {
      method: "POST",
      body: JSON.stringify({ bets }),
    });
  }
};