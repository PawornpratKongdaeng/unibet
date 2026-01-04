"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, 
  History, Eye, RefreshCcw, Landmark, FileCheck
} from "lucide-react";
import { cloneElement } from "react";

const IMAGE_BASE_URL = "http://localhost:8080";
const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function FinanceStats() {
  const { data: financeData } = useSWR("/admin/finance/summary", fetcher);
  const { data: pending, mutate: mutatePending } = useSWR("/admin/transactions/pending", fetcher, { refreshInterval: 5000 });
  const { data: history, mutate: mutateHistory } = useSWR("/admin/transactions/history", fetcher);

  const pendingDeposits = pending?.filter((tx: any) => tx.type === "deposit") || [];
  const pendingWithdrawals = pending?.filter((tx: any) => tx.type === "withdraw") || [];

  const handleAction = async (id: number, action: 'approve' | 'reject', type: string, amount: number) => {
    const isApprove = action === 'approve';
    const result = await Swal.fire({
      title: isApprove ? 'CONFIRM TRANSACTION?' : 'REJECT TRANSACTION?',
      text: `${type.toUpperCase()} : ฿${amount.toLocaleString()}`,
      icon: isApprove ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'APPROVE' : 'REJECT',
      confirmButtonColor: isApprove ? '#10b981' : '#f43f5e',
      background: '#fff', 
      color: '#0f172a'
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'COMPLETED', timer: 1000, showConfirmButton: false });
          mutatePending();
          mutateHistory();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'SYSTEM ERROR' });
      }
    }
  };

  const viewSlip = (path: string) => {
    if (!path) return Swal.fire({ icon: 'error', title: 'SLIP NOT FOUND' });
    Swal.fire({
      imageUrl: `${IMAGE_BASE_URL}${path}`,
      imageAlt: 'Transfer Slip',
      background: '#fff',
      confirmButtonColor: '#10b981',
      confirmButtonText: 'CLOSE',
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10 bg-slate-50/50 p-4 rounded-3xl">
      
      {/* --- Header Section --- */}
      <div className="flex justify-between items-center px-2">
        <div>
            <div className="flex items-center gap-2 mb-1">
                <Landmark size={14} className="text-emerald-600" />
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Financial Control</p>
            </div>
            <h1 className="text-4xl font-black italic text-slate-900 uppercase tracking-tighter">
                Financial <span className="text-emerald-600">Operations</span>
            </h1>
        </div>
        <button onClick={() => { mutatePending(); mutateHistory(); }} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm group">
            <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
        </button>
      </div>

      {/* --- Finance Stats Cards (White & Clean) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard title="Total Deposit" value={financeData?.total_deposit || 0} icon={<ArrowDownCircle />} variant="emerald" />
        <FinanceCard title="Total Withdraw" value={financeData?.total_withdraw || 0} icon={<ArrowUpCircle />} variant="rose" />
        <FinanceCard title="Net Profit" value={(financeData?.total_deposit || 0) - (financeData?.total_withdraw || 0)} icon={<TrendingUp />} variant="highlight" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* --- Pending Deposits (White Card) --- */}
        <div className="space-y-4">
          <SectionHeader title="Awaiting Deposit" count={pendingDeposits.length} color="text-emerald-600" />
          <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">User Identity</th>
                  <th className="px-6 py-4 text-left">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingDeposits.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username}</p>
                      <p className="text-[9px] text-slate-400 font-medium">ID: {tx.id}</p>
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-black text-xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => viewSlip(tx.slip_url)} className="p-2.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Eye size={18}/></button>
                      <button onClick={() => handleAction(tx.id, 'approve', 'deposit', tx.amount)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pending Withdrawals (White Card) --- */}
        <div className="space-y-4">
          <SectionHeader title="Awaiting Payout" count={pendingWithdrawals.length} color="text-rose-500" />
          <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
             <table className="w-full">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4 text-left">User Identity</th>
                  <th className="px-6 py-4 text-left">Amount</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pendingWithdrawals.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-bold tracking-tight">@{tx.User?.username}</p>
                      <p className="text-[9px] text-slate-400 font-medium">ID: {tx.id}</p>
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-black text-xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 flex justify-end">
                      <button onClick={() => handleAction(tx.id, 'approve', 'withdraw', tx.amount)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-rose-500 transition-all">Transfered</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Global History (Full Width White Card) --- */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black uppercase italic text-slate-900 tracking-tighter">Transaction <span className="text-emerald-600">History</span></h3>
            <History className="text-slate-300" size={20} />
        </div>
        <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Timestamp</th>
                <th className="px-8 py-5">Identity</th>
                <th className="px-8 py-5">Operation</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {history?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-all group text-slate-600">
                  <td className="px-8 py-4">
                    <p className="font-bold text-slate-900">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-4 font-bold text-slate-500 italic">@{tx.User?.username}</td>
                  <td className="px-8 py-4">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                        {tx.type}
                      </span>
                  </td>
                  <td className={`px-8 py-4 text-xl font-black italic tracking-tighter ${tx.type === 'deposit' ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'} ฿{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={`text-[9px] font-bold uppercase px-4 py-1.5 rounded-full border ${
                      tx.status === 'approved' ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 
                      tx.status === 'rejected' ? 'border-rose-200 text-rose-500 bg-rose-50' : 'border-amber-200 text-amber-500 bg-amber-50'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, color }: any) {
    return (
        <div className="flex items-center justify-between px-2">
            <h3 className={`text-sm font-black uppercase ${color} flex items-center gap-2 tracking-wider`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {title}
            </h3>
            <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[9px] font-black uppercase">{count} Actions</span>
        </div>
    )
}

function FinanceCard({ title, value, icon, variant }: any) {
  const styles: any = {
    emerald: { bg: "bg-white", border: "border-slate-100", iconBg: "bg-emerald-50", iconCol: "text-emerald-600", textCol: "text-emerald-600" },
    rose: { bg: "bg-white", border: "border-slate-100", iconBg: "bg-rose-50", iconCol: "text-rose-500", textCol: "text-rose-500" },
    highlight: { bg: "bg-emerald-600", border: "border-emerald-500", iconBg: "bg-white/20", iconCol: "text-white", textCol: "text-white" }
  };

  const s = styles[variant];

  return (
    <div className={`p-7 rounded-[2.5rem] border ${s.border} ${s.bg} shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.iconBg} ${s.iconCol}`}>
            {cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 })}
        </div>
        {variant === 'highlight' && <FileCheck size={18} className="text-white/40" />}
      </div>
      <p className={`${variant === 'highlight' ? 'text-emerald-100' : 'text-slate-400'} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>{title}</p>
      <h2 className={`text-4xl font-black italic tracking-tighter ${s.textCol}`}>
        ฿{value.toLocaleString()}
      </h2>
    </div>
  );
}