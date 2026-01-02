// components/WinLossTable.tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Search, Calendar, TrendingUp, PieChart, DollarSign, Activity } from "lucide-react";

export default function WinLossTable({ agentId }: { agentId: any }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/agent/reports/winloss?start=${filter.start}&end=${filter.end}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const totals = data.reduce((acc, curr) => ({
    turnover: acc.turnover + (curr.turnover || 0),
    winLoss: acc.winLoss + (curr.win_loss || 0),
    settle: acc.settle + (curr.agent_share_amt || 0),
    com: acc.com + (curr.agent_com_amt || 0),
  }), { turnover: 0, winLoss: 0, settle: 0, com: 0 });

  return (
    <div className="space-y-8">
      {/* Date Filter Bar */}
      <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem] flex flex-wrap items-end gap-6 backdrop-blur-sm">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Period Start</label>
          <input 
            type="date" 
            className="bg-black border border-zinc-800 p-3 rounded-2xl text-sm text-white outline-none focus:border-white transition-all"
            value={filter.start}
            onChange={(e) => setFilter({...filter, start: e.target.value})}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Period End</label>
          <input 
            type="date" 
            className="bg-black border border-zinc-800 p-3 rounded-2xl text-sm text-white outline-none focus:border-white transition-all"
            value={filter.end}
            onChange={(e) => setFilter({...filter, end: e.target.value})}
          />
        </div>
        <button 
          onClick={fetchReport}
          className="bg-white hover:bg-zinc-200 text-black font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 italic uppercase text-xs tracking-tighter transition-all active:scale-95"
        >
          <Search size={16} /> Update Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStat title="Total Turnover" value={totals.turnover} icon={<Activity size={16}/>} color="text-zinc-400" />
        <MiniStat title="Member Win/Loss" value={totals.winLoss} icon={<PieChart size={16}/>} color={totals.winLoss >= 0 ? "text-emerald-400" : "text-rose-500"} />
        <MiniStat title="Your Settlement" value={totals.settle} icon={<DollarSign size={16}/>} color="text-yellow-500" />
        <MiniStat title="Total Commission" value={totals.com} icon={<TrendingUp size={16}/>} color="text-blue-400" />
      </div>

      {/* Table */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Member Identity</th>
                <th className="px-6 py-6">Turnover</th>
                <th className="px-6 py-6">Win/Loss</th>
                <th className="px-6 py-6 text-yellow-500">Settlement</th>
                <th className="px-8 py-6 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                <tr><td colSpan={5} className="py-20 text-center animate-pulse text-zinc-600 font-black uppercase text-xs">Generating Report...</td></tr>
              ) : data.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6 text-white font-black italic tracking-tighter">{row.username}</td>
                  <td className="px-6 py-6 font-mono text-zinc-500 text-sm">฿{row.turnover.toLocaleString()}</td>
                  <td className={`px-6 py-6 font-bold ${row.win_loss >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {row.win_loss.toLocaleString()}
                  </td>
                  <td className={`px-6 py-6 font-black text-lg italic tracking-tighter ${row.agent_share_amt >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {row.agent_share_amt.toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right text-blue-400 font-bold italic">฿{row.agent_com_amt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({ title, value, icon, color }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl">
      <div className="flex items-center gap-2 mb-2 opacity-50">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
      </div>
      <p className={`text-xl font-black italic tracking-tighter ${color}`}>฿{value.toLocaleString()}</p>
    </div>
  );
}