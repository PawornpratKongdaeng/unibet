"use client";
import useSWR from "swr";
import Header from "@/components/Header"; 
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Clock, Trophy, Info, ChevronRight, Filter } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return Array.isArray(json) ? json : json.data;
};

export default function HistoryPage() {
  const { data: bets = [], isLoading } = useSWR("/bet/history", fetcher, {
    refreshInterval: 5000,
  });

  const totalStake = bets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
  const totalReturn = bets.reduce((sum: number, b: any) => sum + (Number(b.payout) || 0), 0);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (['win', 'won', 'win_half', 'won_half'].includes(s)) 
      return <span className="bg-emerald-500 text-[#013323] px-3 py-1 rounded-lg text-[9px] font-[1000] italic uppercase shadow-lg shadow-emerald-500/20">WINNER</span>;
    if (['lose', 'lost', 'lose_half', 'lost_half'].includes(s)) 
      return <span className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[9px] font-[1000] italic uppercase shadow-lg shadow-rose-500/20">LOST</span>;
    if (s === 'draw') 
      return <span className="bg-slate-500 text-white px-3 py-1 rounded-lg text-[9px] font-[1000] italic uppercase">DRAW</span>;
    return <span className="bg-amber-500 text-black px-3 py-1 rounded-lg text-[9px] font-[1000] italic uppercase animate-pulse">PENDING</span>;
  };

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans selection:bg-emerald-500/30">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-8">
        
        {/* 🏆 Header: Sporty & Dynamic */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Activity Logs</p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-[1000] italic tracking-tighter uppercase leading-none">
              MY <span className="text-emerald-400">HISTORY</span>
            </h1>
          </div>
          <Link href="/" className="group flex items-center gap-2 bg-white text-[#013323] px-5 py-3 rounded-2xl font-[1000] text-[10px] uppercase italic transition-all hover:bg-emerald-400 active:scale-95 shadow-xl">
             <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
             Back to Lobby
          </Link>
        </div>

        {/* 💳 Summary Cards: Premium Emerald Style */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#022c1e] border border-[#044630] p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Filter size={40} />
            </div>
            <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mb-1">Total Stake</p>
            <p className="text-2xl sm:text-3xl font-[1000] italic tracking-tighter">฿{totalStake.toLocaleString()}</p>
          </div>
          <div className="bg-[#022c1e] border border-emerald-500/20 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Trophy size={40} />
            </div>
            <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mb-1">Total Return</p>
            <p className={`text-2xl sm:text-3xl font-[1000] italic tracking-tighter ${totalReturn > 0 ? 'text-emerald-400' : 'text-white'}`}>
              ฿{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* ⚽ Bets List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#022c1e] animate-pulse rounded-[2rem] border border-[#044630]" />)}
            </div>
          ) : bets.length > 0 ? (
            bets.map((bet: any, index: number) => {
              const homeName = bet.Match?.home_team || bet.home_team || 'Home Team';
              const awayName = bet.Match?.away_team || bet.away_team || 'Away Team';
              
              return (
                <div key={bet.id || index} className="group bg-[#022c1e] rounded-[2.5rem] p-6 border border-[#044630] hover:border-emerald-500/40 transition-all shadow-2xl relative overflow-hidden">
                  
                  {/* Card Header: Time & Status */}
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[#013323] rounded-2xl flex items-center justify-center text-xl border border-[#044630] shadow-inner group-hover:border-emerald-500/30 transition-colors">
                        ⚽
                      </div>
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400/50 mb-0.5">
                           <Clock size={10} />
                           <p className="text-[9px] font-black uppercase tracking-widest">
                            {bet.CreatedAt || bet.created_at ? new Date(bet.CreatedAt || bet.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                          </p>
                        </div>
                        <h3 className="font-[1000] text-lg sm:text-xl italic tracking-tighter uppercase leading-none">
                          {homeName} <span className="text-emerald-500/30 text-xs mx-1 not-italic">VS</span> {awayName}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(bet.status)}
                  </div>

                  {/* Ticket Detail Box */}
                  <div className="bg-[#013323]/60 rounded-[1.5rem] p-5 border border-[#044630] relative group-hover:bg-[#013323] transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <p className="text-[9px] text-emerald-400/40 font-black uppercase tracking-widest">Prediction & Odds</p>
                        <div className="flex items-center gap-2 flex-wrap">
                           <span className="font-[1000] text-sm sm:text-base italic tracking-tight uppercase">
                            {bet.pick === 'home' ? homeName : (bet.pick === 'away' ? awayName : bet.pick)}
                          </span>
                          <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-black border border-emerald-500/20">
                            HDP {bet.hdp >= 0 ? `+${bet.hdp}` : bet.hdp}
                          </span>
                          <span className="text-white/40 font-black text-xs">@ {bet.odds}</span>
                        </div>
                      </div>
                      
                      <div className="w-full sm:w-auto flex justify-between sm:block text-right border-t sm:border-t-0 border-[#044630] pt-3 sm:pt-0">
                        <p className="text-[9px] text-emerald-400/40 font-black uppercase tracking-widest sm:mb-1">Stake / Payout</p>
                        <div className="font-[1000] text-base sm:text-lg italic tracking-tighter flex items-center justify-end gap-3">
                          <span className="text-white/40">฿{bet.amount?.toLocaleString()}</span> 
                          <ChevronRight size={14} className="text-emerald-500/20" />
                          <span className={bet.payout > 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.3)]' : 'text-white'}>
                            ฿{bet.payout ? Number(bet.payout).toLocaleString(undefined, {minimumFractionDigits: 2}) : '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-24 bg-[#022c1e] rounded-[3rem] border-2 border-dashed border-[#044630] mx-4 shadow-2xl">
                <div className="w-20 h-20 bg-[#013323] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#044630]">
                   <Info className="text-emerald-500/20" size={40} />
                </div>
                <p className="text-emerald-400/40 font-[1000] italic uppercase tracking-[0.2em] text-xs">No transaction history found</p>
                <Link href="/" className="mt-8 inline-block bg-white text-[#013323] px-10 py-4 rounded-2xl font-[1000] text-[11px] uppercase italic hover:bg-emerald-400 transition-all shadow-xl active:scale-95">
                  Start New Bet
                </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}