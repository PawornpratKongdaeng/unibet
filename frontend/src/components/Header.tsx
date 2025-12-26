"use client";
import Link from 'next/link';
import { useWallet } from '../context/WalletContext'; // ตรวจสอบ path ให้ถูกต้อง
import { useState, useEffect } from 'react';

export default function Header() {
  const { balance } = useWallet();
  const [mounted, setMounted] = useState(false);

  // ป้องกัน Hydration error (เพื่อให้ยอดเงินแสดงผลตรงกันระหว่าง Server และ Client)
  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance || 0);

  return (
    <header className="bg-[#0f172a]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-[100] border-b border-slate-800 flex justify-between items-center shadow-2xl">
      
      {/* 1. Left Section: Brand Logo */}
      <div className="flex items-center gap-6">
        <Link href="/" className="group flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center font-black text-black group-hover:rotate-12 transition-transform">S</div>
          <span className="text-2xl font-black text-white italic tracking-tighter uppercase">
            SOCCER<span className="text-yellow-500">BET</span>
          </span>
        </Link>
      </div>

      {/* 2. Right Section: Wallet & Profile */}
      <div className="flex items-center gap-4">
        
        {/* --- 💰 Wallet Container --- */}
        <div className="bg-[#1e293b] border border-slate-700 pl-4 pr-1 py-1 rounded-2xl flex items-center gap-3 group hover:border-yellow-500/50 transition-all">
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Available Balance</span>
            <div className="flex items-center gap-1 text-green-400 font-mono font-black text-lg">
              <span className="text-xs opacity-70">฿</span>
              {mounted ? formattedBalance : "0.00"}
            </div>
          </div>
          
          {/* Quick Deposit Button (+) */}
          <Link href="/deposit" className="w-8 h-8 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl flex items-center justify-center font-bold text-lg shadow-lg shadow-yellow-500/10 transition-all active:scale-90">
            +
          </Link>
        </div>

        {/* Separator */}
        <div className="h-6 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>

        {/* --- 📜 Action Buttons --- */}
        <div className="flex items-center gap-2">
          <Link href="/history" className="p-2.5 bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-all flex items-center gap-2">
            <span className="text-sm">📜</span>
            <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">History</span>
          </Link>
          
          {/* User Profile Circle */}
          <Link href="/profile" className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 rounded-2xl flex items-center justify-center text-slate-300 hover:border-yellow-500 transition-all">
             👤
          </Link>
        </div>

      </div>
    </header>
  );
}