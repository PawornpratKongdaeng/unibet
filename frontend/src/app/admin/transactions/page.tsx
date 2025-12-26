"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import Header from "@/components/Header";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminTransactions() {
  const { data: txs, mutate } = useSWR("/admin/transactions/pending", fetcher);

  const handleAction = async (id: number, action: 'approve' | 'reject', type: string) => {
    const confirmResult = await Swal.fire({
      title: action === 'approve' ? 'ยืนยันการอนุมัติ?' : 'ยืนยันการปฏิเสธ?',
      text: `${type.toUpperCase()} ยอดเงิน ฿${id}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
      background: '#0f172a', color: '#fff'
    });

    if (confirmResult.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'ดำเนินการสำเร็จ', background: '#0f172a', color: '#fff' });
          mutate();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20">
      <Header />
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <h1 className="text-3xl font-black italic uppercase mb-8">Pending <span className="text-yellow-500">Transactions</span></h1>

        <div className="space-y-4">
          {txs?.length > 0 ? txs.map((tx: any) => (
            <div key={tx.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                  {tx.type === 'deposit' ? 'IN' : 'OUT'}
                </div>
                <div>
                  <p className="text-sm font-black uppercase text-slate-300">{tx.User?.username} <span className="text-slate-600 ml-2">ID: {tx.user_id}</span></p>
                  <p className="text-xl font-mono font-black tracking-tight">฿{tx.amount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{new Date(tx.created_at).toLocaleString('th-TH')}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button 
                  onClick={() => handleAction(tx.id, 'reject', tx.type)}
                  className="flex-1 md:flex-none px-6 py-2 bg-slate-800 hover:bg-rose-900/30 text-rose-500 rounded-xl text-xs font-black transition-all border border-slate-700"
                >
                  REJECT
                </button>
                <button 
                  onClick={() => handleAction(tx.id, 'approve', tx.type)}
                  className="flex-1 md:flex-none px-6 py-2 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/20"
                >
                  APPROVE
                </button>
              </div>
            </div>
          )) : (
            <div className="text-center py-20 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800">
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No Pending Orders</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}