"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function WinLossReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await apiFetch("/agent/report");
      const data = await res.json();
      setReportData(data.report || []);
    } catch (err) {
      console.error("Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  // รวมยอดทั้งหมดที่ท้ายตาราง
  const totals = reportData.reduce((acc: any, row: any) => ({
    turnover: acc.turnover + row.turnover,
    payout: acc.payout + row.payout,
    winLoss: acc.winLoss + row.win_loss,
  }), { turnover: 0, payout: 0, winLoss: 0 });

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black uppercase italic">Financial Report</h2>
          <p className="text-zinc-500 text-sm">รายงานผลแพ้-ชนะของสายงานทั้งหมด</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <p className="text-[10px] text-zinc-500 uppercase font-black">Net Profit</p>
          <p className={`text-2xl font-black ${totals.winLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            ฿{totals.winLoss.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-zinc-800">
            <tr className="text-[10px] text-zinc-400 uppercase tracking-widest">
              <th className="p-6">Username</th>
              <th className="p-6">Turnover (ยอดเล่น)</th>
              <th className="p-6">Payout (ยอดจ่าย)</th>
              <th className="p-6">Win/Loss (บริษัทได้/เสีย)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {reportData.map((row: any, index) => (
              <tr key={index} className="hover:bg-white/5 transition-all">
                <td className="p-6 font-bold">{row.username}</td>
                <td className="p-6 font-mono">฿{row.turnover.toLocaleString()}</td>
                <td className="p-6 font-mono text-zinc-400">฿{row.payout.toLocaleString()}</td>
                <td className={`p-6 font-mono font-bold ${row.win_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {row.win_loss >= 0 ? '+' : ''}{row.win_loss.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Total Footer */}
          <tfoot className="bg-zinc-900/80 font-black border-t border-zinc-700">
            <tr>
              <td className="p-6 uppercase">Total Summary</td>
              <td className="p-6 font-mono text-white">฿{totals.turnover.toLocaleString()}</td>
              <td className="p-6 font-mono text-zinc-400">฿{totals.payout.toLocaleString()}</td>
              <td className={`p-6 font-mono ${totals.winLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ฿{totals.winLoss.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}