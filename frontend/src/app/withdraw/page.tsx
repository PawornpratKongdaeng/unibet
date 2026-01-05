"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Landmark, User, CreditCard, ChevronDown } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [mounted, setMounted] = useState(false);
  
  const { data: user, mutate } = useSWR("/user/profile", fetcher);

  useEffect(() => {
    setMounted(true);
  }, []);

  const myanmarBanks = [
    "KBZ Bank", "CB Bank", "AYA Bank", "Yoma Bank", 
    "KBZPay", "Wave Money", "UAB Bank", "MAB Bank"
  ];

  const formattedBalance = user?.balance 
    ? user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const quickAmounts = [1000, 5000, 10000, 50000]; // ปรับตัวเลขให้เหมาะกับค่าเงิน

  const swalConfig = {
    background: '#013323',
    color: '#fff',
    confirmButtonColor: '#00b359',
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = Number(amount);

    if (!bankName || !accountNumber || !accountName) {
      return Swal.fire({ icon: 'error', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกข้อมูลธนาคารให้ครบทุกช่อง', ...swalConfig });
    }

    if (withdrawAmount < 100) {
      return Swal.fire({ icon: 'error', title: 'ถอนขั้นต่ำ ฿100', ...swalConfig });
    }

    const result = await Swal.fire({
      title: 'CONFIRM WITHDRAWAL',
      html: `
        <div class="text-left text-sm space-y-2 bg-black/20 p-4 rounded-2xl border border-white/5 mt-4">
          <p><span class="text-emerald-400 font-bold">Bank:</span> ${bankName}</p>
          <p><span class="text-emerald-400 font-bold">Account:</span> ${accountNumber}</p>
          <p><span class="text-emerald-400 font-bold">Name:</span> ${accountName}</p>
          <p class="text-xl mt-4 text-center font-black">Total: ฿${withdrawAmount.toLocaleString()}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CONFIRM',
      ...swalConfig
    });

    if (result.isConfirmed) {
      Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading(), ...swalConfig });

      try {
        const res = await apiFetch("/user/withdraw", {
          method: "POST",
          body: JSON.stringify({ 
            amount: withdrawAmount,
            bank_name: bankName,
            account_number: accountNumber,
            account_name: accountName
          }),
        });

        if (!res.ok) throw new Error();

        Swal.fire({ icon: 'success', title: 'SUCCESS!', text: 'ส่งคำขอถอนเงินสำเร็จ', ...swalConfig, timer: 2000, showConfirmButton: false });
        setAmount(""); setAccountNumber(""); setAccountName("");
        mutate(); 
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่', ...swalConfig });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-20 font-sans overflow-x-hidden">
      <Header />
      
      <div className="max-w-md mx-auto px-6 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
            Withdraw <span className="text-[#00b359]">Funds</span>
          </h1>
          <p className="text-[10px] font-bold text-emerald-400/30 uppercase tracking-[0.3em] mt-2">Myanmar Local Bank Support</p>
        </div>

        {/* Available Balance Card */}
        <div className="relative overflow-hidden bg-[#022c1e] border border-[#044630] p-8 rounded-[2.5rem] mb-10 shadow-2xl group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
              <Landmark size={80} />
          </div>
          <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest mb-1">Your Balance</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[#00b359] text-2xl font-black">฿</span>
            <span className="text-5xl font-black tracking-tighter text-white">
              {mounted ? formattedBalance : "0.00"}
            </span>
          </div>
        </div>

        <form onSubmit={handleWithdraw} className="space-y-8">
          
          {/* Section: Bank Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
               <div className="h-px flex-1 bg-[#044630]"></div>
               <span className="text-[9px] font-black text-emerald-400/40 uppercase tracking-[0.2em]">Bank Information</span>
               <div className="h-px flex-1 bg-[#044630]"></div>
            </div>

            {/* Select Bank */}
            <div className="relative">
              <select 
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full bg-[#022c1e] border border-[#044630] p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#00b359] appearance-none transition-all"
                required
              >
                <option value="" disabled>Select Myanmar Bank / Wallet</option>
                {myanmarBanks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400/50 pointer-events-none" size={18} />
            </div>

            {/* Account Number */}
            <div className="relative group">
              <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900 group-focus-within:text-[#00b359] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Account Number / Wallet ID"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-[#022c1e] border border-[#044630] p-5 pl-14 rounded-2xl text-sm font-bold outline-none focus:border-[#00b359] transition-all"
                required
              />
            </div>

            {/* Account Name */}
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-900 group-focus-within:text-[#00b359] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Full Account Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full bg-[#022c1e] border border-[#044630] p-5 pl-14 rounded-2xl text-sm font-bold outline-none focus:border-[#00b359] transition-all"
                required
              />
            </div>
          </div>

          {/* Section: Amount */}
          <div className="space-y-4">
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
                className="w-full bg-[#022c1e] border border-[#044630] p-6 pl-12 rounded-[1.5rem] text-3xl font-black outline-none focus:border-[#00b359] transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val.toString())}
                  className="py-3 bg-[#022c1e] border border-[#044630] rounded-xl text-[10px] font-black text-emerald-100 hover:bg-[#044630] hover:text-[#00b359] transition-all shadow-sm"
                >
                  +{val.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <button className="group relative w-full bg-white text-[#013323] font-[1000] py-6 rounded-[2rem] overflow-hidden transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-[#00b359]/10">
            <div className="absolute inset-0 bg-[#00b359] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative group-hover:text-white transition-colors duration-300 uppercase italic tracking-[0.2em] text-xs">
              Confirm Withdrawal
            </span>
          </button>
        </form>
      </div>
    </main>
  );
}