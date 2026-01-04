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
    // 1. เปลี่ยน BG เป็นเขียวเข้ม (013323) และ Border เป็นเขียวขี้ม้า (044630)
    <header className="bg-[#013323]/95 backdrop-blur-md px-4 sm:px-8 py-3 sticky top-0 z-[100] border-b border-[#044630] flex justify-between items-center shadow-lg">
      
      {/* 2. Brand Logo: เปลี่ยนโทนสีเป็น เขียวมรกต (00b359) */}
      <div className="flex items-center">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="relative">
            {/* กล่องตัว U เปลี่ยนเป็นสีเขียวมรกต */}
            <div className="w-9 h-9 bg-[#00b359] rounded-xl flex items-center justify-center font-black text-[#013323] transform group-hover:-rotate-6 transition-all duration-300 shadow-lg shadow-[#00b359]/20">
              U
            </div>
            {/* Glow effect สีเขียว */}
            <div className="absolute inset-0 bg-[#00b359] blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white italic tracking-tighter uppercase">
            UNI<span className="text-[#00b359]">BET</span>
          </span>
        </Link>
      </div>

      {/* 3. Right Section: Wallet & Actions */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* --- 💰 Wallet Container: เปลี่ยนเป็นโทนเขียวมืด (022c1e) --- */}
        <div className="bg-[#022c1e] border border-[#044630] hover:border-[#00b359]/50 pl-3 sm:pl-4 pr-1.5 py-1.5 rounded-2xl flex items-center gap-4 transition-all duration-300">
          <div className="flex flex-col items-start">
            <span className="text-[8px] text-emerald-400/70 uppercase font-black tracking-widest leading-none mb-1">Available Balance</span>
            <div className="flex items-center gap-1.5 text-white font-mono font-bold text-sm sm:text-base leading-none">
              <span className="text-[#00b359] font-sans text-xs">฿</span>
              {mounted ? formattedBalance : "0.00"}
            </div>
          </div>
          
          {/* Quick Deposit Button (+) เปลี่ยนเป็นสีเขียวมรกต */}
          <Link href="/deposit" className="w-8 h-8 sm:w-9 sm:h-9 bg-[#00b359] hover:bg-white text-[#013323] rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[#00b359]/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </Link>
        </div>

        {/* --- 📜 Action Buttons (Outline Style) --- */}
        <div className="flex items-center gap-2">
          {/* History Button: เปลี่ยน Hover เป็นสีเขียว */}
          <Link href="/history" className="p-2.5 text-emerald-100/50 hover:text-[#00b359] hover:bg-[#034a31] rounded-xl transition-all group relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#022c1e] border border-[#044630] text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400 pointer-events-none uppercase font-bold tracking-tighter">History</span>
          </Link>
          
          {/* Profile Button: ปรับ Border และสี Hover */}
          <Link href="/profile" className="w-10 h-10 border border-[#044630] hover:border-[#00b359]/50 bg-[#022c1e] rounded-2xl flex items-center justify-center text-emerald-100/50 hover:text-white transition-all overflow-hidden group">
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