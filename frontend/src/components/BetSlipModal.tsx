"use client";
import React, { useState, useMemo } from 'react';
import { X, Trash2, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

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
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // --- 🛠 ฟังก์ชันถอดรหัสราคาพม่า (Myanmar Kyay Parser) ---
  const parseOdds = (oddsValue: any) => {
    const s = String(oddsValue);
    let price = 0;
    let isNegative = false;

    if (s.includes('+')) {
      price = parseFloat(s.split('+')[1]);
    } else if (s.includes('-')) {
      // ตรวจสอบว่าเป็นราคาติดลบ (เช่น -80) หรือแค่เครื่องหมายคั่น
      const parts = s.split('-');
      const val = parseFloat(parts[parts.length - 1]);
      price = val;
      isNegative = true;
    } else {
      price = parseFloat(s);
      if (price < 0) isNegative = true;
    }

    return { price: Math.abs(price), isNegative };
  };

  // --- 💰 Logic คำนวณเงิน ---
  const calculation = useMemo(() => {
    const amount = parseFloat(stake) || 0;
    if (bets.length === 0 || amount <= 0) return { totalMultiplier: 0, payout: 0, totalRisk: 0 };

    if (bets.length === 1) {
      // --- บอลเต็ง (Single Bet) ---
      const { price, isNegative } = parseOdds(bets[0].odds);
      
      if (isNegative) {
        // ราคาลบ (เสียไม่เต็ม): ได้ได้เต็ม / เสียเสียแค่ (price)%
        return {
          totalMultiplier: "1.00", 
          payout: amount + amount, // ชนะได้กำไร 1 เท่าของเงินต้น
          totalRisk: amount * (price / 100) // ยอดที่ใช้หักจริงถ้าแพ้
        };
      } else {
        // ราคาบวก: ได้กำไรตาม (price)% / เสียเสียเต็ม
        const profit = amount * (price / 100);
        return {
          totalMultiplier: (price / 100).toFixed(2),
          payout: amount + profit,
          totalRisk: amount
        };
      }
    } else {
      // --- บอลชุด (Mixplay) ---
      // โดยทั่วไปบอลชุดพม่าจะคิดราคาทบแบบบวก (1 + price/100)
      let multiplier = 1;
      bets.forEach(bet => {
        const { price, isNegative } = parseOdds(bet.odds);
        // ในบอลชุด ถ้ามีราคาลบ มักจะคิดเป็นการได้เต็ม (1.0)
        const itemMultiplier = isNegative ? 1 : (price / 100);
        multiplier *= (1 + itemMultiplier);
      });

      return {
        totalMultiplier: multiplier.toFixed(2),
        payout: amount * multiplier,
        totalRisk: amount
      };
    }
  }, [stake, bets]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-[#011a13]/90 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-[1000] italic uppercase tracking-tighter text-[#013323]">
              {bets.length > 1 ? 'Mixplay Slip' : 'Single Bet Slip'}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{bets.length} คู่ที่เลือก</span>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        {/* รายการคู่บอล */}
        <div className="max-h-[35vh] overflow-y-auto p-6 space-y-4 bg-white">
          {bets.map((bet) => {
            const { isNegative } = parseOdds(bet.odds);
            return (
              <div key={bet.id} className="relative bg-[#f8fafc] p-4 rounded-3xl border border-slate-100">
                <button onClick={() => onRemove(bet.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
                <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">{bet.league}</div>
                <div className="font-bold text-sm text-slate-800 mb-2">{bet.homeName} vs {bet.awayName}</div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${isNegative ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {bet.side} {bet.hdp}
                  </span>
                  <span className={`font-mono font-bold ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
                    @{bet.odds} {isNegative && <span className="text-[9px] font-sans">(เสียไม่เต็ม)</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ฟอร์มการเงิน */}
        <div className="p-8 bg-white border-t border-slate-50 space-y-5">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-bold uppercase text-[11px] tracking-widest">ค่าน้ำรวม</span>
            <span className="text-2xl font-[1000] text-[#013323] italic">
              {bets.length > 1 ? calculation.totalMultiplier : `@${bets[0]?.odds}`}
            </span>
          </div>

          <div className="relative">
            <input 
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              placeholder="ใส่ยอดเดิมพัน..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-xl text-black text-slate-700 font-bold focus:border-emerald-500 focus:outline-none transition-all"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">THB</span>
          </div>

          {/* สรุปยอดเงิน */}
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase px-2">
              <span className="text-slate-400">กรณีเสีย (ยอดติดลบ)</span>
              <span className="text-red-500">-{Number(calculation.totalRisk).toLocaleString()} บาท</span>
            </div>
            
            <div className="bg-[#013323] text-white p-5 rounded-3xl shadow-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">ยอดเงินที่จะได้รับ</p>
                <p className="text-xs text-emerald-400 font-bold italic">รวมทุนแล้ว</p>
              </div>
              <span className="text-3xl font-[1000] tracking-tighter">
                {Number(calculation.payout).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ปุ่มส่งโพย */}
          <button 
            onClick={() => {
              setIsSubmitting(true);
              setTimeout(() => { setIsSubmitting(false); setStatus('success'); setTimeout(() => { onClear(); setStatus('idle'); setStake(""); }, 2000); }, 1500);
            }}
            disabled={isSubmitting || !stake || bets.length === 0}
            className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest transition-all ${
              status === 'success' ? 'bg-emerald-500' : 'bg-[#013323] hover:scale-[1.02] active:scale-95'
            } text-white disabled:opacity-30`}
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : status === 'success' ? (
              <div className="flex items-center gap-2"><CheckCircle2 size={20}/> สำเร็จ</div>
            ) : (
              'ยืนยันการเดิมพัน'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}