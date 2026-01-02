"use client";
import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { X, Wallet, ShieldCheck, ChevronRight, AlertTriangle } from "lucide-react";

interface BetSlipModalProps {
  selectedBet: {
    team: string;
    odds: string | number;
    type: string;
    hdp: string;
    side: string;
    match: any;
  };
  onClose: () => void;
  onConfirm: (amount: number) => void;
  minBet: number;
  maxBet: number;
}

export default function BetSlipModal({ selectedBet, onClose, onConfirm, minBet, maxBet }: BetSlipModalProps) {
  const [amount, setAmount] = useState<string>(minBet.toString());
  const { balance } = useWallet(); // ดึง balance ที่เป็น number มาใช้

  const numAmount = Number(amount) || 0;
  const odds = parseFloat(String(selectedBet.odds)) || 0;
  
  // คำนวณยอดที่จะได้รับ
  const potentialWin = (numAmount + (numAmount * (odds / 100))).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const isBalanceEnough = balance >= numAmount;
  const isValidRange = numAmount >= minBet && numAmount <= maxBet;
  const canBet = isBalanceEnough && isValidRange && numAmount > 0;

  const quickBets: number[] = [minBet, minBet * 2, 500, 1000];

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end sm:items-center justify-center z-[100] p-4">
      <div className="bg-[#09090b] w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Bet Slip</h3>
            <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={24}/></button>
          </div>

          {/* แสดงยอดเงินที่ใช้ toLocaleString ได้แล้ว */}
          <div className="flex justify-between p-5 bg-white/5 rounded-3xl border border-white/5">
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
               <Wallet size={12}/> Your Balance
            </div>
            <div className={`text-xl font-black italic ${balance < minBet ? 'text-rose-500' : 'text-emerald-400'}`}>
              ฿{balance.toLocaleString()}
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/10">
            <div className="flex justify-between text-2xl font-black text-white italic uppercase">
               <span>{selectedBet.team}</span>
               <span className="text-emerald-400">@{selectedBet.odds}</span>
            </div>
            <div className="text-[10px] font-black text-amber-500 uppercase">{selectedBet.type} {selectedBet.hdp}</div>
          </div>

          <div className="space-y-4">
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-900 border-2 border-white/5 rounded-2xl py-5 px-6 text-3xl font-black text-white outline-none focus:border-emerald-500 transition-all italic"
            />
            <div className="grid grid-cols-4 gap-2">
              {quickBets.map((val) => (
                <button 
                  key={val} 
                  type="button"
                  onClick={() => setAmount(val.toString())} 
                  className="bg-zinc-800 py-3 rounded-xl text-[10px] font-black text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all"
                >
                  {val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <button 
            disabled={!canBet}
            onClick={() => onConfirm(numAmount)}
            className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-widest italic transition-all ${canBet ? 'bg-white text-black hover:bg-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}
          >
            {balance < numAmount ? "Insufficient Balance" : "Confirm Bet"}
          </button>
        </div>
      </div>
    </div>
  );
}