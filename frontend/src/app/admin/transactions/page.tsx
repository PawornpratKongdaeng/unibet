"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api"; // มั่นใจว่า path นี้ถูกต้องตามโปรเจกต์คุณ
import Swal from "sweetalert2";
import { useState } from "react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminTransactions() {
  // ใช้ SWR เพื่อดึงข้อมูลและรีเฟรชข้อมูลอัตโนมัติ (Revalidate)
  const { data: txs, mutate, isLoading } = useSWR("/admin/transactions/pending", fetcher, {
    refreshInterval: 5000 // รีเฟรชทุก 5 วินาทีเพื่อดูรายการใหม่ๆ
  });

  const handleAction = async (tx: any, action: 'approve' | 'reject') => {
    const isApprove = action === 'approve';
    
    const confirmResult = await Swal.fire({
      title: isApprove ? 'ยืนยันอนุมัติรายการ?' : 'ยืนยันปฏิเสธรายการ?',
      html: `
        <div class="text-left bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mt-4">
          <p class="text-zinc-400 text-xs uppercase font-black">User: <span class="text-white">${tx.User?.username}</span></p>
          <p class="text-zinc-400 text-xs uppercase font-black">Type: <span class="${tx.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}">${tx.type.toUpperCase()}</span></p>
          <p class="text-white text-2xl font-black mt-1">฿${tx.amount.toLocaleString()}</p>
        </div>
      `,
      icon: isApprove ? 'success' : 'warning',
      showCancelButton: true,
      confirmButtonText: isApprove ? 'APPROVE' : 'REJECT',
      confirmButtonColor: isApprove ? '#fff' : '#ef4444',
      cancelButtonColor: '#27272a',
      background: '#09090b',
      color: '#fff',
      customClass: {
        confirmButton: isApprove ? '!text-black !font-black !rounded-xl px-8' : '!font-black !rounded-xl px-8',
        cancelButton: '!rounded-xl px-8'
      }
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: 'ดำเนินการสำเร็จ', 
            timer: 1500, 
            showConfirmButton: false, 
            background: '#09090b', 
            color: '#fff' 
          });
          mutate(); // อัปเดตข้อมูลในหน้าจอทันที
        } else {
          throw new Error("Failed to process");
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', background: '#09090b', color: '#fff' });
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Pending <span className="text-zinc-500">Transactions</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em]">
            รายการรออนุมัติ ({txs?.length || 0})
          </p>
        </div>
        <div className="flex gap-2">
           <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-[10px] font-black uppercase">
             Auto-Refresh Active
           </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="py-20 text-center animate-pulse text-zinc-600 font-black uppercase tracking-widest">
            Loading Transactions...
          </div>
        ) : txs?.length > 0 ? (
          txs.map((tx: any) => (
            <div 
              key={tx.id} 
              className="group bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2.5rem] hover:border-zinc-700 transition-all flex flex-col lg:flex-row justify-between items-center gap-6"
            >
              <div className="flex items-center gap-6 w-full">
                {/* Icon Type */}
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-xl font-black shrink-0 ${
                  tx.type === 'deposit' 
                    ? 'bg-emerald-500 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]' 
                    : 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                }`}>
                  {tx.type === 'deposit' ? 'IN' : 'OUT'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-black text-lg truncate">{tx.User?.username}</span>
                    <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">ID: {tx.user_id}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                     <p className="text-3xl font-black tracking-tighter text-white">฿{tx.amount.toLocaleString()}</p>
                     <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                       {new Date(tx.created_at).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}
                     </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 w-full lg:w-auto">
                <button 
                  onClick={() => handleAction(tx, 'reject')}
                  className="flex-1 lg:flex-none px-8 py-4 bg-zinc-950 hover:bg-rose-500 hover:text-white border border-zinc-800 rounded-2xl text-xs font-black transition-all uppercase tracking-widest text-zinc-500"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleAction(tx, 'approve')}
                  className="flex-1 lg:flex-none px-8 py-4 bg-white text-black hover:bg-emerald-400 hover:scale-105 rounded-2xl text-xs font-black transition-all uppercase tracking-widest shadow-xl"
                >
                  Approve
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-32 bg-zinc-900/20 rounded-[3.5rem] border-2 border-dashed border-zinc-900 flex flex-col items-center">
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-3xl mb-4 text-zinc-700">✓</div>
            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-sm">No Pending Orders</p>
            <p className="text-zinc-800 text-xs mt-2 uppercase">ระบบจะอัปเดตอัตโนมัติเมื่อมีรายการใหม่</p>
          </div>
        )}
      </div>
    </div>
  );
}