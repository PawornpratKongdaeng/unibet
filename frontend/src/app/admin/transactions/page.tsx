"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  X, 
  Clock, 
  RefreshCcw,
  Wallet,
  User as UserIcon,
  ChevronRight
} from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminTransactions() {
  const { data: txs, mutate, isLoading } = useSWR("/admin/transactions/pending", fetcher, {
    refreshInterval: 5000 
  });

  const handleAction = async (tx: any, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    
    const confirmResult = await Swal.fire({
      title: isApprove ? 'CONFIRM APPROVAL?' : 'CONFIRM REJECTION?',
      html: `
        <div class="text-left bg-[#013323] p-6 rounded-[2rem] border border-[#044630] mt-4 shadow-2xl">
          <p class="text-emerald-400/30 text-[9px] uppercase font-[1000] tracking-[0.3em] mb-1">Target Account</p>
          <p class="text-white font-[1000] italic uppercase text-xl mb-4 tracking-tighter">${tx.User?.username}</p>
          
          <div className="h-[1px] bg-[#044630] mb-4"></div>

          <div class="flex justify-between items-end">
            <div>
               <p class="text-emerald-400/30 text-[9px] uppercase font-[1000] tracking-[0.3em] mb-1">Transfer Amount</p>
               <p class="text-4xl font-[1000] text-[#00b359] tracking-tighter italic">฿${tx.amount.toLocaleString()}</p>
            </div>
            <div class="text-right">
               <span class="px-4 py-1.5 rounded-full text-[9px] font-[1000] uppercase tracking-widest ${tx.type === 'deposit' ? 'bg-[#00b359]/20 text-[#00b359]' : 'bg-rose-500/20 text-rose-500'}">
                ${tx.type}
               </span>
            </div>
          </div>
        </div>
      `,
      icon: isApprove ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'AUTHORIZE NOW' : 'REJECT ORDER',
      confirmButtonColor: isApprove ? '#00b359' : '#013323',
      cancelButtonText: 'ABORT',
      background: '#022c1e',
      color: '#fff',
      customClass: {
        confirmButton: '!rounded-2xl !font-[1000] !py-4 !px-8 !text-[10px] !uppercase !tracking-widest !border-none',
        cancelButton: '!rounded-2xl !font-[1000] !py-4 !px-8 !text-[10px] !uppercase !tracking-widest !bg-transparent !text-emerald-400/40 !border !border-[#044630]'
      }
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: 'ORDER FINALIZED', 
            timer: 1500, 
            showConfirmButton: false, 
            background: '#022c1e', 
            color: '#fff',
            customClass: { title: '!font-[1000] !text-sm !tracking-widest' }
          });
          mutate();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'SYSTEM ERROR', background: '#022c1e', color: '#fff' });
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-[#00b359] animate-pulse"></div>
             <p className="text-emerald-400/40 text-[10px] font-[1000] uppercase tracking-[0.4em]">Queue Management</p>
          </div>
          <h1 className="text-5xl font-[1000] uppercase italic tracking-tighter text-white">
            Pending <span className="text-[#00b359]">Orders</span>
          </h1>
        </div>
        
        <button 
          onClick={() => mutate()} 
          className="group flex items-center gap-3 px-8 py-4 bg-[#022c1e] border border-[#044630] rounded-2xl text-[10px] font-[1000] uppercase tracking-[0.2em] text-[#00b359] hover:bg-[#00b359] hover:text-[#013323] transition-all duration-500"
        >
          <RefreshCcw size={14} className="group-hover:rotate-180 transition-transform duration-700" /> 
          Reload Queue
        </button>
      </div>

      {/* Statistics Mini Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#022c1e] border border-[#044630] p-6 rounded-[2rem] flex items-center justify-between">
              <span className="text-emerald-400/20 text-[10px] font-[1000] uppercase tracking-widest">Awaiting Review</span>
              <span className="text-2xl font-[1000] italic text-white">{txs?.length || 0} <span className="text-xs text-emerald-400/30">Items</span></span>
          </div>
      </div>

      {/* Transaction List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-32 text-center bg-[#022c1e]/50 rounded-[3rem] border border-dashed border-[#044630]">
             <div className="w-12 h-12 border-4 border-[#044630] border-t-[#00b359] rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-emerald-400/20 font-[1000] uppercase tracking-[0.4em] text-[10px]">Syncing Live Buffer...</p>
          </div>
        ) : txs?.length > 0 ? (
          txs.map((tx: any) => (
            <div key={tx.id} className="group bg-[#022c1e] border border-[#044630] p-1.5 pr-6 rounded-[2.5rem] hover:border-[#00b359]/30 transition-all duration-500 flex flex-col lg:flex-row justify-between items-center gap-6 relative overflow-hidden">
              <div className="flex items-center gap-6 w-full">
                {/* Type Icon */}
                <div className={`w-20 h-20 rounded-[2.2rem] flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500 group-hover:scale-95 ${
                  tx.type === 'deposit' ? 'bg-[#00b359] text-[#013323]' : 'bg-[#013323] text-rose-500 border border-[#044630]'
                }`}>
                  {tx.type === 'deposit' ? <ArrowDownLeft size={36} strokeWidth={3} /> : <ArrowUpRight size={36} strokeWidth={3} />}
                </div>

                {/* User & Amount Info */}
                <div className="flex-1 min-w-0 py-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-[1000] text-2xl italic uppercase tracking-tighter leading-none">{tx.User?.username}</span>
                    <span className="text-[9px] bg-[#013323] text-emerald-400/40 px-3 py-1 rounded-full font-[1000] uppercase tracking-widest border border-[#044630]">UID: {tx.user_id}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <p className="text-4xl font-[1000] tracking-tighter text-[#00b359] italic leading-none">฿{tx.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-emerald-400/20 bg-[#013323]/50 px-3 py-1 rounded-lg">
                      <Clock size={12} />
                      <p className="text-[9px] font-[1000] uppercase tracking-widest">{new Date(tx.created_at).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full lg:w-auto pb-4 lg:pb-0">
                <button 
                  onClick={() => handleAction(tx, 'reject')} 
                  className="flex-1 lg:flex-none px-10 py-5 bg-transparent text-emerald-400/20 hover:text-rose-500 hover:bg-rose-500/5 border border-[#044630] hover:border-rose-500/30 rounded-2xl text-[10px] font-[1000] uppercase tracking-[0.2em] transition-all duration-300"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(tx, 'approve')} 
                  className="flex-1 lg:flex-none px-10 py-5 bg-white text-[#013323] hover:bg-[#00b359] rounded-2xl text-[10px] font-[1000] uppercase tracking-[0.2em] transition-all duration-500 shadow-xl"
                >
                  Approve Order
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-40 bg-[#022c1e]/30 rounded-[3.5rem] border-2 border-dashed border-[#044630] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-[#044630]/20 rounded-full flex items-center justify-center text-emerald-400/10">
               <Wallet size={32} />
            </div>
            <p className="text-emerald-400/20 font-[1000] uppercase tracking-[0.4em] text-xs">Clearance: No Pending Requests</p>
          </div>
        )}
      </div>
    </div>
  );
}