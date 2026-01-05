"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2'; // 1. นำเข้า SweetAlert2

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

  // 2. ตั้งค่าธีมสำหรับ SweetAlert2
  const showBetAlert = (icon: 'success' | 'error' | 'warning', title: string, text: string) => {
    return Swal.fire({
      icon,
      title,
      text,
      background: '#013323', // สีพื้นหลังเขียวเข้มตามธีม
      color: '#ffffff',
      confirmButtonColor: '#10b981', // สีปุ่ม Emerald
      confirmButtonText: 'ตกลง',
      customClass: {
        popup: 'rounded-[2rem]',
        title: 'font-black uppercase italic',
        confirmButton: 'rounded-xl font-bold px-8 py-2'
      }
    });
  };

  const formatHdpValue = (hdpStr: string): number => {
    const num = parseFloat(hdpStr.split(/[+-]/)[0]);
    return isNaN(num) ? 0 : num;
  };

  const formatOddsValue = (oddsStr: string): number => {
    const s = String(oddsStr);
    let val = 0;
    if (s.includes('+')) val = parseFloat(s.split('+')[1]);
    else if (s.includes('-')) val = parseFloat(s.split('-')[1]);
    else val = parseFloat(s);
    return val / 100;
  };

  const calculation = useMemo(() => {
    const amount = parseFloat(stake) || 0;
    if (bets.length === 0 || amount <= 0) return { payout: 0, totalOdds: 0 };

    let totalOdds = 1;
    bets.forEach(bet => {
      const odds = formatOddsValue(bet.odds);
      totalOdds *= (1 + odds);
    });

    return {
      payout: amount * totalOdds,
      totalOdds: totalOdds
    };
  }, [stake, bets]);

  const handleSubmit = async () => {
    const amount = Number(stake);
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      return showBetAlert('warning', 'ระบุจำนวนเงิน', 'กรุณาระบุจำนวนเงินเดิมพันให้ถูกต้อง');
    }
    if (bets.length === 0) {
      return showBetAlert('warning', 'เลือกคู่บอล', 'กรุณาเลือกคู่บอลก่อนทำการเดิมพัน');
    }

    const token = localStorage.getItem("token");
    if (!token) return showBetAlert('error', 'Session หมดอายุ', 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง');

    setIsSubmitting(true);
    
    try {
      const isSingle = bets.length === 1;
      
      const payload = {
        bet_type: isSingle ? "single" : "mixplay",
        total_stake: amount,
        total_payout: calculation.payout || 0,
        total_risk: amount,
        ...(isSingle && {
          match_id: String(bets[0].matchId || ""),
          home_team: bets[0].homeName || "",
          away_team: bets[0].awayName || "",
          pick: bets[0].side || "",
          odds: formatOddsValue(bets[0].odds || "0"),
          hdp: String(bets[0].hdp || "0"),
        }),
        ...(!isSingle && {
          items: bets.map(bet => ({
            match_id: String(bet.matchId || ""),
            home_team: bet.homeName || "",
            away_team: bet.awayName || "",
            side: bet.side || "",
            odds: formatOddsValue(bet.odds || "0"),
            hdp: String(bet.hdp || "0")
          }))
        })
      };

      const response = await fetch("http://localhost:8000/api/v3/user/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        // ✅ สำเร็จ
        await showBetAlert('success', 'วางเดิมพันสำเร็จ!', `ระบบรับรายการเดิมพันยอด ฿${amount.toLocaleString()} เรียบร้อยแล้ว`);
        setStake(""); // ล้างช่องใส่เงิน
        onClear();    // ล้างตะกร้า
        setIsOpen(false); // ปิด Modal
      } else {
        // ❌ ไม่สำเร็จ (เช่น เครดิตไม่พอ)
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
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-black italic uppercase text-emerald-900 tracking-tighter">
            {bets.length > 1 ? "Mixplay (Parlay)" : "Single Bet"}
          </h3>
          <button onClick={() => setIsOpen(false)}><X size={24} className="text-slate-400" /></button>
        </div>

        {/* Bet List */}
        <div className="p-6 max-h-[40vh] overflow-y-auto space-y-3">
          {bets.map((bet) => (
            <div key={bet.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 relative">
              <button onClick={() => onRemove(bet.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors">
                <Trash2 size={16}/>
              </button>
              <div className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{bet.league}</div>
              <div className="font-bold text-sm text-slate-800">{bet.homeName} vs {bet.awayName}</div>
              <div className="mt-2 text-xs font-black text-emerald-500">
                {bet.side.toUpperCase()} {bet.hdp} @{bet.odds}
              </div>
            </div>
          ))}
        </div>

        {/* Footer & Input */}
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
              {calculation.payout.toLocaleString(undefined, { maximumFractionDigits: 2 })}
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