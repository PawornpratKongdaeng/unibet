"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// PART 1: Helper Functions (คำนวณแบบพม่าตามที่คุณระบุ)
// ============================================================================
export const safeFloat = (val: any) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

export const formatMyanmarDisplay = (hdp: number | string, price: number | string) => {
    const hdpVal = Math.abs(safeFloat(hdp));
    const pVal = safeFloat(price);
    const sign = pVal < 0 ? "-" : "+"; 
    const displayPrice = Math.abs(pVal); 
    const hdpDisplay = Number.isInteger(hdpVal) ? hdpVal.toString() : hdpVal.toFixed(1);
    return `${hdpDisplay}${sign}${displayPrice}`;
};

export const calculateMyanmarPayout = (stake: number, price: number, type: string) => {
    const s = safeFloat(stake);
    let p = safeFloat(price);
    const MAX_PAYOUT_RATE = 0.97; // เรทจ่ายสูงสุด

    if (s <= 0) return { win: 0, profit: 0, risk: 0 };
    let profit = 0;
    let risk = s;

    if (type === 'OE') {
        profit = s * 0.90;
        risk = s;
        return { win: s + profit, profit: profit, risk: risk };
    } 

    const isIntegerFormat = Math.abs(p) > 2.0; 
    const normalizedPrice = isIntegerFormat ? p / 100 : p;

    if (p < 0) { 
        profit = s * MAX_PAYOUT_RATE; 
        risk = s * Math.abs(normalizedPrice); 
    } else {
        let finalPrice = normalizedPrice;
        if (finalPrice > MAX_PAYOUT_RATE) finalPrice = MAX_PAYOUT_RATE;
        profit = s * finalPrice; 
        risk = s; 
    }
    return { win: s + profit, profit: profit, risk: risk };
};

// ============================================================================
// PART 2: BetSlipModal (รักษา UI เดิม 100%)
// ============================================================================
interface BetSlipModalProps {
  bets: any[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function BetSlipModal({ bets, isOpen, setIsOpen, onRemove, onClear }: BetSlipModalProps) {
  const [stake, setStake] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showBetAlert = (icon: 'success' | 'error' | 'warning', title: string, text: string) => {
    return Swal.fire({
      icon,
      title,
      text,
      background: '#013323', 
      color: '#ffffff',
      confirmButtonColor: '#10b981', 
      confirmButtonText: 'ตกลง',
      customClass: {
        popup: 'rounded-[2rem]',
        title: 'font-black uppercase italic',
        confirmButton: 'rounded-xl font-bold px-8 py-2'
      }
    });
  };

  // เปลี่ยนมาใช้ Logic คำนวณแบบพม่า
  const calculation = useMemo(() => {
    const s = safeFloat(stake);
    if (bets.length === 0 || s <= 0) return { win: 0, risk: 0 };

    if (bets.length === 1) {
      // บอลเตี่ยว (Single)
      const res = calculateMyanmarPayout(s, safeFloat(bets[0].odds), bets[0].type);
      return { win: res.win, risk: res.risk };
    } else {
      // บอลชุด (Parlay) คำนวณแบบคูณปกติ
      let totalOdds = 1;
      bets.forEach(bet => {
        const p = Math.abs(safeFloat(bet.odds));
        const normalized = p > 2.0 ? p / 100 : p;
        totalOdds *= (1 + normalized);
      });
      return { win: s * totalOdds, risk: s };
    }
  }, [stake, bets]);

  const handleSubmit = async () => {
    const amount = Number(stake);
    if (isNaN(amount) || amount <= 0) return showBetAlert('warning', 'ระบุจำนวนเงิน', 'กรุณาระบุจำนวนเงินเดิมพันให้ถูกต้อง');
    if (bets.length === 0) return showBetAlert('warning', 'เลือกคู่บอล', 'กรุณาเลือกคู่บอลก่อนทำการเดิมพัน');

    const token = localStorage.getItem("token");
    if (!token) return showBetAlert('error', 'Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');

    setIsSubmitting(true);
    try {
      const isSingle = bets.length === 1;
      const payload = {
        bet_type: isSingle ? "single" : "mixplay",
        total_stake: amount,
        total_payout: calculation.win,
        total_risk: calculation.risk, // ส่งยอดที่หักเงินจริงไปที่ API
        ...(isSingle ? {
          match_id: String(bets[0].matchId || ""),
          pick: bets[0].side || "",
          odds: safeFloat(bets[0].odds),
          hdp: String(bets[0].hdp || "0"),
        } : {
          items: bets.map(bet => ({
            match_id: String(bet.matchId || ""),
            side: bet.side || "",
            odds: safeFloat(bet.odds),
            hdp: String(bet.hdp || "0")
          }))
        })
      };

      const response = await fetch("https://api.thunibet.com/api/v3/user/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (response.ok) {
        await showBetAlert('success', 'วางเดิมพันสำเร็จ!', `หักเครดิตจริง ฿${calculation.risk.toLocaleString()} เรียบร้อยแล้ว`);
        setStake(""); 
        onClear();    
        setIsOpen(false); 
      } else {
        showBetAlert('error', 'ไม่สามารถเดิมพันได้', result.error || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์");
      }
    } catch (error) {
      showBetAlert('error', 'ผิดพลาด', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
        
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-black italic uppercase text-emerald-900 tracking-tighter">
            {bets.length > 1 ? "Mixplay (Parlay)" : "Single Bet"}
          </h3>
          <button onClick={() => setIsOpen(false)}><X size={24} className="text-slate-400" /></button>
        </div>

        <div className="p-6 max-h-[40vh] overflow-y-auto space-y-3">
          {bets.map((bet) => (
            <div key={bet.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <button onClick={() => onRemove(bet.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 size={16}/>
              </button>
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{bet.league}</div>
              <div className="font-bold text-sm text-slate-800">{bet.homeName} vs {bet.awayName}</div>
              <div className="mt-2 text-xs font-black text-emerald-500 italic">
                {/* แสดงผลรูปแบบพม่าในตะกร้า */}
                {bet.side.toUpperCase()} {formatMyanmarDisplay(bet.hdp, bet.odds)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-white space-y-4 border-t">
          <div className="relative">
            <input 
              type="number" value={stake} onChange={(e) => setStake(e.target.value)}
              placeholder="จำนวนเงิน"
              className="w-full p-4 text-slate-700 bg-slate-100 rounded-xl font-bold text-xl outline-none focus:ring-2 ring-emerald-500 transition-all"
            />
          </div>

          <div className="flex justify-between items-center px-2">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">ยอดจ่ายโดยประมาณ</span>
            <span className="text-2xl font-black text-emerald-600">
              {calculation.win.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || bets.length === 0}
            className="w-full py-4 bg-[#013323] text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการเดิมพัน"}
          </button>
        </div>
      </div>
    </div>
  );
}