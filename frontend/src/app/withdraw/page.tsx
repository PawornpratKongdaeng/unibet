"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const { data: user, mutate } = useSWR("/user/profile", fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedBalance = user?.balance 
    ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const quickAmounts = [100, 500, 1000, 5000];

  // ปรับแต่งสีของ SweetAlert ให้เข้ากับธีมเขียว
  const swalConfig = {
    background: '#013323',
    color: '#fff',
    confirmButtonColor: '#00b359',
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (withdrawAmount < 100) {
      return Swal.fire({ 
        icon: 'error', 
        title: 'ถอนขั้นต่ำ ฿100', 
        ...swalConfig,
        confirmButtonColor: '#ef4444' // สีแดงสำหรับ error
      });
    }

    if (withdrawAmount > (user?.balance || 0)) {
      return Swal.fire({ 
        icon: 'error', 
        title: 'ยอดเงินไม่เพียงพอ', 
        ...swalConfig,
        confirmButtonColor: '#ef4444' 
      });
    }

    const result = await Swal.fire({
      title: 'ยืนยันการถอนเงิน?',
      text: `ยอดถอน ฿${withdrawAmount.toLocaleString()} จะถูกโอนเข้าบัญชีคุณ`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'CONFIRM',
      cancelButtonText: 'CANCEL',
      ...swalConfig
    });

    if (result.isConfirmed) {
      Swal.fire({ 
        title: 'Processing...', 
        didOpen: () => Swal.showLoading(), 
        ...swalConfig 
      });

      try {
        const res = await apiFetch("/transaction/withdraw", {
          method: "POST",
          body: JSON.stringify({ amount: withdrawAmount }),
        });

        if (!res.ok) throw new Error();

        Swal.fire({ 
          icon: 'success', 
          title: 'SUCCESS!', 
          text: 'ส่งคำขอถอนเงินสำเร็จ', 
          ...swalConfig,
          timer: 2000, 
          showConfirmButton: false 
        });
        setAmount("");
        mutate(); 
      } catch (err) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Error', 
          text: 'เกิดข้อผิดพลาด กรุณาลองใหม่', 
          ...swalConfig 
        });
      }
    }
  };

  return (
    // 1. เปลี่ยนพื้นหลังหลักเป็นสีเขียวเข้ม
    <main className="min-h-screen bg-[#013323] text-white pb-20 font-sans overflow-x-hidden">
      <Header />
      
      <div className="max-w-md mx-auto px-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Withdraw <span className="text-[#00b359]">Credit</span>
          </h1>
        </div>

        {/* 1. ยอดเงินคงเหลือ - ใช้โทนเดียวกับ Dashboard Balance Card */}
        <div className="relative overflow-hidden bg-[#022c1e] border border-[#044630] p-8 rounded-[2.5rem] mb-6 shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-10">
              <span className="text-5xl">💰</span>
          </div>
          <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest mb-1">Available Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[#00b359] text-2xl font-black">฿</span>
            <span className="text-5xl font-black tracking-tighter text-white">
              {mounted ? formattedBalance : "0.00"}
            </span>
          </div>
        </div>

        {/* 2. ข้อมูลธนาคาร - ใช้ Gradient แบบ Hero Banner */}
        <div className="bg-gradient-to-br from-[#034a31] to-[#046c48] border border-white/10 p-6 rounded-[2rem] mb-8 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="bg-white/10 px-3 py-1 rounded-full border border-white/10 text-[9px] font-black uppercase text-emerald-100">Target Account</div>
            <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                <span className="text-xs">💳</span>
            </div>
          </div>
          <p className="text-2xl font-mono font-black tracking-widest text-white mb-1">
            {user?.bank_account || '000-0-00000-0'}
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] text-emerald-200/50 font-bold uppercase">Account Holder</p>
              <p className="font-black text-sm uppercase text-white">{user?.first_name} {user?.last_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-emerald-200/50 font-bold uppercase">Bank</p>
              <p className="font-black text-sm text-[#00b359] bg-white px-2 py-0.5 rounded shadow-sm">
                {user?.bank_name || 'K-BANK'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. ฟอร์มถอนเงิน */}
        <form onSubmit={handleWithdraw} className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-2">
              <label className="text-[10px] font-black text-emerald-400/50 uppercase tracking-widest">Withdraw Amount</label>
              <button 
                type="button"
                onClick={() => setAmount(user?.balance?.toString() || "0")}
                className="text-[10px] font-black text-[#00b359] uppercase hover:text-white transition-colors"
              >
                Max Amount
              </button>
            </div>
            
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[#00b359] font-black text-xl">฿</span>
              <input 
                type="number" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#022c1e] border border-[#044630] p-6 pl-12 rounded-[1.5rem] text-3xl font-black outline-none focus:border-[#00b359] text-white transition-all placeholder:text-emerald-900"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="py-3 bg-[#022c1e] border border-[#044630] rounded-xl text-[11px] font-black text-emerald-100 hover:bg-[#044630] hover:text-[#00b359] transition-all"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* ปุ่มกดยืนยัน - ใช้สไตล์เดียวกับปุ่ม Navigation Grid (ขาว-เขียว) */}
          <button className="group relative w-full bg-white text-[#013323] font-black py-6 rounded-[1.5rem] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-black/20">
            <div className="absolute inset-0 bg-[#00b359] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative group-hover:text-white transition-colors duration-300 uppercase italic tracking-widest">
              Confirm Withdrawal
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}