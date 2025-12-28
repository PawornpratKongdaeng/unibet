"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function FinanceStats() {
  const { data: financeData } = useSWR("/admin/finance/summary", fetcher);
  const { data: pending, mutate: mutatePending } = useSWR("/admin/transactions/pending", fetcher);
  const { data: history, mutate: mutateHistory } = useSWR("/admin/transactions/history", fetcher);

  const totalDeposit = financeData?.total_deposit || 0;
  const totalWithdraw = financeData?.total_withdraw || 0;
  const netProfit = totalDeposit - totalWithdraw;

  // ฟังก์ชันสำหรับการ อนุมัติ / ปฏิเสธ
  const handleAction = async (id: number, action: 'approve' | 'reject', type: string, amount: number) => {
    const result = await Swal.fire({
      title: action === 'approve' ? 'ยืนยันอนุมัติ?' : 'ยืนยันปฏิเสธรายการ?',
      text: `${type.toUpperCase()} ยอด ฿${amount.toLocaleString()}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: action === 'approve' ? 'CONFIRM' : 'REJECT',
      confirmButtonColor: action === 'approve' ? '#10b981' : '#ef4444',
      background: '#09090b', color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/${action}/${id}`, { method: 'POST' });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'Done!', timer: 1000, showConfirmButton: false, background: '#09090b', color: '#fff' });
          mutatePending();
          mutateHistory();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', background: '#09090b', color: '#fff' });
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* 1. Header & Stats Cards (เหมือนโค้ดเดิมของคุณ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard title="Total Deposit" value={totalDeposit} icon="💰" color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20" />
        <FinanceCard title="Total Withdraw" value={totalWithdraw} icon="💸" color="text-rose-500" bg="bg-rose-500/5" border="border-rose-500/20" />
        <FinanceCard title="Net Profit" value={netProfit} icon="📈" color="text-amber-400" bg="bg-amber-500/10" border="border-amber-500/30" isHighlight />
      </div>

      {/* 2. Pending Requests (ส่วนที่เพิ่มใหม่สำหรับอนุมัติ) */}
      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase italic text-amber-400">Pending Requests 🔔</h3>
        <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/50 text-zinc-500 text-[10px] font-black uppercase border-b border-zinc-900">
              <tr>
                <th className="px-8 py-5">User</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-sm font-bold">
              {pending?.length > 0 ? pending.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-zinc-900/30">
                  <td className="px-8 py-5 text-white">@{tx.User?.username}</td>
                  <td className="px-8 py-5">
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${tx.type === 'deposit' ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-xl font-black">฿{tx.amount.toLocaleString()}</td>
                  <td className="px-8 py-5 text-right space-x-2">
                    <button onClick={() => handleAction(tx.id, 'approve', tx.type, tx.amount)} className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-black transition-all text-[10px] font-black uppercase">Approve</button>
                    <button onClick={() => handleAction(tx.id, 'reject', tx.type, tx.amount)} className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase">Reject</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="py-10 text-center text-zinc-700 font-black uppercase">No pending requests</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Transaction History (ปรับปรุงจากโค้ดเดิม) */}
      <div className="space-y-6">
        <h3 className="text-xl font-black uppercase italic text-white">Financial Logs</h3>
        <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden opacity-80">
          <table className="w-full text-left">
             {/* ... thead เหมือนเดิม ... */}
             <tbody className="divide-y divide-zinc-900 text-sm font-bold">
                {history?.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-zinc-900/30">
                    <td className="px-8 py-5">
                      <p className="text-white">{new Date(tx.created_at).toLocaleTimeString()}</p>
                      <p className="text-[10px] text-zinc-600 font-black uppercase">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-8 py-5 text-zinc-400">@{tx.User?.username}</td>
                    <td className="px-8 py-5 uppercase text-[10px]">{tx.type}</td>
                    <td className={`px-8 py-5 text-lg font-black ${tx.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tx.type === 'deposit' ? '+' : '-'} ฿{tx.amount.toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${
                        tx.status === 'approved' ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 
                        tx.status === 'rejected' ? 'border-rose-500/30 text-rose-500 bg-rose-500/5' : 'text-amber-500'
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

// FinanceCard component เหมือนเดิมของคุณ

// Sub-Component สำหรับการ์ดตัวเลข
function FinanceCard({ title, value, icon, color, bg, border, isHighlight = false }: any) {
  return (
    <div className={`p-8 rounded-[2.5rem] border ${border} ${bg} transition-all hover:scale-[1.02] duration-300`}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-3xl">{icon}</span>
        {isHighlight && (
          <span className="bg-amber-400 text-black text-[9px] font-black px-2 py-1 rounded-md uppercase">Top Performance</span>
        )}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <h2 className={`text-4xl font-black tracking-tighter ${color}`}>
        ฿ {value.toLocaleString()}
      </h2>
    </div>
  );
}