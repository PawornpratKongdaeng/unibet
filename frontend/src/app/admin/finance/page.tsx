"use client";
import React, { cloneElement } from "react"; // เพิ่ม React เข้ามา
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  TrendingUp, ArrowDownCircle, ArrowUpCircle, 
  RefreshCcw, FileCheck, 
  Image as ImageIcon, User as UserIcon, Copy, XCircle
} from "lucide-react";

// --- Configuration ---
const IMAGE_BASE_URL = "http://localhost:8000"; 
const fetcher = (url: string) => apiFetch(url).then(res => res.json());

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: '#0f172a',
  color: '#fff'
});

export default function FinanceStats() {
  const { data: financeData } = useSWR("/admin/finance/summary", fetcher);
  const { data: pending, mutate: mutatePending } = useSWR("/admin/transactions/pending", fetcher, { refreshInterval: 5000 });
  const { data: history, mutate: mutateHistory } = useSWR("/admin/transactions/history", fetcher);

  const pendingDeposits = pending?.filter((tx: any) => tx.type === "deposit") || [];
  const pendingWithdrawals = pending?.filter((tx: any) => tx.type === "withdraw") || [];

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    Toast.fire({ icon: 'success', title: 'Copied to clipboard' });
  };

  const viewSlip = (path: string) => {
    if (!path) return Swal.fire({ icon: 'error', title: 'SLIP NOT FOUND' });
    const imageUrl = path.startsWith('http') ? path : `${IMAGE_BASE_URL}${path}`;

    Swal.fire({
      title: `<p class="text-sm font-black uppercase text-slate-400">Slip Verification</p>`,
      imageUrl: imageUrl,
      imageWidth: 400,
      confirmButtonText: 'CLOSE',
      confirmButtonColor: '#0f172a',
      customClass: { popup: 'rounded-[2.5rem]', image: 'rounded-2xl border' }
    });
  };

  const handleAction = async (tx: any, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: isApprove ? 'CONFIRM PAYOUT?' : 'REJECT REQUEST?',
      html: `
        <div class="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4 space-y-4">
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-slate-400 uppercase">Amount</span>
            <span class="text-2xl font-[1000] text-slate-900 italic">฿${tx.amount.toLocaleString()}</span>
          </div>
          ${tx.type === 'withdraw' ? `
            <div class="bg-white p-4 rounded-2xl border border-slate-200 space-y-1">
              <p class="text-[10px] font-black text-emerald-600 uppercase">Transfer To</p>
              <p class="text-sm font-black text-slate-800">${tx.bank_name || 'N/A'}</p>
              <p class="text-md font-mono font-bold text-slate-900">${tx.account_number || '000-000-000'}</p>
            </div>
          ` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: isApprove ? 'YES, MARK PAID' : 'YES, REJECT',
      confirmButtonColor: isApprove ? '#10b981' : '#f43f5e',
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          Toast.fire({ icon: 'success', title: 'Transaction Updated' });
          mutatePending(); mutateHistory();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'System Error' });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 bg-slate-50/50 p-6 rounded-[3rem]">
      {/* Header */}
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-4xl font-[1000] italic text-slate-900 uppercase tracking-tighter">
            Money <span className="text-emerald-600">Ops</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Financial Management System</p>
        </div>
        <button onClick={() => { mutatePending(); mutateHistory(); }} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:text-emerald-600 active:scale-90 transition-all">
          <RefreshCcw size={20} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard title="Total Deposit" value={financeData?.total_deposit || 0} icon={<ArrowDownCircle />} variant="emerald" />
        <FinanceCard title="Total Withdraw" value={financeData?.total_withdraw || 0} icon={<ArrowUpCircle />} variant="rose" />
        <FinanceCard title="Net Balance" value={(financeData?.total_deposit || 0) - (financeData?.total_withdraw || 0)} icon={<TrendingUp />} variant="highlight" />
      </div>

      <div className="grid grid-cols-1 gap-10">
        <div className="space-y-4">
          <SectionHeader title="Pending Withdraw Requests" count={pendingWithdrawals.length} color="text-rose-500" />
          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5 text-left">User</th>
                    <th className="px-8 py-5 text-left">Destination (Bank Info)</th>
                    <th className="px-8 py-5 text-left">Amount</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pendingWithdrawals.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400"><UserIcon size={18}/></div>
                          <div>
                            <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username}</p>
                            <p className="text-[9px] text-slate-400 font-bold">TXID: #{tx.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">{tx.bank_name || 'N/A'}</span>
                          <div className="flex items-center gap-2 group/copy">
                            <p className="text-sm font-black text-slate-800 font-mono tracking-wider">{tx.account_number || '000-000-000'}</p>
                            <button onClick={() => copyToClipboard(tx.account_number)} className="opacity-0 group-hover/copy:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition-all">
                              <Copy size={14} />
                            </button>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 italic uppercase">{tx.account_name || 'No Name'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-rose-500 font-[1000] text-2xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAction(tx, 'reject')} className="p-3 text-slate-300 hover:text-rose-500 transition-colors"><XCircle size={20}/></button>
                          <button onClick={() => handleAction(tx, 'approve')} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200">
                            Mark Paid
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pendingWithdrawals.length === 0 && <EmptyState />}
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader title="Pending Deposits" count={pendingDeposits.length} color="text-emerald-600" />
          <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5 text-left">User</th>
                  <th className="px-8 py-5 text-left">Amount</th>
                  <th className="px-8 py-5 text-right">Slip & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingDeposits.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                       <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username}</p>
                       <p className="text-[9px] text-slate-400 font-bold">TXID: #{tx.id}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-emerald-600 font-[1000] text-2xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 flex justify-end items-center gap-4">
                      <button onClick={() => viewSlip(tx.slip_url)} className="w-12 h-12 rounded-xl border-2 border-slate-100 overflow-hidden hover:border-emerald-500 transition-all flex items-center justify-center bg-slate-50">
                        {tx.slip_url ? <img src={tx.slip_url.startsWith('http') ? tx.slip_url : `${IMAGE_BASE_URL}${tx.slip_url}`} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-slate-300" />}
                      </button>
                      <button onClick={() => handleAction(tx, 'approve')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingDeposits.length === 0 && <EmptyState />}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components with Typed Props ---

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
        <FileCheck className="text-slate-300" size={24} />
      </div>
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Everything is processed</p>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  count: number;
  color: string;
}

function SectionHeader({ title, count, color }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <h3 className={`text-sm font-[1000] uppercase ${color} italic tracking-wider flex items-center gap-3`}>
        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
        {title}
      </h3>
      <span className="bg-white text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black border border-slate-100 shadow-sm">{count} Requests</span>
    </div>
  );
}

interface FinanceCardProps {
  title: string;
  value: number;
  icon: React.ReactElement;
  variant: 'emerald' | 'rose' | 'highlight';
}

function FinanceCard({ title, value, icon, variant }: FinanceCardProps) {
  const styles: Record<string, any> = {
    emerald: { bg: "bg-white", textCol: "text-emerald-600", iconBg: "bg-emerald-50", iconCol: "text-emerald-600" },
    rose: { bg: "bg-white", textCol: "text-rose-500", iconBg: "bg-rose-50", iconCol: "text-rose-500" },
    highlight: { bg: "bg-emerald-600", textCol: "text-white", iconBg: "bg-white/20", iconCol: "text-white" }
  };
  const s = styles[variant];

  return (
    <div className={`p-8 rounded-[2.5rem] border border-slate-100 ${s.bg} shadow-sm group relative overflow-hidden transition-all duration-500 hover:shadow-xl`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${s.iconBg} ${s.iconCol}`}>
        {/* แก้ไขจุดนี้: ใช้การ Cast type เป็น any เพื่อข้ามการเช็คเฉพาะจุดของ cloneElement */}
        {cloneElement(icon, { size: 28, strokeWidth: 2.5 } as any)}
      </div>
      <p className={`${variant === 'highlight' ? 'text-emerald-100' : 'text-slate-400'} text-[10px] font-black uppercase tracking-widest mb-1`}>{title}</p>
      <h2 className={`text-5xl font-[1000] italic tracking-tighter ${s.textCol}`}>฿{value.toLocaleString()}</h2>
    </div>
  );
}