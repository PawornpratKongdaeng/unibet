"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2, Layers, AlertCircle } from 'lucide-react';
import Swal from 'sweetalert2';

// --- Helper Functions (ใช้ชุดเดียวกับ SingleBet เพื่อความต่อเนื่องของ UI) ---
const safeFloat = (val: any) => {
  const num = parseFloat(val);
  return isNaN(num) ? 0 : num;
};

const formatMyanmarDisplay = (hdp: number | string, price: number | string) => {
  const hdpVal = Math.abs(safeFloat(hdp));
  const pVal = safeFloat(price);
  const sign = pVal < 0 ? "-" : "+"; 
  const displayPrice = Math.abs(pVal); 
  const hdpDisplay = Number.isInteger(hdpVal) ? hdpVal.toString() : hdpVal.toFixed(1);
  return `${hdpDisplay}${sign}${displayPrice}`;
};

// --- Props Definition ---
interface MixplayBetSlipModalProps {
  bets: any[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  minBets?: number; // กำหนดขั้นต่ำ (เช่น 2 คู่)
  maxBets?: number; // กำหนดสูงสุด (เช่น 10 คู่)
}

export default function MixplayBetSlipModal({ 
  bets, 
  isOpen, 
  setIsOpen, 
  onRemove, 
  onClear,
  minBets = 2,
  maxBets = 10
}: MixplayBetSlipModalProps) {
  
  const [stake, setStake] = useState<string>(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Alert Helper ---
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

  // --- Logic คำนวณเงินรางวัล (สำหรับบอลชุดโดยเฉพาะ) ---
  const calculation = useMemo(() => {
    const s = safeFloat(stake);
    if (bets.length === 0) return { win: 0, multiplier: 0 };

    // สูตรคำนวณบอลชุด: นำค่าน้ำมาคูณกัน (Convert เป็น Decimal ก่อนคูณ)
    // หมายเหตุ: สูตรนี้คือการประมาณการเบื้องต้น สูตรจริงขึ้นอยู่กับ Server ว่าคิดแบบ Step ตายครึ่ง/ได้ครึ่ง อย่างไร
    let totalMultiplier = 1;

    bets.forEach(bet => {
      let p = safeFloat(bet.odds);
      // แปลงราคาพม่า/มาเลย์ ให้เป็นตัวคูณ (Decimal Odds)
      // ตัวอย่าง: ราคา 0.90 -> คูณ 1.90
      // ตัวอย่าง: ราคา -0.90 -> (ระบบบอลชุดปกติจะคิดเป็นค่าน้ำมาเลย์ หรือแปลงเป็น Euro)
      // ในที่นี้สมมติว่าเป็น Positive Odds ทั้งหมดเพื่อการคูณ (Logic ทั่วไปของหน้าเว็บ)
      const absPrice = Math.abs(p);
      const normalized = absPrice > 2.0 ? absPrice / 100 : absPrice;
      
      totalMultiplier *= (1 + normalized);
    });

    // ตัดทศนิยมเหลือ 2 ตำแหน่งสำหรับตัวคูณ
    totalMultiplier = parseFloat(totalMultiplier.toFixed(2));

    return { 
      win: s * totalMultiplier, 
      multiplier: totalMultiplier 
    };
  }, [stake, bets]);

  // --- Handle Submit ---
  const handleSubmit = async () => {
    const amount = Number(stake);
    
    // 1. Validate Basic
    if (isNaN(amount) || amount <= 0) return showBetAlert('warning', 'ระบุจำนวนเงิน', 'กรุณาระบุจำนวนเงินเดิมพันให้ถูกต้อง');
    
    // 2. Validate Mixplay Rules
    if (bets.length < minBets) return showBetAlert('warning', 'จำนวนคู่ไม่ถึงเกณฑ์', `ต้องเลือกอย่างน้อย ${minBets} คู่ สำหรับบอลชุด`);
    if (bets.length > maxBets) return showBetAlert('warning', 'จำนวนคู่เกินกำหนด', `เลือกได้สูงสุด ${maxBets} คู่ เท่านั้น`);

    // 3. Check Token
    const token = localStorage.getItem("token");
    if (!token) return showBetAlert('error', 'Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');

    setIsSubmitting(true);
    try {
      // Payload สำหรับ Mixplay
      const payload = {
        bet_type: "mixplay",
        total_stake: amount,
        total_risk: amount, // บอลชุด ความเสี่ยงเท่ากับเงินต้นเสมอ
        total_payout: calculation.win,
        expected_multiplier: calculation.multiplier,
        items: bets.map(bet => ({
          match_id: String(bet.matchId || ""),
          side: bet.side || "",
          odds: safeFloat(bet.odds),
          hdp: String(bet.hdp || "0"),
          team_name: bet.teamName, // ส่งชื่อทีมไปด้วยเพื่อ Log
          league_name: bet.league
        }))
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
        await showBetAlert('success', 'วางเดิมพันสำเร็จ!', `รหัสบิล #${result.ticket_id || 'UNKNOWN'}`);
        setStake(""); 
        onClear();    
        setIsOpen(false); 
      } else {
        showBetAlert('error', 'ผิดพลาด', result.error || "ไม่สามารถทำรายการได้");
      }
    } catch (error) {
      showBetAlert('error', 'Connection Error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-5">
        
        {/* Header: Mixplay Style */}
        <div className="p-6 border-b flex justify-between items-center bg-purple-50">
          <div className="flex items-center gap-2">
            <Layers className="text-purple-600" size={24} />
            <div>
              <h3 className="font-black italic uppercase text-purple-900 tracking-tighter text-lg">
                Mix Parlay
              </h3>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                Step {bets.length} Teams
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600" /></button>
        </div>

        {/* List of Bets */}
        <div className="p-6 max-h-[40vh] overflow-y-auto space-y-3 bg-slate-50/50">
          {bets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm font-medium">ยังไม่มีรายการที่เลือก</div>
          ) : (
            bets.map((bet, index) => (
              <div key={bet.id} className="p-4 bg-white rounded-2xl border border-purple-100 shadow-sm relative group">
                <div className="absolute -left-1 top-4 w-1 h-8 bg-purple-500 rounded-r-full"></div>
                <button onClick={() => onRemove(bet.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={16}/>
                </button>
                
                {/* Step Counter */}
                <div className="absolute top-4 right-12 text-[10px] font-black text-purple-200 select-none">
                  #{index + 1}
                </div>

                <div className="text-[10px] font-bold text-purple-600 uppercase mb-1 truncate pr-8">{bet.league}</div>
                <div className="font-bold text-sm text-slate-800 pr-6">{bet.homeName} <span className="text-slate-400">vs</span> {bet.awayName}</div>
                
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-lg uppercase">
                    {bet.type}
                  </span>
                  <div className="text-xs font-black text-emerald-600 italic">
                    {bet.teamName} <span className="text-slate-400 mx-1">@</span> {formatMyanmarDisplay(bet.hdp, bet.odds)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Stake & Calculation */}
        <div className="p-6 bg-white space-y-4 border-t shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          
          {/* Validation Warning */}
          {bets.length < minBets && (
            <div className="flex items-center gap-2 text-orange-500 text-xs font-bold bg-orange-50 p-2 rounded-lg">
              <AlertCircle size={14} />
              ต้องเลือกอย่างน้อย {minBets} คู่ ถึงจะแทงได้
            </div>
          )}

          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">THB</span>
            <input 
              type="number" value={stake} onChange={(e) => setStake(e.target.value)}
              placeholder="ใส่จำนวนเงิน..."
              className="w-full p-4 text-slate-700 bg-slate-100 rounded-xl font-bold text-xl outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex justify-between items-end px-2">
            <div className="flex flex-col">
               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">อัตราจ่ายรวม (x)</span>
               <span className="text-lg font-black text-purple-500">x{calculation.multiplier.toFixed(2)}</span>
            </div>
            <div className="flex flex-col items-end">
               <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">ยอดจ่ายสูงสุด</span>
               <span className="text-2xl font-black text-emerald-600">
                 {calculation.win.toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </span>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || bets.length < minBets || bets.length > maxBets}
            className={`w-full py-4 text-white rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-lg shadow-purple-200
              ${bets.length < minBets 
                ? "bg-slate-300 cursor-not-allowed text-slate-500" 
                : "bg-gradient-to-r from-purple-700 to-purple-500 hover:scale-[1.02] active:scale-95"
              }
            `}
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันโพยสเต็ป"}
          </button>
        </div>
      </div>
    </div>
  );
}