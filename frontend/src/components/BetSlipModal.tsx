"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";

interface Match {
  id: string | number;
  ID?: number;
  home_team: string;
  away_team: string;
  hdp: string;
  league_name?: string;
}

interface SelectedBet {
  match: Match;
  side: string;
  type: string;
  team: string;
  odds: string | number;
  hdp: string;
}

interface BetSlipModalProps {
  selectedBet: SelectedBet;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

export default function BetSlipModal({ selectedBet, onClose, onConfirm }: BetSlipModalProps) {
  const [amount, setAmount] = useState<string>("50");
  const { balance } = useWallet();

  // ✅ แก้ไขสูตรคำนวณที่นี่
  const odds = parseFloat(String(selectedBet?.odds || "0"));
  const numAmount = parseFloat(amount || "0");
  
  // คำนวณแบบเปอร์เซ็นต์: Stake + (Stake * (Odds/100))
  const profit = numAmount * (odds / 100);
  const totalReturn = numAmount + profit;
  const potentialWin = totalReturn.toFixed(2);
  
  const isBalanceEnough = balance >= numAmount;
  const isMinAmount = numAmount >= 50;
  const canBet = isBalanceEnough && isMinAmount;

  const quickBets = [50, 100, 500, 1000];

  const handleConfirm = () => {
    if (!isMinAmount) {
      alert("เดิมพันขั้นต่ำ 50 บาท");
      return;
    }
    if (!isBalanceEnough) {
      alert("ยอดเงินของคุณไม่เพียงพอ");
      return;
    }
    onConfirm(numAmount);
  };

  return (
    <div className="fixed inset-0 bg-[#020617]/90 flex items-end sm:items-center justify-center z-[100] backdrop-blur-md px-0 sm:px-4">
      <div className="absolute inset-0 cursor-pointer hidden sm:block" onClick={onClose} />

      <div className="bg-[#0f172a] w-full sm:max-w-md p-6 sm:p-8 
                      rounded-t-[2.5rem] sm:rounded-[2.5rem] 
                      border-t sm:border border-slate-800 relative 
                      max-h-[95vh] overflow-y-auto shadow-2xl transition-all">
        
        <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white italic uppercase tracking-tighter leading-none">Confirm Bet</h3>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 truncate max-w-[150px] sm:max-w-xs">
              {selectedBet?.match?.league_name || 'Football Match'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Your Balance</p>
            <p className={`text-sm sm:text-base font-bold ${balance < 50 ? 'text-red-500' : 'text-green-400'}`}>
              ฿{balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-[#1e293b]/50 border border-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl mb-6">
          <div className="flex justify-between items-center text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-3 gap-2">
             <span className="truncate flex-1">{selectedBet?.match?.home_team}</span>
             <span className="text-yellow-500/30 italic flex-shrink-0 text-center">VS</span>
             <span className="truncate flex-1 text-right">{selectedBet?.match?.away_team}</span>
          </div>
          <div className="flex justify-between items-end border-t border-slate-800/50 pt-4">
            <div className="flex-1">
              <p className="text-lg sm:text-xl font-black text-white leading-tight truncate">{selectedBet?.team}</p>
              <span className="text-[8px] sm:text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-black uppercase inline-block mt-1">
                {selectedBet?.type} {selectedBet?.hdp !== "0" ? `(${selectedBet?.hdp})` : ''}
              </span>
            </div>
            {/* แสดงค่าน้ำแบบมี @ นำหน้า */}
            <p className="text-2xl sm:text-3xl font-black text-green-400 font-mono italic leading-none ml-2">@{selectedBet?.odds}</p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">Stake Amount (Min 50)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">฿</span>
              <input
                type="number"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full bg-[#020617] border ${!isBalanceEnough ? 'border-red-500' : 'border-slate-800'} rounded-xl sm:rounded-2xl py-4 sm:py-5 pl-12 pr-4 text-xl sm:text-2xl font-black text-white outline-none focus:border-yellow-500 transition-all`}
                placeholder="0.00"
              />
            </div>
            {!isBalanceEnough && (
              <p className="text-red-500 text-[10px] mt-2 font-bold animate-pulse">⚠️ ยอดเงินไม่พอ (Insufficient Balance)</p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {quickBets.map(val => (
              <button 
                key={val}
                onClick={() => setAmount(val.toString())}
                className="bg-slate-800/50 hover:bg-slate-700 text-[10px] font-black text-slate-300 py-3 rounded-xl transition-all border border-slate-800 active:bg-slate-600"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center px-4 bg-slate-900/50 py-3 rounded-2xl border border-slate-800/50">
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">Est. Return:</span>
            {/* ✅ ใช้ค่าที่คำนวณใหม่ และจัดรูปแบบตัวเลขให้มีคอมม่า */}
            <span className="text-xl sm:text-2xl font-black text-yellow-500 italic">
              ฿{Number(potentialWin).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            disabled={!canBet}
            className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-[1.5rem] text-base sm:text-lg font-black uppercase tracking-tighter italic transition-all active:scale-[0.98]
              ${canBet 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-black shadow-lg shadow-green-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            {!isMinAmount ? 'Min. Bet ฿50' : !isBalanceEnough ? 'Insufficient Balance' : 'Confirm Bet Now'}
          </button>
        </div>

        <button 
          onClick={onClose} 
          className="w-full text-slate-500 text-[10px] font-black uppercase py-4 sm:py-2 hover:text-slate-300 transition-colors"
        >
          Cancel & Back
        </button>
      </div>
    </div>
  );
}