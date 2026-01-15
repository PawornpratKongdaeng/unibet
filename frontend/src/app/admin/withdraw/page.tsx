"use client";
import React from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { ArrowUpCircle, RefreshCcw, Landmark, User as UserIcon, Copy, XCircle } from "lucide-react";
import { FinanceCard, EmptyState, Toast } from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function WithdrawManagement() {
  const { data: pending, mutate } = useSWR("/admin/transactions/pending", fetcher);
  const list = pending?.filter((tx: any) => tx.type === "withdraw") || [];

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    Toast.fire({ icon: 'success', title: 'คัดลอกเลขบัญชีแล้ว' });
  };

  const handleAction = async (tx: any, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: isApprove ? 'ยืนยันการโอนเงิน?' : 'ปฏิเสธการถอน?',
      html: `กรุณาโอนเงินจำนวน <b class="text-rose-500 text-xl">฿${tx.amount.toLocaleString()}</b><br>ไปยัง ${tx.bank_name} ${tx.account_number}`,
      icon: isApprove ? 'info' : 'warning',
      showCancelButton: true,
      confirmButtonColor: isApprove ? '#0f172a' : '#f43f5e',
      confirmButtonText: isApprove ? 'โอนเงินแล้ว' : 'ปฏิเสธ'
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/transactions/${action}/${tx.id}`, { method: 'POST' });
      if (res.ok) {
        Toast.fire({ icon: 'success', title: 'อัปเดตสถานะสำเร็จ' });
        mutate();
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-[1000] italic text-slate-900 uppercase tracking-tighter">
            Withdraw <span className="text-rose-500">Queue</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">รายการลูกค้าแจ้งถอนเงิน</p>
        </div>
        <button onClick={() => mutate()} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:text-rose-500 active:scale-95 transition-all">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceCard title="Pending Withdraw" value={list.reduce((acc:any, curr:any) => acc + curr.amount, 0)} icon={<ArrowUpCircle />} variant="rose" />
        <FinanceCard title="Waiting List" value={list.length} icon={<Landmark />} variant="highlight" unit="รายการ" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-5">Customer Info</th>
                <th className="px-8 py-5">Destination Account</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase">TXID: #{tx.id}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded uppercase">{tx.bank_name}</span>
                      <button onClick={() => copy(tx.account_number)} className="text-slate-300 hover:text-emerald-500"><Copy size={12}/></button>
                    </div>
                    <p className="text-sm font-black text-slate-800 font-mono">{tx.account_number}</p>
                    <p className="text-[10px] font-bold text-slate-400 italic">{tx.account_name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-rose-500 font-[1000] text-2xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleAction(tx, 'reject')} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={24}/></button>
                      <button onClick={() => handleAction(tx, 'approve')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200">
                        ยืนยันการโอน
                      </button>
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