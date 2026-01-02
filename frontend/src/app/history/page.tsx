"use client";
import useSWR from "swr";
import Header from "@/components/Header"; 
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  // รองรับทั้งแบบส่งมาเป็น array ตรงๆ หรือ { data: [] }
  return Array.isArray(json) ? json : json.data;
};

export default function HistoryPage() {
  const { data: bets = [], isLoading } = useSWR("/bet/history", fetcher, {
    refreshInterval: 5000,
  });

  // คำนวณยอดรวมทั้งหมด
  const totalStake = bets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
  const totalReturn = bets.reduce((sum: number, b: any) => sum + (Number(b.payout) || 0), 0);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (['win', 'won', 'win_half', 'won_half'].includes(s)) 
      return <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black border border-emerald-500/20">WINNER</span>;
    if (['lose', 'lost', 'lose_half', 'lost_half'].includes(s)) 
      return <span className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black border border-rose-500/20">LOST</span>;
    if (s === 'draw') 
      return <span className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black border border-slate-500/20">DRAW</span>;
    return <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-black border border-amber-500/20 animate-pulse">PENDING</span>;
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 pb-24">
      <Header />

      <div className="max-w-2xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter uppercase leading-none">
              MY <span className="text-yellow-500">HISTORY</span>
            </h1>
            <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">Betting Logs</p>
          </div>
          <Link href="/" className="text-[10px] font-black text-slate-500 hover:text-white transition-colors bg-slate-900 px-3 py-2 rounded-xl border border-slate-800">
              BACK TO LOBBY
          </Link>
        </div>

        {/* 📊 Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-inner">
            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Total Stake</p>
            <p className="text-lg sm:text-2xl font-mono font-black text-white">฿{totalStake.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl sm:rounded-3xl shadow-inner">
            <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Total Return</p>
            <p className={`text-lg sm:text-2xl font-mono font-black ${totalReturn > 0 ? 'text-emerald-400' : 'text-white'}`}>
              ฿{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Bets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-28 bg-slate-900/50 animate-pulse rounded-2xl border border-slate-800" />)}
            </div>
          ) : bets.length > 0 ? (
            bets.map((bet: any, index: number) => {
              const homeName = bet.Match?.home_team || bet.home_team || 'Unknown Home';
              const awayName = bet.Match?.away_team || bet.away_team || 'Unknown Away';
              
              return (
                <div key={bet.id || index} className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-800 hover:border-slate-700 transition-all shadow-xl">
                  
                  {/* Card Top: Date & Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-900 rounded-xl flex items-center justify-center text-base sm:text-lg border border-slate-800">
                          ⚽
                      </div>
                      <div>
                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold uppercase">
                          {bet.CreatedAt || bet.created_at ? new Date(bet.CreatedAt || bet.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                        </p>
                        <h3 className="font-black text-sm sm:text-base text-white uppercase italic leading-tight truncate max-w-[180px] sm:max-w-none">
                          {homeName} <span className="text-slate-600 text-[10px] mx-1">vs</span> {awayName}
                        </h3>
                      </div>
                    </div>
                    {getStatusBadge(bet.status)}
                  </div>

                  {/* Card Detail Area */}
                  <div className="bg-[#020617]/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-800/50">
                    <div className="flex justify-between items-center gap-4">
                      <div className="min-w-0">
                        <p className="text-[8px] sm:text-[9px] text-slate-600 font-black uppercase mb-0.5">Your Pick</p>
                        <p className="font-bold text-xs sm:text-sm text-yellow-500 truncate">
                          <span className="uppercase text-white mr-1">
                            {/* แสดงชื่อทีมที่เลือกแทนคำว่า home/away */}
                            {bet.pick === 'home' ? homeName : (bet.pick === 'away' ? awayName : bet.pick)}
                          </span>
                          <span className="text-emerald-400">
                            ({bet.hdp >= 0 ? `+${bet.hdp}` : bet.hdp})
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] sm:text-xs ml-1">@{bet.odds}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[8px] sm:text-[9px] text-slate-600 font-black uppercase mb-0.5">Stake / Payout</p>
                        <div className="font-mono font-bold text-xs sm:text-sm flex items-center justify-end gap-1.5">
                          <span className="text-slate-500">฿{bet.amount?.toLocaleString()}</span> 
                          <span className="text-slate-700">→</span>
                          <span className={bet.payout > 0 ? 'text-emerald-400' : 'text-white'}>
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
            <div className="text-center py-20 bg-slate-900/20 rounded-[2.5rem] border-2 border-dashed border-slate-800/50 mx-4">
                <div className="text-4xl mb-4 opacity-20">📝</div>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">No transaction history</p>
                <Link href="/" className="mt-5 inline-block bg-yellow-500 text-black px-8 py-2.5 rounded-full font-black text-[10px] uppercase hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10">
                  Start Betting
                </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}