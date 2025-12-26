"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/lib/sweetAlert";

export default function AllBetsReport() {
  const [bets, setBets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAllBets = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/admin/bets");
      if (res.ok) {
        const data = await res.json();
        setBets(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      showToast("error", "ไม่สามารถดึงข้อมูลรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAllBets(); }, []);

  // กรองข้อมูลตามชื่อผู้ใช้
  const filteredBets = bets.filter(bet => 
    bet.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // คำนวณยอดสรุป
  const summary = {
    turnover: filteredBets.reduce((acc, b) => acc + b.amount, 0),
    winLoss: filteredBets.reduce((acc, b) => acc + (b.win_loss_amount || 0), 0),
    pending: filteredBets.filter(b => b.status === 'pending').length
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">All Bets Report</h2>
          <p className="text-slate-500 text-sm">ตรวจสอบรายการเดิมพันทั้งหมดของทุกสายงาน</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text" 
            placeholder="ค้นหาชื่อผู้ใช้งาน..."
            className="bg-[#0f172a] border border-slate-800 rounded-2xl px-5 py-3 text-sm text-white w-full md:w-64 outline-none focus:border-red-500 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute right-4 top-3.5 opacity-30">🔍</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Turnover" value={`฿${summary.turnover.toLocaleString()}`} color="text-white" />
        <StatCard 
          title="Total Win/Loss (House)" 
          value={`฿${(summary.winLoss * -1).toLocaleString()}`} 
          color={summary.winLoss <= 0 ? "text-green-400" : "text-red-500"} 
          desc="ยอดรวมที่บริษัทได้/เสีย"
        />
        <StatCard title="Pending Bets" value={`${summary.pending} บิล`} color="text-yellow-500" />
      </div>

      {/* Bets Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-800">
                <th className="px-8 py-6">Bet Info</th>
                <th className="px-6 py-6">Username</th>
                <th className="px-6 py-6">Match / Details</th>
                <th className="px-6 py-6 text-center">Stake</th>
                <th className="px-6 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Profit/Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500 animate-pulse">กำลังโหลดข้อมูล...</td></tr>
              ) : filteredBets.length === 0 ? (
                <tr><td colSpan={6} className="py-20 text-center text-slate-500">ไม่พบข้อมูลการเดิมพัน</td></tr>
              ) : (
                filteredBets.map((bet) => (
                  <tr key={bet.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-5">
                      <p className="text-[10px] text-slate-500 font-mono">#{bet.id}</p>
                      <p className="text-[10px] text-slate-400">{new Date(bet.created_at).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-white">{bet.username}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-slate-200">{bet.match_name || "Football Match"}</p>
                      <p className="text-[10px] text-slate-500 uppercase">{bet.bet_type} @ {bet.odds}</p>
                    </td>
                    <td className="px-6 py-5 text-center font-mono font-bold">
                      {bet.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge status={bet.status} />
                    </td>
                    <td className={`px-8 py-5 text-right font-mono font-black ${bet.win_loss_amount > 0 ? "text-green-400" : bet.win_loss_amount < 0 ? "text-red-500" : "text-slate-400"}`}>
                      {bet.win_loss_amount > 0 ? "+" : ""}{bet.win_loss_amount?.toLocaleString() || "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatCard({ title, value, color, desc }: any) {
  return (
    <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[2rem] hover:border-red-500/30 transition-all">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className={`text-3xl font-black ${color} tracking-tighter`}>{value}</p>
      {desc && <p className="text-slate-600 text-[10px] mt-2 font-bold italic">{desc}</p>}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    win: "bg-green-500/10 text-green-500 border-green-500/20",
    lose: "bg-red-500/10 text-red-500 border-red-500/20",
    draw: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}