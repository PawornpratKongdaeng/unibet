"use client";
import { useState } from "react";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";
import Header from "@/components/Header";

export default function TransferPage() {
  const [targetUser, setTargetUser] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/agent/transfer", {
        method: "POST",
        body: JSON.stringify({ username: targetUser, amount: Number(amount) }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast("success", `โอนสำเร็จ! ยอดเงินคงเหลือ: ฿${data.new_balance.toLocaleString()}`);
        setTargetUser(""); setAmount("");
      } else {
        showToast("error", data.error || "โอนไม่สำเร็จ");
      }
    } catch (err) {
      showToast("error", "การเชื่อมต่อล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Header />
      <div className="max-w-md mx-auto px-6 pt-10">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Credit Transfer</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">โอนเครดิตให้สายงานของคุณ</p>
          </div>

          <form onSubmit={handleTransfer} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Receiver Username</label>
              <input
                type="text"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mt-2 outline-none focus:border-yellow-500 transition-all"
                placeholder="ชื่อผู้ใช้งานที่ต้องการรับเงิน"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Amount (฿)</label>
              <input
                type="number"
                required
                className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl p-4 mt-2 outline-none focus:border-yellow-500 text-xl font-bold text-yellow-500"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 text-black font-black py-4 rounded-2xl shadow-lg shadow-yellow-500/10 transition-all active:scale-95"
            >
              {loading ? "กำลังดำเนินการ..." : "CONFIRM TRANSFER"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}