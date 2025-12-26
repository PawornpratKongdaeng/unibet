"use client";
import Link from 'next/link';
import { useWallet } from '../context/WalletContext';
import { useState, useEffect } from 'react';

export default function Header() {
  const { balance } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance || 0);

  return (
    <header className="bg-[#020617]/80 backdrop-blur-xl px-4 sm:px-8 py-3 sticky top-0 z-[100] border-b border-slate-800/50 flex justify-between items-center shadow-2xl">
      
      {/* 1. Brand Logo: UNIBET */}
      <div className="flex items-center">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black transform group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-yellow-500/20">
              U
            </div>
            {/* แสงเงาตกกระทบเล็กๆ ด้านหลังตัว U */}
            <div className="absolute inset-0 bg-yellow-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white italic tracking-[ -0.05em] uppercase">
            UNI<span className="text-yellow-500">BET</span>
          </span>
        </Link>
      </div>

      {/* 2. Right Section: Wallet & Actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* --- 💰 Wallet Container --- */}
        <div className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 pl-3 sm:pl-4 pr-1.5 py-1.5 rounded-2xl flex items-center gap-4 transition-all duration-300">
          <div className="flex flex-col items-start">
            <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Balance</span>
            <div className="flex items-center gap-1.5 text-white font-mono font-bold text-sm sm:text-base leading-none">
              <span className="text-yellow-500 font-sans text-xs">฿</span>
              {mounted ? formattedBalance : "0.00"}
            </div>
          </div>
          
          {/* Quick Deposit Button (+) */}
          <Link href="/deposit" className="w-8 h-8 sm:w-9 sm:h-9 bg-yellow-500 hover:bg-white text-black rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-yellow-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </Link>
        </div>

        {/* --- 📜 Action Buttons (Outline Style) --- */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <Link href="/history" className="p-2.5 text-slate-400 hover:text-yellow-500 hover:bg-slate-900 rounded-xl transition-all group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-white pointer-events-none uppercase font-bold tracking-tighter">History</span>
          </Link>
          
          {/* Profile Button */}
          <Link href="/profile" className="w-10 h-10 border border-slate-800 hover:border-yellow-500/50 bg-slate-900/50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-white transition-all overflow-hidden group">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>
        </div>

      </div>
    </header>
  );
}