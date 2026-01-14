"use client";
import React, { useState, useMemo } from 'react';
import { Trophy, X, Layers, Loader2, Coins } from 'lucide-react';

interface BetItem {
  matchId: string;
  homeName: string;
  awayName: string;
  teamName: string;
  type: string;
  oddsValue: number;
  hdp: string;
  league: string;
}

interface UniversalBetSlipProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBets: BetItem[];
  onRemove: (id: string) => void;
  onConfirm: (bets: BetItem[], stake: number, potentialWin: number) => void;
}

export default function UniversalBetSlip({ isOpen, onClose, selectedBets, onRemove, onConfirm }: UniversalBetSlipProps) {
  const [stake, setStake] = useState<string>("1000");
  const [loading, setLoading] = useState(false);

  const isSingleMode = selectedBets.length === 1;

  const { totalOdds, potentialWin } = useMemo(() => {
    if (selectedBets.length === 0) return { totalOdds: 0, potentialWin: 0 };
    const stakeNum = parseFloat(stake) || 0;
    
    let multiplier = 1;
    // ระบบพม่ามักใช้ Decimal Odds (คูณตรงๆ)
    selectedBets.forEach(bet => {
      multiplier *= bet.oddsValue;
    });

    return { 
      totalOdds: multiplier, 
      potentialWin: Math.floor(stakeNum * multiplier) 
    };
  }, [selectedBets, stake]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#1a1a1a] w-full max-w-[420px] max-h-[90vh] rounded-[2rem] shadow-[0_0_40px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
        
        {/* Header: Myanmar Premium Style */}
        <div className={`p-5 flex justify-between items-center text-white ${isSingleMode ? 'bg-gradient-to-r from-emerald-800 to-emerald-600' : 'bg-gradient-to-r from-amber-700 to-amber-500'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black/20 rounded-xl">
              {isSingleMode ? <Trophy size={20} className="text-yellow-400" /> : <Layers size={20} />}
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-tighter">
                {isSingleMode ? 'Single (မောင်)' : `Mix Parlay (${selectedBets.length} ပွဲ)`}
              </h3>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Myanmar System</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#121212]">
          {selectedBets.map((bet) => (
            <div key={bet.matchId} className="bg-[#1e1e1e] border border-white/5 p-4 rounded-2xl relative shadow-inner">
              <button onClick={() => onRemove(bet.matchId)} className="absolute top-3 right-3 text-white/20 hover:text-red-500 transition-colors">
                <X size={18} />
              </button>
              <div className="text-[10px] text-emerald-500 font-black mb-1 uppercase tracking-widest">{bet.league}</div>
              <div className="text-sm font-bold text-zinc-100 mb-3 uppercase pr-6">
                {bet.homeName} <span className="text-zinc-500 font-normal mx-1">VS</span> {bet.awayName}
              </div>
              <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
                <div>
                  <div className="text-[9px] text-zinc-500 font-black uppercase">{bet.type} {bet.hdp}</div>
                  <div className="font-black text-sm text-amber-500">{bet.teamName}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-zinc-500 font-black uppercase">Odds</div>
                  <div className="text-white font-black text-base italic">@{bet.oddsValue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Control Panel */}
        <div className="p-6 bg-[#1a1a1a] border-t border-white/10 space-y-4">
          <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-white/10">
              <div className="p-3">
                <span className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Total Odds</span>
                <span className="text-xl font-black text-white italic">x{totalOdds.toFixed(2)}</span>
              </div>
              <div className="p-3 bg-white/5">
                <span className="block text-[9px] font-black text-zinc-500 uppercase mb-1">Stake (လောင်းကြေး)</span>
                <input 
                  type="number" value={stake} onChange={(e) => setStake(e.target.value)}
                  className="w-full bg-transparent font-black text-xl text-emerald-500 outline-none"
                />
              </div>
            </div>
            <div className="bg-emerald-950/20 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-emerald-500/80">
                <Coins size={16} />
                <span className="text-[10px] font-black uppercase">Possible Win</span>
              </div>
              <span className="text-2xl font-black text-emerald-500 uppercase">
                {potentialWin.toLocaleString()}
              </span>
            </div>
          </div>

          <button 
            disabled={loading || !stake || parseFloat(stake) <= 0}
            onClick={() => {
              setLoading(true);
              setTimeout(() => {
                onConfirm(selectedBets, parseFloat(stake), potentialWin);
                setLoading(false);
              }, 1200);
            }}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 text-white rounded-2xl font-black text-base uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Confirm Bet (လောင်းမည်)'}
          </button>
        </div>
      </div>
    </div>
  );
}