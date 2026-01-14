"use client";
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Trash2, Trophy, X, Loader2 } from 'lucide-react';

interface MixParlayDrawerProps {
    selectedBets: any[];
    removeBet: (matchId: string) => void;
    clearAll: () => void;
    onConfirmSuccess: () => void;
}

export default function MixParlayDrawer({ selectedBets, removeBet, clearAll, onConfirmSuccess }: MixParlayDrawerProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [stake, setStake] = useState<string>("100");
    const [loading, setLoading] = useState(false);

    // ... (Logic คำนวณเงิน คงเดิม) ...
    const { totalOdds, potentialWin, isValid } = useMemo(() => {
        if (selectedBets.length < 2) return { totalOdds: 0, potentialWin: 0, isValid: false };
        let multiplier = 1;
        selectedBets.forEach(bet => {
            const rawPrice = Math.abs(parseFloat(bet.rawPrice || bet.oddsValue));
            const decimalVal = rawPrice > 5 ? (rawPrice / 100) : rawPrice;
            multiplier *= (1 + decimalVal);
        });
        const stakeNum = parseFloat(stake) || 0;
        return { totalOdds: multiplier, potentialWin: stakeNum * multiplier, isValid: true };
    }, [selectedBets, stake]);

    const handleConfirmParlay = async () => { 
        // ... (Logic Submit คงเดิม) ...
        setLoading(true);
        setTimeout(() => {
             setLoading(false);
             onConfirmSuccess();
             setIsExpanded(false);
        }, 1000);
    };

    if (selectedBets.length === 0) return null;

    return (
        <>
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity sm:bg-black/40"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div className={`
                fixed bottom-0 z-50 
                w-full left-0 
                sm:w-[400px] sm:left-auto sm:right-6 
                bg-[#013323] border-t-2 sm:border-2 border-emerald-500 
                shadow-[0_-5px_30px_rgba(0,0,0,0.8)] 
                transition-all duration-300 ease-out flex flex-col 
                rounded-t-2xl sm:rounded-t-xl
                
                ${/* ✅ FIX: ปรับความสูงตรงนี้ จาก h-[85vh] เหลือ h-[65vh] หรือ max-h-[65vh] เพื่อไม่ให้เต็มจอ */ ''}
                ${isExpanded ? 'h-[65vh] sm:h-[600px] sm:bottom-0' : 'h-auto sm:bottom-0'}
            `}>

                {/* 1. Header (ความสูงคงที่) */}
                <div
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex-none p-3 sm:p-4 cursor-pointer flex justify-between items-center bg-[#00281b] hover:bg-[#002217] transition-colors select-none rounded-t-xl border-b border-[#0c4a36]"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="bg-emerald-500 text-[#013323] w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                {selectedBets.length}
                            </div>
                            {selectedBets.length < 2 && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500/80">Mix Parlay</span>
                            <div className="text-sm font-bold text-white flex items-center gap-1">
                                {selectedBets.length < 2 ? 'Select 2+ Matches' : `${selectedBets.length} Fold`}
                                {isValid && <span className="text-amber-400 text-xs">(x{totalOdds.toFixed(2)})</span>}
                            </div>
                        </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#013323] border border-[#0c4a36] flex items-center justify-center text-emerald-500">
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </div>
                </div>

                {/* Content Area */}
                {isExpanded && (
                    <div className="flex-1 flex flex-col min-h-0 bg-[#013323]">

                        {/* Toolbar */}
                        <div className="flex-none flex justify-between items-center px-4 py-2 bg-[#001e14] border-b border-[#0c4a36]">
                            <span className="text-xs text-zinc-400 font-medium">Bet Slip List</span>
                            <button onClick={clearAll} className="text-[10px] text-red-400 flex items-center gap-1 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10">
                                <Trash2 size={12} /> Clear All
                            </button>
                        </div>

                        {/* Scrollable List */}
                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 custom-scrollbar min-h-0">
                            
                            {selectedBets.length < 2 && (
                                <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center gap-3 mb-2">
                                    <Trophy size={18} className="text-orange-500" />
                                    <span className="text-xs text-orange-200">Mix Parlay requires at least 2 matches.</span>
                                </div>
                            )}

                            {selectedBets.map((bet, idx) => (
                                <div key={bet.id || idx} className="relative p-3 bg-[#001e14] border border-[#0c4a36] rounded-xl flex flex-col gap-2 group hover:border-emerald-500/40 shrink-0">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="text-[10px] bg-emerald-900/50 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/10">#{idx + 1}</span>
                                            <span className="text-[10px] text-zinc-400 truncate max-w-[150px]">{bet.league}</span>
                                        </div>
                                        <button onClick={() => removeBet(bet.matchId)} className="text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded p-1">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <div className="text-xs font-black text-white uppercase leading-tight">
                                        {bet.homeName} <span className="text-emerald-600 px-1">vs</span> {bet.awayName}
                                    </div>
                                    <div className="flex justify-between items-center bg-[#013323] p-2 rounded-lg border border-[#0c4a36]">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">{bet.type === 'OU' ? 'Over/Under' : 'Handicap'}</span>
                                            <span className="text-xs font-bold text-emerald-400 truncate max-w-[120px]">{bet.teamName}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] text-zinc-500 font-bold uppercase">Odds</span>
                                            <span className="block text-sm font-black text-amber-400">@{bet.rawPrice}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer (Sticky Bottom) */}
                        <div className="flex-none p-4 bg-[#001e14] border-t border-[#0c4a36] pb-6 sm:pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-3">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-emerald-600 mb-1.5 block">Stake</label>
                                        <div className="relative group">
                                            <input
                                                type="number"
                                                value={stake}
                                                onChange={(e) => setStake(e.target.value)}
                                                className="w-full h-12 rounded-xl bg-[#013323] border border-[#0c4a36] text-white font-black text-lg px-3 pl-8 focus:border-emerald-500 focus:outline-none"
                                                placeholder="50"
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">฿</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black uppercase text-amber-600 mb-1.5 block">Max Win</label>
                                        <div className="w-full h-12 rounded-xl bg-[#013323]/50 border border-amber-500/20 flex items-center justify-end px-3">
                                            <span className="text-amber-400 font-black text-lg truncate">
                                                {potentialWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmParlay}
                                    disabled={!isValid || loading || parseFloat(stake) < 50}
                                    className="w-full h-14 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#013323] font-black uppercase text-sm tracking-widest shadow-lg flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : "Place Parlay Bet"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}