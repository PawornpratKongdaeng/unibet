"use client";
import useSWR from "swr";
import Header from "@/components/Header"; 
import Link from "next/link";
import { apiFetch } from "@/lib/api"; // ใช้ apiFetch ตัวเดิมที่เราทำไว้

// ✅ ปรับ Fetcher ให้แนบ Token อัตโนมัติ
const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

export default function HistoryPage() {
  // 1. ดึง data มาก่อน (อย่าเพิ่งเปลี่ยนชื่อเป็น bets ทันทีเพื่อกันสับสน)
const { data, isLoading, error } = useSWR("/bet/history", fetcher, {
  refreshInterval: 5000,
});

// 2. ตรวจสอบโครงสร้าง: ถ้า backend ส่ง { "data": [...] } ให้ใช้ data.data 
// แต่ถ้าส่ง [...] มาเลย ให้ใช้ data เฉพาะถ้ามันเป็น Array
const bets = Array.isArray(data) ? data : (data?.data || []);

// 3. คำนวณยอดรวม (ใส่เช็คเพื่อให้แน่ใจว่า bets เป็น array แน่นอน)
const totalStake = bets.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0);

const totalReturn = bets.reduce((sum: number, b: any) => {
  const isWin = ['win', 'won', 'win_half', 'won_half'].includes(b.status?.toLowerCase());
  return isWin ? sum + (Number(b.payout) || 0) : sum;
}, 0);

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase();
    if (['win', 'won', 'win_half', 'won_half'].includes(s)) 
      return <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg text-[10px] font-black border border-emerald-500/20">WINNER</span>;
    if (['lose', 'lost', 'lose_half', 'lost_half'].includes(s)) 
      return <span className="bg-rose-500/10 text-rose-500 px-2 py-1 rounded-lg text-[10px] font-black border border-rose-500/20">LOST</span>;
    if (s === 'draw') 
      return <span className="bg-slate-500/10 text-slate-400 px-2 py-1 rounded-lg text-[10px] font-black border border-slate-500/20">DRAW</span>;
    return <span className="bg-amber-500/10 text-amber-500 px-2 py-1 rounded-lg text-[10px] font-black border border-amber-500/20 animate-pulse">PENDING</span>;
  };

  return (
    <main className="min-h-screen bg-[#0f172a] text-slate-200 pb-20">
      <Header />

      <div className="max-w-xl mx-auto px-4 pt-8">
        {/* Header Section */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase">
              My <span className="text-yellow-500">History</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Betting Logs</p>
          </div>
          <Link href="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
            &larr; BACK TO LOBBY
          </Link>
        </div>

        {/* 📊 Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total Stake</p>
            <p className="text-xl font-mono font-black text-white">฿{totalStake.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-3xl">
            <p className="text-[10px] text-slate-500 font-black uppercase mb-1">Total Return</p>
            <p className={`text-xl font-mono font-black ${totalReturn >= totalStake ? 'text-emerald-400' : 'text-white'}`}>
              ฿{totalReturn.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Bets List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-800/50 animate-pulse rounded-3xl" />)}
            </div>
          ) : bets?.length > 0 ? (
            bets.map((bet: any) => (
              <div key={bet.id} className="bg-[#1e293b] rounded-3xl p-5 border border-slate-800 hover:border-slate-600 transition-all shadow-xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-800 rounded-2xl flex items-center justify-center text-xl">
                       ⚽
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {new Date(bet.created_at).toLocaleString('th-TH')}
                      </p>
                      <h3 className="font-black text-white uppercase italic">{bet.home_team} vs {bet.away_team}</h3>
                    </div>
                  </div>
                  {getStatusBadge(bet.status)}
                </div>

                <div className="bg-slate-900/50 rounded-2xl p-4 flex justify-between items-center border border-slate-800/50">
                  <div>
                    <p className="text-[9px] text-slate-500 font-black uppercase">Your Pick</p>
                    <p className="font-bold text-yellow-500">{bet.pick} <span className="text-white">@{bet.odds}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-black uppercase">Stake / Payout</p>
                    <p className="font-mono font-bold">
                      <span className="text-slate-400">฿{bet.amount}</span> 
                      <span className="mx-2">→</span>
                      <span className={bet.status === 'win' ? 'text-emerald-400' : 'text-white'}>
                        ฿{bet.payout?.toFixed(2)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-slate-800/20 rounded-[40px] border-2 border-dashed border-slate-800">
               <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No bets found</p>
               <Link href="/" className="mt-4 inline-block bg-yellow-500 text-black px-6 py-2 rounded-full font-black text-xs uppercase hover:bg-yellow-400 transition-all">
                  Start Betting
               </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}