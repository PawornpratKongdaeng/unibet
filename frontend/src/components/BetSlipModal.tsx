"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// PART 0: Interface Definitions (เพื่อความถูกต้องของข้อมูล)
// ============================================================================
interface BetItem {
  id: string;
  matchId: string | number;
  league: string;
  homeName: string;
  awayName: string;
  type: string;      // 'HDP', 'OU', '1X2'
  side: string;      // 'home', 'away', 'over', 'under'
  odds: string | number; // ค่าน้ำ (เช่น -90, 0.95)
  hdp: string | number;  // แต้มต่อ (เช่น 0.5, 1)
  isHomeUpper?: boolean; // ทีมเหย้าเป็นทีมต่อหรือไม่
}

interface BetSlipModalProps {
  bets: BetItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

// ============================================================================
// PART 1: Helper Functions (Logic คำนวณแบบพม่า)
// ============================================================================

// แปลงค่าให้เป็น Float เสมอ ป้องกัน NaN
export const safeFloat = (val: any): number => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// จัด Format การแสดงผลใน UI (เช่น -90, +95)
export const formatMyanmarDisplay = (hdp: number | string, price: number | string) => {
  const hdpVal = Math.abs(safeFloat(hdp));
  const pVal = safeFloat(price);
  const sign = pVal < 0 ? "-" : "+"; 
  const displayPrice = Math.abs(pVal); 
  
  // ถ้าแต้มต่อเป็นจำนวนเต็มไม่ต้องมีทศนิยม (1) ถ้าไม่เต็มให้มี 1 ตำแหน่ง (0.5)
  const hdpDisplay = Number.isInteger(hdpVal) ? hdpVal.toString() : hdpVal.toFixed(1);
  
  // เช่น "0.5-90" หรือ "1+95"
  return `${hdpDisplay}${sign}${displayPrice}`;
};

// คำนวณยอดชนะ (Win) และความเสี่ยงที่ถูกหัก (Risk)
export const calculateMyanmarPayout = (stake: number, price: number, type: string) => {
  const s = safeFloat(stake);
  let p = safeFloat(price);
  const MAX_PAYOUT_RATE = 0.97; // เรทจ่ายสูงสุด (หักคอมฯ หรือไม่ แล้วแต่เว็บ)

  if (s <= 0) return { win: 0, profit: 0, risk: 0 };

  let profit = 0;
  let risk = s;

  // กรณีทายคู่/คี่ (Odd/Even)
  if (type === 'OE') {
    profit = s * 0.90; // จ่าย 0.9 เสมอสำหรับคู่คี่ (ตัวอย่าง)
    risk = s;
    return { win: s + profit, profit: profit, risk: risk };
  } 

  // Normalization: ถ้าค่าน้ำมาแบบ Integer (เช่น -90, 85) ให้หาร 100
  // ถ้ามาแบบ Decimal (0.85, -0.90) ให้ใช้ได้เลย
  const isIntegerFormat = Math.abs(p) > 2.0; 
  const normalizedPrice = isIntegerFormat ? p / 100 : p;

  if (p < 0) { 
    // --- น้ำแดง (Negative / Malay-like) ---
    // แทงน้อยได้เต็ม: เดิมพันตามค่าน้ำ เพื่อเอาเต็มจำนวน
    // Risk = Stake * |Price|
    // Win = Stake (คืนทุน) + Stake (กำไรเต็ม) [หรือคูณ 0.97]
    profit = s * MAX_PAYOUT_RATE; // ได้เต็ม (หักน้ำจิ้ม)
    risk = s * Math.abs(normalizedPrice); // เสียตามราคาน้ำ
  } else {
    // --- น้ำดำ (Positive) ---
    // แทง 100 ได้ตามน้ำ: เสียเต็ม
    let finalPrice = normalizedPrice;
    if (finalPrice > MAX_PAYOUT_RATE) finalPrice = MAX_PAYOUT_RATE;
    
    profit = s * finalPrice; 
    risk = s; // เสียเต็ม
  }
  
  return { win: s + profit, profit: profit, risk: risk };
};

// ============================================================================
// PART 2: BetSlipModal Component
// ============================================================================
export default function BetSlipModal({ bets, isOpen, setIsOpen, onRemove, onClear }: BetSlipModalProps) {
  const [stake, setStake] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SweetAlert Helper
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

  // Logic คำนวณยอดเงินรวม (Memoized)
  const calculation = useMemo(() => {
    const s = safeFloat(stake);
    if (bets.length === 0 || s <= 0) return { win: 0, risk: 0 };

    if (bets.length === 1) {
      // --- บอลเต็ง (Single) ---
      const res = calculateMyanmarPayout(s, safeFloat(bets[0].odds), bets[0].type);
      return { win: res.win, risk: res.risk };
    } else {
      // --- บอลสเต็ป (Parlay) ---
      // สเต็ปมักจะคำนวณแบบคูณทบต้น (Parimutuel) หรือแบบ Fixed Odds
      // ตัวอย่างนี้คำนวณแบบง่าย: เอาค่าน้ำมาคูณกัน
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
    
    // Validation
    if (isNaN(amount) || amount <= 0) return showBetAlert('warning', 'ระบุจำนวนเงิน', 'กรุณาระบุจำนวนเงินเดิมพันให้ถูกต้อง');
    // ตรวจสอบขั้นต่ำ/สูงสุด (ตัวอย่าง)
    if (amount < 20) return showBetAlert('warning', 'ยอดเงินต่ำกว่ากำหนด', 'เดิมพันขั้นต่ำ 20 บาท');
    
    if (bets.length === 0) return showBetAlert('warning', 'เลือกคู่บอล', 'กรุณาเลือกคู่บอลก่อนทำการเดิมพัน');

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) return showBetAlert('error', 'Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');

    setIsSubmitting(true);
    
    try {
      const isSingle = bets.length === 1;
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"; // ใช้ Env Variable

      // Prepare Payload
      const payload = {
        bet_type: isSingle ? "single" : "mixplay",
        total_stake: amount,
        total_payout: calculation.win,
        total_risk: calculation.risk,
        
        ...(isSingle ? {
          // --- Single Bet Payload ---
          match_id: String(bets[0].matchId || ""),
          pick: String(bets[0].side || ""),
          hdp: safeFloat(bets[0].hdp), 
          price: parseInt(String(bets[0].odds)), // แปลงเป็น Int (-90, 90) ตามที่ Backend ต้องการ
          is_home_upper: bets[0].isHomeUpper === true,
          home_team: bets[0].homeName || "",
          away_team: bets[0].awayName || "",
          odds: safeFloat(bets[0].odds),
        } : {
          // --- Mix Parlay Payload ---
          items: bets.map(bet => ({
            match_id: String(bet.matchId || ""),
            side: String(bet.side || ""),
            hdp: safeFloat(bet.hdp),
            price: parseInt(String(bet.odds)),
            is_home_upper: bet.isHomeUpper === true,
            home_team: bet.homeName || "",
            away_team: bet.awayName || "",
            odds: safeFloat(bet.odds),
          }))
        })
      };

      // console.log("🚀 Submitting Payload:", payload);

      const response = await fetch(`${apiBaseUrl}/user/bet`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (!response.ok) {
         throw new Error(result.error || result.message || `Error ${response.status}`);
      }

      // Success
      await showBetAlert('success', 'วางเดิมพันสำเร็จ!', `หักเครดิตจริง ฿${calculation.risk.toLocaleString()} เรียบร้อยแล้ว`);
      
      setStake(""); 
      onClear();    
      setIsOpen(false); 
      
    } catch (error: any) {
      console.error("Bet Error:", error);
      showBetAlert('error', 'ไม่สามารถเดิมพันได้', error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Click outside to close (Optional) */}
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-slate-50">
          <div className="flex flex-col">
            <h3 className="font-black italic uppercase text-emerald-900 tracking-tighter text-xl">
              {bets.length > 1 ? "Mixplay" : "Single Bet"}
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
              {bets.length > 1 ? "Parlay Bet" : "Standard Bet"}
            </span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Bet List */}
        <div className="p-5 max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar">
          {bets.map((bet) => (
            <div key={bet.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group hover:border-emerald-200 transition-all">
              <button 
                onClick={() => onRemove(bet.id)} 
                className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 transition-colors p-1"
              >
                <Trash2 size={16}/>
              </button>
              
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                {bet.league}
              </div>
              <div className="font-bold text-sm text-slate-800 leading-tight">
                {bet.homeName} <span className="text-slate-400 text-xs">vs</span> {bet.awayName}
              </div>
              
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-[10px] font-black uppercase">
                  {bet.side}
                </span>
                <span className="text-xs font-black text-slate-600 italic">
                  {formatMyanmarDisplay(bet.hdp, bet.odds)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer & Actions */}
        <div className="p-6 bg-white space-y-4 border-t shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="relative">
            <span className="absolute top-1/2 -translate-y-1/2 left-4 font-bold text-slate-400">฿</span>
            <input 
              type="number" 
              value={stake} 
              onChange={(e) => setStake(e.target.value)}
              placeholder="จำนวนเงินเดิมพัน"
              className="w-full pl-10 pr-4 py-4 text-slate-800 bg-slate-100 rounded-2xl font-black text-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all placeholder:text-sm placeholder:font-normal"
            />
          </div>

          <div className="flex justify-between items-end px-2 py-2 border-t border-dashed border-slate-100">
            <div className="flex flex-col">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ยอดหักจริง (Risk)</span>
              <span className="text-sm font-bold text-rose-500">
                {calculation.risk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">จ่ายสูงสุด (Win)</span>
              <span className="text-3xl font-[1000] text-emerald-600 tracking-tighter drop-shadow-sm">
                {calculation.win.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || bets.length === 0 || !stake}
            className="w-full py-4 bg-[#013323] text-white rounded-2xl font-black uppercase italic tracking-widest hover:bg-emerald-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
          >
            {isSubmitting ? (
               <span className="flex items-center justify-center gap-2">
                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                 Processing...
               </span>
            ) : "Place Bet Now"}
          </button>
        </div>
      </div>
    </div>
  );
}