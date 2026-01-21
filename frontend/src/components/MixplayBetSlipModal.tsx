"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2, Layers } from 'lucide-react';
import Swal from 'sweetalert2';

interface BetItem {
  id: string;
  matchId: string | number;
  league: string;
  homeName: string;
  awayName: string;
  type: string;        
  side: string;        
  odds: string | number; // Price เดิม (-90, 90)
  hdp: string | number;
  isHomeUpper?: boolean;
  teamName?: string;   
}

interface MixplayBetSlipModalProps {
  bets: BetItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  minBets?: number;
  maxBets?: number;
}

const safeFloat = (val: any): number => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

// จัด Format แสดงผล (เช่น HDP 0.5-90)
const formatMyanmarDisplay = (hdp: number | string, price: number | string) => {
  const hdpVal = Math.abs(safeFloat(hdp));
  const pVal = safeFloat(price);
  const sign = pVal < 0 ? "-" : "+"; 
  const displayPrice = Math.abs(pVal); 
  const hdpDisplay = Number.isInteger(hdpVal) ? hdpVal.toString() : hdpVal.toFixed(1);
  return `${hdpDisplay}${sign}${displayPrice}`;
};

export default function MixplayBetSlipModal({ 
  bets, 
  isOpen, 
  setIsOpen, 
  onRemove, 
  onClear,
  minBets = 2,
  maxBets = 12
}: MixplayBetSlipModalProps) {
  
  const [stake, setStake] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme Config
  const theme = { 
    color: 'text-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200', 
    btn: 'bg-[#2E1065]', 
    ring: 'focus:ring-purple-500/50' 
  };

  // Logic คำนวณ (Frontend Only)
  const calculation = useMemo(() => {
    const s = safeFloat(stake);
    if (bets.length < minBets || s <= 0) return { win: 0, multiplier: 0 };

    let totalOdds = 1;
    bets.forEach(bet => {
      const rawPrice = safeFloat(bet.odds);
      // แปลง Price พม่า เป็น Decimal Odds (1.90) เพื่อคำนวณเงินรางวัล
      let decimalOdd = 1 + (Math.abs(rawPrice) / 100); 
      if (decimalOdd < 1.01) decimalOdd = 1.0;
      totalOdds *= decimalOdd;
    });

    const multiplier = parseFloat(totalOdds.toFixed(2));
    const potentialWin = Math.floor(s * totalOdds); 

    return { win: potentialWin, multiplier: multiplier };
  }, [stake, bets, minBets]);

  const getTeamName = (bet: BetItem) => {
    if (bet.teamName) return bet.teamName;
    if (bet.type === 'OU') return bet.side === 'over' ? 'Over' : 'Under';
    if (bet.side === 'home') return bet.homeName;
    if (bet.side === 'away') return bet.awayName;
    return bet.side;
  };

  const handleSubmit = async () => {
    const amount = Number(stake);
    
    // Validation
    if (bets.length < minBets) return Swal.fire('เตือน', `ต้องเลือกอย่างน้อย ${minBets} คู่`, 'warning');
    if (bets.length > maxBets) return Swal.fire('เตือน', `เลือกได้สูงสุด ${maxBets} คู่`, 'warning');
    if (isNaN(amount) || amount <= 0) return Swal.fire('เตือน', 'ระบุเงินเดิมพัน', 'warning');
    
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) return Swal.fire('Error', 'กรุณาเข้าสู่ระบบใหม่', 'error');

    setIsSubmitting(true);
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // ✅ สร้าง Payload (ปรับแก้ตรงนี้)
      const payload = {
        bet_type: "mixplay", 
        total_stake: amount,
        total_risk: amount,  
        total_payout: calculation.win,
        expected_multiplier: calculation.multiplier,
        items: bets.map(bet => {
            const rawPrice = safeFloat(bet.odds);
            // คำนวณ Decimal Odds ส่งไปให้ Backend (กัน Error 400)
            const decimalOdds = 1 + (Math.abs(rawPrice) / 100);

            return {
                match_id: String(bet.matchId),
                side: bet.side, // home, away, over, under
                pick: bet.side, // ส่งไปสำรอง (บาง Backend ใช้ pick)
                bet_type: bet.type, // HDP, OU
                
                // ✅ ส่งค่านี้เพื่อให้ Backend คำนวณได้
                odds: parseFloat(decimalOdds.toFixed(2)), 
                price: rawPrice, // ส่ง Price พม่าเดิม (-90) ไปเก็บ
                
                hdp: safeFloat(bet.hdp),
                is_home_upper: bet.isHomeUpper,
                
                // ✅✅✅ จุดแก้ไขสำคัญ (ชื่อทีม) ✅✅✅
                // ต้องใช้ key ว่า "home_team" และ "away_team" เท่านั้น (ตาม models.go เดิม)
                home_team: bet.homeName,   
                away_team: bet.awayName,
                
                // ส่ง League ไปด้วยเผื่อ Backend รับ (ถ้าไม่รับมันจะ ignore ไปเอง ไม่ error)
                league_name: bet.league, 

                // ชื่อทีมที่เลือกเชียร์
                team_name: getTeamName(bet), 
            };
        })
      };

      console.log("🚀 Payload Frontend Only Fix:", payload);

      const response = await fetch(`${apiBaseUrl}/user/bet`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json", 
            "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (response.ok) {
        Swal.fire({
            icon: 'success',
            title: 'สำเร็จ!',
            text: `บันทึกบิลสเต็ปเรียบร้อย`,
            timer: 2000,
            showConfirmButton: false
        });
        setStake("");
        onClear();
        setIsOpen(false);
      } else {
        console.error("Backend Error:", result);
        Swal.fire('ผิดพลาด', result.error || 'วางเดิมพันไม่สำเร็จ Check Data', 'error');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์', 'error');
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
            <h3 className={`font-black italic uppercase tracking-tighter text-xl flex items-center gap-2 ${theme.color}`}>
              <Layers size={20} /> Mix Parlay
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-7">
              {bets.length} Matches Selected
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} className="text-slate-400" /></button>
        </div>

        {/* Bets List */}
        <div className="p-5 max-h-[40vh] overflow-y-auto space-y-3 custom-scrollbar">
          {bets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">เลือกคู่บอลเพื่อเริ่มสเต็ป</div>
          ) : (
            bets.map((bet, index) => (
              <div key={bet.id} className={`p-4 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-sm hover:${theme.border}`}>
                <button onClick={() => onRemove(bet.id)} className="absolute top-3 right-3 text-slate-300 hover:text-rose-500 p-1"><Trash2 size={16}/></button>
                <div className={`absolute top-3 right-10 text-[10px] font-black ${theme.color} opacity-40`}>#{index + 1}</div>

                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 pr-8 truncate">{bet.league}</div>
                <div className="font-bold text-sm text-slate-800 leading-tight pr-6 mb-2">
                  {bet.homeName} <span className="text-slate-400 text-xs">vs</span> {bet.awayName}
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${theme.bg} ${theme.color}`}>
                    {bet.type}
                  </span>
                  <span className="text-xs font-bold text-slate-700 uppercase">
                      {getTeamName(bet)}
                  </span>
                  <span className="text-xs font-black text-emerald-600 italic ml-auto">
                    {formatMyanmarDisplay(bet.hdp, bet.odds)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer (Input Money) */}
        <div className="p-6 bg-white space-y-4 border-t shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
          <div className="relative group">
            <span className="absolute top-1/2 -translate-y-1/2 left-4 font-bold text-slate-400">฿</span>
            <input 
              type="number" 
              value={stake} 
              onChange={(e) => setStake(e.target.value)} 
              placeholder="ระบุเงินเดิมพัน"
              className={`w-full pl-10 pr-4 py-4 text-slate-800 bg-slate-100 rounded-2xl font-black text-xl outline-none transition-all ${theme.ring} focus:bg-white`}
            />
          </div>

          <div className="flex justify-between items-end px-2 pt-2 border-t border-dashed border-slate-100">
             <div>
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Odds</div>
                <div className="text-xl font-black text-purple-600">x{calculation.multiplier}</div>
             </div>
             <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Potential Win</div>
                <div className="text-3xl font-[1000] text-emerald-600">
                    {calculation.win.toLocaleString()}
                </div>
             </div>
          </div>

          <button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !stake || bets.length < minBets}
              className={`w-full py-4 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-lg hover:brightness-110 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed ${theme.btn}`}
          >
              {isSubmitting ? "Processing..." : "Place Parlay"}
          </button>
        </div>
      </div>
    </div>
  );
}