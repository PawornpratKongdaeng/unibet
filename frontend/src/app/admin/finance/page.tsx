"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, 
  History, Eye, Check, X, ShieldAlert 
} from "lucide-react";

const IMAGE_BASE_URL = "http://localhost:8080";
const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function FinanceStats() {
  const { data: financeData } = useSWR("/admin/finance/summary", fetcher);
  const { data: pending, mutate: mutatePending } = useSWR("/admin/transactions/pending", fetcher);
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
      background: '#09090b', color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'COMMAND EXECUTED', timer: 1000, showConfirmButton: false, background: '#09090b', color: '#fff' });
          mutatePending();
          mutateHistory();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'SYSTEM ERROR', background: '#09090b', color: '#fff' });
      }
    }
  };

  const viewSlip = (path: string) => {
    if (!path) return Swal.fire({ icon: 'error', title: 'SLIP NOT FOUND', background: '#09090b', color: '#fff' });
    Swal.fire({
      imageUrl: `${IMAGE_BASE_URL}${path}`,
      imageAlt: 'Transfer Slip',
      background: '#09090b',
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'CLOSE TERMINAL',
      customClass: { image: 'rounded-3xl border border-white/5 shadow-2xl' }
    });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 1. Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard title="Total Deposit" value={financeData?.total_deposit || 0} icon={<ArrowDownCircle size={24}/>} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20" />
        <FinanceCard title="Total Withdraw" value={financeData?.total_withdraw || 0} icon={<ArrowUpCircle size={24}/>} color="text-rose-500" bg="bg-rose-500/5" border="border-rose-500/20" />
        <FinanceCard title="Net Profit" value={(financeData?.total_deposit || 0) - (financeData?.total_withdraw || 0)} icon={<TrendingUp size={24}/>} color="text-amber-400" bg="bg-amber-500/10" border="border-amber-400/30" isHighlight />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* 2. Pending Deposits */}
        <div className="space-y-6">
          <SectionHeader title="Pending Deposits" count={pendingDeposits.length} color="text-emerald-500" />
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5 text-left">User Identity</th>
                  <th className="px-6 py-5 text-left">Amount</th>
                  <th className="px-6 py-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {pendingDeposits.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-emerald-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-white font-black italic">@{tx.User?.username}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">ID: {tx.id}</p>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-black text-lg italic tracking-tighter">฿{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => viewSlip(tx.slip_url)} className="p-3 bg-zinc-900 text-zinc-400 rounded-xl hover:text-white transition-all"><Eye size={16}/></button>
                      <button onClick={() => handleAction(tx.id, 'approve', 'deposit', tx.amount)} className="px-5 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-emerald-500 hover:text-white transition-all">Approve</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Pending Withdrawals */}
        <div className="space-y-6">
          <SectionHeader title="Pending Withdrawals" count={pendingWithdrawals.length} color="text-rose-500" />
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
             <table className="w-full">
              <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-5 text-left">User Identity</th>
                  <th className="px-6 py-5 text-left">Amount</th>
                  <th className="px-6 py-5 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {pendingWithdrawals.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-rose-500/5 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-white font-black italic">@{tx.User?.username}</p>
                      <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter">ID: {tx.id}</p>
                    </td>
                    <td className="px-6 py-4 text-rose-500 font-black text-lg italic tracking-tighter">฿{tx.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <button onClick={() => handleAction(tx.id, 'approve', 'withdraw', tx.amount)} className="px-5 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Transfered</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Global Financial History */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Global <span className="text-zinc-600">History</span></h3>
            <History className="text-zinc-800" />
        </div>
        <div className="bg-zinc-950 border border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-zinc-900 text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Identity</th>
                <th className="px-8 py-6">Operation</th>
                <th className="px-8 py-6">Amount</th>
                <th className="px-8 py-6 text-right">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {history?.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-zinc-900/30 transition-all group">
                  <td className="px-8 py-5">
                    <p className="text-white font-bold">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5 text-zinc-400 font-bold italic">@{tx.User?.username}</td>
                  <td className="px-8 py-5">
                      <span className={`text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {tx.type}
                      </span>
                  </td>
                  <td className={`px-8 py-5 text-xl font-black italic tracking-tighter ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {tx.type === 'deposit' ? '+' : '-'} ฿{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-8 py-5 text-right">
                    <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${
                      tx.status === 'approved' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 
                      tx.status === 'rejected' ? 'border-rose-500/50 text-rose-500 bg-rose-500/5' : 'border-amber-500/50 text-amber-500 bg-amber-500/5'
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
            <h3 className={`text-xl font-black uppercase italic ${color} flex items-center gap-3 tracking-tighter`}>
                <span className={`w-2 h-2 rounded-full bg-current animate-pulse`} />
                {title}
            </h3>
            <span className="bg-zinc-900 text-zinc-500 px-3 py-1 rounded-lg text-[10px] font-black">{count} ACTIONS</span>
        </div>
    )
}

function FinanceCard({ title, value, icon, color, bg, border, isHighlight = false }: any) {
  return (
    <div className={`p-8 rounded-[3rem] border ${border} ${bg} relative overflow-hidden group hover:scale-[1.02] transition-all duration-500`}>
      <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 ${color}`}>{icon}</div>
        {isHighlight && <span className="bg-amber-400 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">House Reserve</span>}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <h2 className={`text-4xl font-black italic tracking-tighter ${color}`}>
        ฿ {value.toLocaleString()}
      </h2>
    </div>
  );
}