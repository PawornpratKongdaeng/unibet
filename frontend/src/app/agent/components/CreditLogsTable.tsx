// components/CreditLogsTable.tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Clock, ArrowUpRight, ArrowDownLeft, Filter } from "lucide-react";

export default function CreditLogsTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await apiFetch("/agent/credit-logs");
      if (res.ok) setLogs(await res.json());
      setLoading(false);
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in duration-700">
      <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Clock className="text-zinc-600" size={20} />
          <h3 className="text-sm font-black text-zinc-400 uppercase tracking-[0.3em] italic">Transaction Logs</h3>
        </div>
        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
          Showing Last 50 Items
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/30 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-8 py-6">Timestamp</th>
              <th className="px-6 py-6">Target Member</th>
              <th className="px-6 py-6">Action</th>
              <th className="px-6 py-6">Amount</th>
              <th className="px-8 py-6 text-right">Balance After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center text-zinc-700 font-black uppercase text-[10px] tracking-[0.5em]">Syncing Transactions...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-zinc-800 italic font-bold">No transactions found</td></tr>
            ) : logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                <td className="px-8 py-6 text-[11px] text-zinc-500 font-mono italic">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-6">
                   <div className="flex flex-col">
                      <span className="text-white font-black italic tracking-tighter uppercase">{log.to_username}</span>
                      <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">UID: #{log.to_user_id}</span>
                   </div>
                </td>
                <td className="px-6 py-6">
                  <div className={`flex items-center gap-2 font-black italic text-[9px] uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border w-fit ${
                    log.type === 'deposit' 
                    ? 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10' 
                    : 'text-rose-500 bg-rose-500/5 border-rose-500/10'
                  }`}>
                    {log.type === 'deposit' ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                    {log.type === 'deposit' ? 'In' : 'Out'}
                  </div>
                </td>
                <td className={`px-6 py-6 font-black italic text-lg tracking-tighter ${
                  log.type === 'deposit' ? 'text-emerald-400' : 'text-rose-500'
                }`}>
                  {log.type === 'deposit' ? '+' : '-'}{log.amount.toLocaleString()}
                </td>
                <td className="px-8 py-6 text-right font-mono text-zinc-500 text-sm">
                  {log.after_balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}