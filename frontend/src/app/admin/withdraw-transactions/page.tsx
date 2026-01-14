"use client";
import React from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Calendar, Search, User as UserIcon, CheckCircle2, XCircle } from "lucide-react";
import { EmptyState } from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function TransactionHistory({ type = "withdraw" }: { type?: "deposit" | "withdraw" }) {
  const { data: history } = useSWR("/admin/transactions/history", fetcher);
  const list = history?.filter((tx: any) => tx.type === type) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-[1000] italic text-slate-900 uppercase tracking-tighter">
            {type} <span className="text-emerald-600">History</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">บันทึกประวัติย้อนหลังทั้งหมด</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3">
          <Search size={16} className="text-slate-300" />
          <input type="text" placeholder="Search by TXID or User..." className="bg-transparent border-none focus:ring-0 text-xs font-bold text-slate-600 uppercase" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
            <tr>
              <th className="px-8 py-5">Date / Time</th>
              <th className="px-8 py-5">TXID / User</th>
              <th className="px-8 py-5 text-center">Amount</th>
              <th className="px-8 py-5 text-center">Managed By</th>
              <th className="px-8 py-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-8 py-6">
                   <p className="text-xs font-black text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleTimeString()}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username || 'System'}</p>
                  <p className="text-[9px] text-slate-400 font-black">ID: #{tx.id}</p>
                </td>
                <td className="px-8 py-6 text-center">
                  <span className={`font-[1000] text-xl italic ${type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    ฿{tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                   <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{tx.from_agent || 'AUTO'}</span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className={`flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-tighter ${tx.status === 'approved' ? 'text-emerald-500' : 'text-rose-400'}`}>
                    {tx.status === 'approved' ? <><CheckCircle2 size={14}/> Completed</> : <><XCircle size={14}/> Rejected</>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}