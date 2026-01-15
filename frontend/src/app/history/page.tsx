"use client";
import useSWR from "swr";
import Header from "@/components/Header"; 
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useMemo } from "react";
import { ArrowLeft, Clock, Layers, Info } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  const json = await res.json();
  return json.data; 
};

export default function HistoryPage() {
  const { data, isLoading } = useSWR("/user/bet-history", fetcher, {
    refreshInterval: 5000,
  });

  const allBets = useMemo(() => {
    if (!data) return [];
    
    // ดึงข้อมูลและใส่ type เพื่อแยกประเภท พร้อมแก้เรื่องชื่อตัวแปร amount
    const singles = (data.single || []).map((b: any) => ({ 
      ...b, 
      type: 'single',
      // ⚠️ แก้ไข: รับค่าจาก total_stake (ตาม Go Model) มาใส่ใน amount
      amount: b.total_stake || b.amount || 0 
    }));

    const parlays = (data.parlay || []).map((b: any) => ({ 
      ...b, 
      type: 'parlay',
      // เผื่อ Parlay ใช้ชื่อต่างกัน ก็ดักไว้ทั้งคู่
      amount: b.total_stake || b.amount || 0 ,
      items: b.items || b.parlay_items || b.ParlayItems || []
    }));
    
    return [...singles, ...parlays].sort((a, b) => {
      const dateA = new Date(a.created_at || a.CreatedAt).getTime();
      const dateB = new Date(b.created_at || b.CreatedAt).getTime();
      return dateB - dateA;
    });
  }, [data]);

  const totalStake = allBets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);
  const totalReturn = allBets.reduce((sum: number, b: any) => sum + (Number(b.payout) || 0), 0);

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
        {/* Header */}
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
             Back
          </Link>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-[#022c1e] border border-[#044630] p-6 rounded-[2rem] shadow-xl">
            <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mb-1">Total Stake</p>
            <p className="text-2xl sm:text-3xl font-[1000] italic tracking-tighter">฿{totalStake.toLocaleString()}</p>
          </div>
          <div className="bg-[#022c1e] border border-emerald-500/20 p-6 rounded-[2rem] shadow-xl">
            <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mb-1">Total Return</p>
            <p className={`text-2xl sm:text-3xl font-[1000] italic tracking-tighter ${totalReturn > 0 ? 'text-emerald-400' : 'text-white'}`}>
              ฿{totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Bets List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-[#022c1e] animate-pulse rounded-[2rem] border border-[#044630]" />)}
            </div>
          ) : allBets.length > 0 ? (
            allBets.map((bet: any) => (
              /* ✅ FIXED: Combined type and id for unique key */
              <div key={`${bet.type}-${bet.id}`} className="group bg-[#022c1e] rounded-[2.5rem] p-6 border border-[#044630] hover:border-emerald-500/40 transition-all shadow-2xl relative overflow-hidden">
                
                {/* Type Indicator */}
                <div className="absolute top-0 right-12">
                   <div className={`px-4 py-1 rounded-b-xl text-[8px] font-black uppercase tracking-widest ${bet.type === 'parlay' ? 'bg-orange-500 text-white' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {bet.type === 'parlay' ? 'Mixplay' : 'Single'}
                   </div>
                </div>

                <div className="flex justify-between items-start mb-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#013323] rounded-2xl flex items-center justify-center text-xl border border-[#044630]">
                      {bet.type === 'parlay' ? <Layers className="text-emerald-500" size={20}/> : "⚽"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400/50 mb-0.5">
                         <Clock size={10} />
                         <p className="text-[9px] font-black uppercase tracking-widest">
                          {new Date(bet.created_at || bet.CreatedAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </p>
                      </div>
                      <h3 className="font-[1000] text-lg sm:text-xl italic tracking-tighter uppercase leading-none">
                        {bet.type === 'parlay' 
                          ? `${bet.items?.length || 0} Matches Parlay` 
                          : `${bet.home_team} VS ${bet.away_team}`}
                      </h3>
                    </div>
                  </div>
                  {getStatusBadge(bet.status)}
                </div>

                {/* Ticket Detail */}
                <div className="bg-[#013323]/60 rounded-[1.5rem] p-5 border border-[#044630]">
                  {bet.type === 'parlay' ? (
                    <div className="space-y-2 mb-4">
                      {bet.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[10px] border-b border-white/5 pb-1">
                          <span className="text-white/60">{item.home_team} vs {item.away_team}</span>
                          <span className="text-emerald-400 font-bold">{item.side?.toUpperCase() || item.pick?.toUpperCase()} @{item.odds}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mb-3">
                       <span className="font-[1000] text-sm italic uppercase text-emerald-400">
                        {bet.pick === 'home' ? bet.home_team : (bet.pick === 'away' ? bet.away_team : bet.pick)}
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[10px] font-black">
                        HDP {bet.hdp}
                      </span>
                      <span className="text-white/40 font-black text-xs">@ {bet.odds}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <div>
                       <p className="text-[8px] text-white/30 font-black uppercase">Stake</p>
                       <p className="font-bold text-sm italic">฿{(bet.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[8px] text-white/30 font-black uppercase">Possible Return</p>
                       <p className={`font-[1000] text-lg italic ${(bet.payout || 0) > 0 ? 'text-emerald-400' : 'text-white'}`}>
                         ฿{(bet.payout || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                       </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 bg-[#022c1e] rounded-[3rem] border-2 border-dashed border-[#044630]">
                <Info className="text-emerald-500/20 mx-auto mb-4" size={40} />
                <p className="text-emerald-400/40 font-[1000] italic uppercase text-xs">No records found</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}