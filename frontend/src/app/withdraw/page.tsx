"use client";
import { useState } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const { data: user, mutate } = useSWR("/user/profile", fetcher);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (withdrawAmount > (user?.credit || 0)) {
      return Swal.fire({ icon: 'error', title: 'ยอดเงินไม่เพียงพอ', background: '#0f172a', color: '#fff' });
    }

    const result = await Swal.fire({
      title: 'ยืนยันการถอนเงิน?',
      text: `คุณต้องการถอนเงินจำนวน ฿${withdrawAmount.toLocaleString()} ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ยืนยันถอนเงิน',
      cancelButtonText: 'ยกเลิก',
      background: '#0f172a',
      color: '#fff'
    });

    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังดำเนินการ...', didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#fff' });

      try {
        const res = await apiFetch("/transaction/withdraw", {
          method: "POST",
          body: JSON.stringify({ amount: withdrawAmount }),
        });

        if (!res.ok) throw new Error();

        Swal.fire({ icon: 'success', title: 'ส่งคำขอถอนเงินสำเร็จ', text: 'ระบบกำลังดำเนินการโอนเงินเข้าบัญชีท่าน', background: '#0f172a', color: '#fff' });
        setAmount("");
        mutate(); // รีเฟรชยอดเงิน
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาติดต่อเจ้าหน้าที่', background: '#0f172a', color: '#fff' });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20">
      <Header />
      <div className="max-w-md mx-auto px-6 pt-10">
        <h1 className="text-3xl font-black italic uppercase mb-2">Withdraw <span className="text-rose-500">Credit</span></h1>
        
        {/* ยอดเงินปัจจุบัน */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl mb-8 flex justify-between items-end shadow-xl">
           <div>
              <p className="text-[9px] text-slate-500 font-black uppercase mb-1">ยอดเงินที่ถอนได้</p>
              <p className="text-3xl font-mono font-black text-white">฿{user?.credit?.toLocaleString() || '0'}</p>
           </div>
           <div className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-lg text-[10px] font-black border border-rose-500/20">
              AVAILABLE
           </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-6">
          <div className="bg-[#0f172a] p-5 rounded-[1.5rem] border border-slate-800 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full -mr-10 -mt-10"></div>
             <p className="text-[9px] text-slate-500 font-black uppercase mb-3">บัญชีรับเงินของคุณ</p>
             <p className="font-black text-base text-white uppercase">{user?.bank_name || 'K-BANK'}</p>
             <p className="font-mono text-xl tracking-tighter text-slate-400">{user?.bank_account || '000-0-00000-0'}</p>
             <p className="text-[10px] text-slate-500 mt-2 font-bold">{user?.first_name} {user?.last_name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">ระบุจำนวนเงิน</label>
            <input 
              type="number" 
              placeholder="ขั้นต่ำ 100"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 p-5 rounded-2xl text-2xl font-mono outline-none focus:border-rose-500 transition-all"
              required
            />
          </div>

          <button className="w-full bg-white text-black font-black py-5 rounded-2xl hover:bg-slate-200 transition-all uppercase text-sm shadow-xl active:scale-95">
            Withdraw Now
          </button>
        </form>
      </div>
    </main>
  );
}