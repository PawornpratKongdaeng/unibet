"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2, Layers, Ticket } from 'lucide-react';
import Swal from 'sweetalert2';

// ============================================================================
// Interfaces
// ============================================================================
interface BetItem {
  id: string;
  matchId: string | number;
  league: string;
  homeName: string;
  awayName: string;
  type: string;        
  side: string;        
  odds: string | number;
  hdp: string | number;
  isHomeUpper?: boolean;
  teamName?: string;   
}

interface BetSlipModalProps {
  bets: BetItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

// ============================================================================
// PART 2: Helper Functions (สูตรคำนวณ)
// ============================================================================

export const safeFloat = (val: any): number => {
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
  const RATE_OE = 0.95;  
  const RATE_MAX = 0.97; 

  if (s <= 0) return { win: 0, profit: 0, risk: 0 };

  let profit = 0;
  let risk = s;

  if (type === 'OE' || type === 'odd' || type === 'even') {
      profit = s * RATE_OE;
      risk = s;
      return { win: s + profit, profit: profit, risk: risk };
  } 

  const isIntegerFormat = Math.abs(p) > 2.0; 
  const normalizedPrice = isIntegerFormat ? p / 100 : p;

  if (p < 0) { 
      // น้ำแดง
      profit = s * RATE_MAX; 
      risk = s * Math.abs(normalizedPrice); 
  } else {
      // น้ำดำ
      let finalPrice = normalizedPrice;
      if (finalPrice > RATE_MAX) finalPrice = RATE_MAX;
      profit = s * finalPrice; 
      risk = s; 
  }
  return { win: s + profit, profit: profit, risk: risk };
};

// ============================================================================
// PART 3: Main Component
// ============================================================================

export default function BetSlipModal({ bets, isOpen, setIsOpen, onRemove, onClear }: BetSlipModalProps) {
  
  const [stake, setStake] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ 1. เช็คโหมด: ถ้ามากกว่า 1 คู่ เป็น Mix, ถ้า 1 คู่ เป็น Single
  const isMixMode = bets.length > 1;

  const theme = isMixMode 
    ? { color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', btn: 'bg-[#2E1065]', ring: 'focus:ring-purple-500/50' }
    : { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', btn: 'bg-[#013323]', ring: 'focus:ring-emerald-500/50' };

  const calculation = useMemo(() => {
    const s = safeFloat(stake);
    if (bets.length === 0 || s <= 0) return { win: 0, multiplier: 0, risk: 0 };

    if (isMixMode) {
      // --- Mix Parlay Logic ---
      let totalOdds = 1;
      bets.forEach(bet => {
        const p = Math.abs(safeFloat(bet.odds));
        const normalized = p > 2.0 ? p / 100 : p;
        totalOdds *= (1 + normalized);
      });
      const multiplier = parseFloat(totalOdds.toFixed(2));
      const potentialWin = Math.floor(s * totalOdds);
      return { win: potentialWin, multiplier: multiplier, risk: s };
    } else {
      // --- Single Bet Logic ---
      const bet = bets[0];
      const res = calculateMyanmarPayout(s, safeFloat(bet.odds), bet.type);
      return { win: res.win, multiplier: 0, risk: res.risk };
    }
  }, [stake, bets, isMixMode]);

  const getTeamName = (bet: BetItem) => {
    if (bet.teamName) return bet.teamName;
    if (bet.type === 'OU') return bet.side === 'over' ? 'Over' : 'Under';
    if (bet.side === 'home') return bet.homeName;
    if (bet.side === 'away') return bet.awayName;
    return bet.side;
  };

  const handleSubmit = async () => {
    const amount = Number(stake);
    if (isNaN(amount) || amount <= 0) return Swal.fire('แจ้งเตือน', 'กรุณาระบุเงินเดิมพัน', 'warning');
    if (amount < 10) return Swal.fire('แจ้งเตือน', 'เดิมพันขั้นต่ำ 10 บาท', 'warning');

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    
    setIsSubmitting(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      let payload: any = {};

      if (isMixMode) {
        // ==========================================
        // CASE 1: MIX PARLAY (สเต็ป)
        // ==========================================
        payload = {
          bet_type: "mixplay",
          total_stake: amount,
          total_risk: amount, 
          total_payout: calculation.win,
          expected_multiplier: calculation.multiplier,
          // ✅ ส่ง items array โดยเพิ่ม home_team, away_team เข้าไปในแต่ละ item
          items: bets.map(bet => ({
            match_id: String(bet.matchId),
            side: bet.side,
            odds: safeFloat(bet.odds),
            hdp: String(bet.hdp),
            price: parseInt(String(bet.odds)), 
            is_home_upper: bet.isHomeUpper,
            team_name: getTeamName(bet),
            bet_type: bet.type,
            
            // 🔥 [สำคัญ] เพิ่มฟิลด์ชื่อทีมลงไป เพื่อให้ Backend บันทึกลง DB
            home_team: bet.homeName,
            away_team: bet.awayName,
            league_name: bet.league
          }))
        };
      } else {
        // ==========================================
        // CASE 2: SINGLE BET (เต็ง)
        // ==========================================
        const bet = bets[0];
        payload = {
          bet_type: "single",
          total_stake: amount,
          total_risk: calculation.risk, 
          total_payout: calculation.win,
          
          match_id: String(bet.matchId),
          pick: bet.side,
          hdp: safeFloat(bet.hdp),
          price: parseInt(String(bet.odds)),
          is_home_upper: bet.isHomeUpper,
          team_name: getTeamName(bet),
          odds: safeFloat(bet.odds),

          // 🔥 [สำคัญ] เพิ่มฟิลด์ชื่อทีมลงไปใน Root Object สำหรับบอลเต็ง
          home_team: bet.homeName,
          away_team: bet.awayName,
          league_name: bet.league
        };
      }

      console.log("🚀 Payload Sending:", payload);

      const response = await fetch(`${apiBaseUrl}/api/v3/user/bet`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        const ticketId = result.ticket_id || result.id || result.bill_no || "---";
        Swal.fire({
            icon: 'success',
            title: 'เดิมพันสำเร็จ',
            text: `บิล #${ticketId} (หักเครดิต ฿${calculation.risk.toLocaleString()})`,
            timer: 2000,
            showConfirmButton: false
        });
        setStake("");
        onClear(); 
        setIsOpen(false); 
      } else {
        Swal.fire('ผิดพลาด', result.error || result.message || 'วางเดิมพันไม่สำเร็จ', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Connection Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

      <div className="relative bg-white w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className={`p-5 border-b flex justify-between items-center ${theme.bg}`}>
          <div className="flex flex-col">
            <h3 className={`font-black italic uppercase tracking-tighter text-xl flex items-center gap-2 ${isMixMode ? 'text-purple-900' : 'text-emerald-900'}`}>
              {isMixMode ? <Layers size={20} className="text-purple-600"/> : <Ticket size={20} className="text-emerald-600"/>}
              {isMixMode ? "Mix Parlay" : "Single Bet"}
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest pl-7 ${isMixMode ? 'text-purple-500' : 'text-emerald-500'}`}>
              {isMixMode ? `Step ${bets.length} Teams` : "Myanmar Odds"}
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
        </div>

        {/* Bets List */}
        <div className="p-5 max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar">
          {bets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">เลือกคู่บอลเพื่อเริ่มเดิมพัน</div>
          ) : (
            bets.map((bet, index) => (
              <div key={bet.id} className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-sm hover:${theme.border}`}>
                <button onClick={() => onRemove(bet.id)} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 p-1 transition-colors"><Trash2 size={16}/></button>
                
                {isMixMode && <div className={`absolute top-3 right-10 text-[10px] font-black ${theme.color} opacity-40`}>#{index + 1}</div>}

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 pr-8 truncate">{bet.league}</div>
                <div className="font-bold text-sm text-slate-800 leading-tight pr-6 mb-2">
                  {bet.homeName} <span className="text-slate-400 text-xs">vs</span> {bet.awayName}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${bet.type === 'OU' ? 'bg-blue-100 text-blue-700' : `${theme.bg} ${theme.color}`}`}>
                    {bet.type === 'OU' ? 'O/U' : (bet.type === 'OE' ? 'OE' : 'HDP')}
                  </span>
                  <span className="text-xs font-bold text-slate-700 uppercase">
                      {getTeamName(bet)}
                  </span>
                  <span className="text-xs font-black text-emerald-600 italic ml-auto">
                    {bet.type !== 'OE' && formatMyanmarDisplay(bet.hdp, bet.odds)}
                    {bet.type === 'OE' && (Number(bet.odds) < 0 ? '-' : '+') + Math.abs(Number(bet.odds))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white space-y-4 border-t shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          
          <div className="relative group">
            <span className="absolute top-1/2 -translate-y-1/2 left-4 font-bold text-slate-400 group-focus-within:text-slate-600 transition-colors">฿</span>
            <input 
              type="number" 
              value={stake} 
              onChange={(e) => setStake(e.target.value)} 
              placeholder="จำนวนเงิน (Min 10)"
              className={`w-full pl-10 pr-4 py-4 text-slate-800 bg-slate-100 rounded-2xl font-black text-xl outline-none transition-all ${theme.ring} focus:bg-white`}
            />
          </div>

          <div className="flex justify-between items-end px-2 pt-2 border-t border-dashed border-slate-100">
             
             {isMixMode ? (
               <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Odds</div>
                  <div className="text-lg font-black text-purple-500">x{calculation.multiplier}</div>
               </div>
             ) : (
               <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Risk (ทุน)</div>
                  <div className="text-lg font-black text-rose-500">
                    {calculation.risk.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})}
                  </div>
               </div>
             )}
             
             <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Potential Win</div>
                <div className="text-3xl font-[1000] text-emerald-600">
                    {calculation.win.toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: 0})}
                </div>
             </div>
          </div>

          <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !stake || bets.length === 0}
              className={`w-full py-4 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-lg hover:brightness-110 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed ${theme.btn}`}
          >
              {isSubmitting ? "Processing..." : (isMixMode ? "Place Mix Parlay" : "Place Single Bet")}
          </button>
        </div>

      </div>
    </div>
  );
}