"use client";
import { useState } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  // ดึงข้อมูลบัญชีธนาคารหน้าบ้านจาก Admin
  const { data: adminBank } = useSWR("/admin/config/bank", fetcher);

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < 100) {
      return Swal.fire({ icon: 'warning', title: 'ยอดฝากขั้นต่ำ 100 บาท', background: '#0f172a', color: '#fff' });
    }

    Swal.fire({
      title: 'กำลังส่งข้อมูล...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: '#0f172a',
      color: '#fff'
    });

    try {
      const res = await apiFetch("/transaction/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount) }),
      });

      if (!res.ok) throw new Error();

      Swal.fire({
        icon: 'success',
        title: 'แจ้งฝากสำเร็จ!',
        text: 'กรุณารอเจ้าหน้าที่ตรวจสอบยอดเงินสักครู่',
        background: '#0f172a',
        color: '#fff',
        confirmButtonColor: '#eab308'
      });
      setAmount("");
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'กรุณาลองใหม่อีกครั้ง', background: '#0f172a', color: '#fff' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      background: '#1e293b',
      color: '#fff'
    });
    Toast.fire({ icon: 'success', title: 'คัดลอกเลขบัญชีแล้ว' });
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20">
      <Header />
      <div className="max-w-md mx-auto px-6 pt-10">
        <h1 className="text-3xl font-black italic uppercase mb-2">Deposit <span className="text-yellow-500">Credit</span></h1>
        
        {/* บัญชีธนาคาร Admin */}
        <div className="bg-gradient-to-br from-slate-900 to-[#1e1b4b] border border-slate-800 p-6 rounded-[2rem] mb-8 shadow-2xl">
          <p className="text-[10px] text-slate-400 font-black uppercase mb-4 tracking-tighter">บัญชีธนาคารสำหรับโอนเงิน</p>
          {adminBank ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-xl font-bold border border-white/5">
                  🏦
                </div>
                <div>
                  <p className="text-xl font-mono font-black tracking-widest text-yellow-500">{adminBank.account_number}</p>
                  <p className="text-xs font-bold text-slate-300 uppercase">{adminBank.bank_name} - {adminBank.account_name}</p>
                </div>
              </div>
              <button 
                onClick={() => copyToClipboard(adminBank.account_number)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black transition-all border border-white/5 uppercase"
              >
                Copy Account Number
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-slate-500 text-xs animate-pulse">กำลังโหลดข้อมูลบัญชี...</div>
          )}
        </div>

        <form onSubmit={handleDeposit} className="space-y-6">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">฿</span>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 p-5 pl-10 rounded-2xl text-2xl font-mono outline-none focus:border-yellow-500 transition-all shadow-inner"
              required
            />
          </div>
          <button className="w-full bg-yellow-500 text-black font-black py-5 rounded-2xl shadow-lg shadow-yellow-500/10 hover:scale-[1.02] active:scale-95 transition-all text-sm uppercase">
            Confirm Deposit
          </button>
        </form>
      </div>
    </main>
  );
}