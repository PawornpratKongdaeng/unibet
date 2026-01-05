"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ChevronLeft, 
  Wallet, 
  Search,
  Filter
} from "lucide-react";

import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function TransactionsPage() {
  const router = useRouter();
  const { balance } = useWallet() as any;
  const [filter, setFilter] = useState("all"); // all, deposit, withdraw, bet, payout

  // ดึงข้อมูล Transactions จาก API
  const { data, isLoading } = useSWR("/user/transactions", fetcher, {
    refreshInterval: 10000 // อัปเดตทุก 10 วินาที
  });

  const transactions = data?.data || [];

  // กรองข้อมูลตาม Type
  const filteredData = transactions.filter((item: any) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans font-bold">
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-6">
        
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-emerald-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-sm tracking-widest uppercase">Back</span>
          </button>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-[#00b359]" />
            <h1 className="text-xl font-extrabold tracking-tighter uppercase">Transactions</h1>
          </div>
        </div>

        {/* Balance Card - Reused Style */}
        <div className="bg-[#022c1e] rounded-2xl p-5 mb-6 flex justify-between items-center shadow-md border border-[#044630] relative overflow-hidden">
          <div className="z-10">
            <p className="text-[10px] text-emerald-400/70 uppercase tracking-[0.2em] mb-1">Total Balance</p>
            <div className="text-3xl font-extrabold text-[#00b359] flex items-baseline tracking-tighter">
              <span className="text-xl mr-1">฿</span>
              {balance ? balance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>
          <Wallet className="w-12 h-12 text-[#044630] absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto space-x-2 mb-6 no-scrollbar pb-2">
          {["all", "bet", "payout", "deposit", "withdraw"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-6 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all whitespace-nowrap border ${
                filter === t 
                ? "bg-[#00b359] border-[#00b359] text-[#013323] shadow-lg shadow-emerald-900/20" 
                : "bg-[#022c1e] border-[#044630] text-emerald-500/60 hover:border-emerald-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Transaction List */}
        <div className="space-y-3">
          {isLoading ? (
             <div className="py-20 text-center flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-[#00b359] border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-emerald-700 text-[10px] font-bold tracking-widest uppercase">Loading Logs...</p>
             </div>
          ) : filteredData.length === 0 ? (
            <div className="py-20 text-center bg-[#022c1e] rounded-3xl border border-dashed border-[#044630]">
              <Search className="w-12 h-12 text-[#044630] mx-auto mb-4" />
              <p className="text-zinc-500 text-xs uppercase tracking-widest">No transactions found</p>
            </div>
          ) : (
            filteredData.map((tx: any) => (
              <div 
                key={tx.id}
                className="bg-[#022c1e] border border-[#044630] rounded-2xl p-4 flex items-center justify-between group hover:border-[#00b359]/50 transition-all"
              >
                <div className="flex items-center space-x-4">
                  {/* Icon Status */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.amount > 0 ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  }`}>
                    {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-extrabold tracking-wide uppercase">{tx.description || tx.type}</h3>
                    <p className="text-[10px] text-zinc-500 tracking-wider">
                      {new Date(tx.created_at).toLocaleString('th-TH', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-black tracking-tighter ${
                    tx.amount > 0 ? "text-[#00b359]" : "text-rose-500"
                  }`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    Balance: {tx.balance_after?.toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-[9px] text-emerald-900/50 uppercase tracking-[0.3em]">
            Secure Financial Encryption Active
          </p>
        </div>
      </div>
    </main>
  );
}