"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { ArrowDownLeft, ArrowUpRight, Check, X, Clock, RefreshCcw } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminTransactions() {
  const { data: txs, mutate, isLoading } = useSWR("/admin/transactions/pending", fetcher, {
    refreshInterval: 5000 
  });

  const handleAction = async (tx: any, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    
    const confirmResult = await Swal.fire({
      title: isApprove ? 'APPROVE TRANSACTION?' : 'REJECT TRANSACTION?',
      html: `
        <div class="text-left bg-zinc-950 p-6 rounded-3xl border border-zinc-800 mt-4">
          <p class="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-1">Target User</p>
          <p class="text-white font-black italic uppercase text-lg mb-4">${tx.User?.username}</p>
          <div class="flex justify-between items-end">
            <div>
               <p class="text-zinc-500 text-[10px] uppercase font-black tracking-widest mb-1">Amount</p>
               <p class="text-3xl font-black text-white tracking-tighter">฿${tx.amount.toLocaleString()}</p>
            </div>
            <div class="text-right">
               <span class="px-3 py-1 rounded-lg text-[10px] font-black uppercase ${tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}">
                ${tx.type}
               </span>
            </div>
          </div>
        </div>
      `,
      icon: isApprove ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'CONFIRM APPROVAL' : 'CONFIRM REJECTION',
      confirmButtonColor: isApprove ? '#f43f5e' : '#27272a',
      background: '#09090b',
      color: '#fff',
      customClass: {
        confirmButton: '!rounded-2xl !font-black !py-4 !px-8 !text-xs',
        cancelButton: '!rounded-2xl !font-black !py-4 !px-8 !text-xs'
      }
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'ACTION COMPLETED', timer: 1500, showConfirmButton: false, background: '#09090b', color: '#fff' });
          mutate();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'SYSTEM ERROR', background: '#09090b', color: '#fff' });
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">
            Pending <span className="text-rose-500">Orders</span>
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">
              รายการรอตรวจสอบ ({txs?.length || 0} รายการ)
            </p>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
        </div>
        <button onClick={() => mutate()} className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-24 text-center">
             <div className="w-12 h-12 border-4 border-zinc-800 border-t-rose-500 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-zinc-600 font-black uppercase tracking-widest text-xs">Fetching Data...</p>
          </div>
        ) : txs?.length > 0 ? (
          txs.map((tx: any) => (
            <div key={tx.id} className="group bg-zinc-950 border border-zinc-900 p-6 rounded-[2.5rem] hover:border-zinc-700 transition-all duration-300 flex flex-col lg:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="flex items-center gap-6 w-full">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                  tx.type === 'deposit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {tx.type === 'deposit' ? <ArrowDownLeft size={32} strokeWidth={3} /> : <ArrowUpRight size={32} strokeWidth={3} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-black text-xl italic uppercase tracking-tighter">{tx.User?.username}</span>
                    <span className="text-[9px] bg-zinc-900 text-zinc-600 px-2 py-1 rounded-md font-black uppercase tracking-widest">ID: {tx.user_id}</span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <p className="text-4xl font-black tracking-tighter text-white">฿{tx.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-1.5 text-zinc-600">
                      <Clock size={12} />
                      <p className="text-[10px] font-black uppercase tracking-widest">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => handleAction(tx, 'reject')} className="flex-1 lg:flex-none px-8 py-4 bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-white border border-zinc-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  Reject
                </button>
                <button onClick={() => handleAction(tx, 'approve')} className="flex-1 lg:flex-none px-8 py-4 bg-white text-black hover:bg-rose-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]">
                  Approve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-zinc-950 rounded-[3.5rem] border-2 border-dashed border-zinc-900">
            <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-sm">No Pending Transactions</p>
          </div>
        )}
      </div>
    </div>
  );
}