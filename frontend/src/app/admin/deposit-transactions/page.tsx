"use client";
import React from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Calendar, Search, User as UserIcon, CheckCircle2, XCircle, ImageIcon } from "lucide-react";
import { EmptyState, viewSlip } from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function DepositHistory() {
  const { data: history } = useSWR("/admin/transactions/history", fetcher);
  const list = history?.filter((tx: any) => tx.type === "deposit") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-4xl font-[1000] italic text-slate-900 uppercase tracking-tighter">
            Deposit <span className="text-emerald-600">History</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">ประวัติการตรวจสอบสลิปย้อนหลัง</p>
        </div>
        <div className="bg-white px-5 py-3 rounded-2xl border border-slate-100 flex items-center gap-3 shadow-sm">
          <Search size={16} className="text-slate-300" />
          <input type="text" placeholder="Search by TXID or User..." className="bg-transparent border-none focus:ring-0 text-[10px] font-black text-slate-600 uppercase w-48 tracking-widest" />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-6 text-center w-20">Slip</th>
                <th className="px-8 py-6">Date & Time</th>
                <th className="px-8 py-6">Customer / ID</th>
                <th className="px-8 py-6 text-center">Amount</th>
                <th className="px-8 py-6 text-right">Verification Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <button onClick={() => viewSlip(tx.slip_url)} className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-300 hover:text-emerald-500">
                        <ImageIcon size={16} />
                    </button>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-xs font-black text-slate-600 italic tracking-tighter">{new Date(tx.created_at).toLocaleDateString()}</p>
                     <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleTimeString()}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-slate-900 font-black tracking-tight italic">@{tx.User?.username || 'System'}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">REF: #{tx.id}</p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-[1000] text-xl italic text-emerald-600">฿{tx.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className={`flex items-center justify-end gap-2 font-black text-[10px] uppercase tracking-tighter ${tx.status === 'approved' ? 'text-emerald-500' : 'text-rose-400'}`}>
                      {tx.status === 'approved' ? (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          Verified
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                          Rejected
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}