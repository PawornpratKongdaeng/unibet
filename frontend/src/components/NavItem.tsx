"use client";
import React from "react";
import { LucideIcon } from "lucide-react"; // ต้อง import Type ตัวนี้มาใช้

interface NavItemProps {
  // เปลี่ยนจาก React.ReactElement เป็น LucideIcon
  // เพื่อให้ TypeScript รู้ว่านี่คือ Icon จาก Lucide ที่รับ size และ strokeWidth ได้
  icon: LucideIcon; 
  label: string;
  sublabel: string;
  active?: boolean;
  onClick: () => void;
}

export default function NavItem({ 
  icon: Icon, // เปลี่ยนชื่อเป็น Icon (ตัวใหญ่) เพื่อใช้เป็น Component
  label, 
  sublabel, 
  active, 
  onClick 
}: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        active
          ? "bg-zinc-900 border-zinc-800 shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          : "bg-transparent border-transparent hover:bg-zinc-900/50 hover:border-zinc-900"
      }`}
    >
      {/* 1. เส้นเรืองแสงด้านข้าง (Active Indicator) */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-rose-500 rounded-r-full shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
      )}

      {/* 2. ส่วนของ Icon */}
      <div className={`p-2 rounded-xl transition-all duration-300 ${
        active 
          ? "text-rose-500 bg-rose-500/10 scale-110" 
          : "text-zinc-600 group-hover:text-zinc-300 group-hover:bg-zinc-800/50"
      }`}>
        {/* เลิกใช้ cloneElement แล้วเรียกใช้เป็น Component ตรงๆ */}
        <Icon 
          size={20} 
          strokeWidth={active ? 2.5 : 2} 
        />
      </div>

      {/* 3. ส่วนของข้อความ */}
      <div className="flex-1 text-left">
        <div className={`text-sm font-black uppercase italic tracking-tighter leading-none transition-colors ${
          active ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
        }`}>
          {label}
        </div>
        <div className={`text-[9px] font-bold uppercase tracking-[0.15em] mt-1 transition-colors ${
          active ? "text-zinc-500" : "text-zinc-700 group-hover:text-zinc-600"
        }`}>
          {sublabel}
        </div>
      </div>

      {/* 4. จุดไฟสถานะด้านขวา */}
      {active && (
        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
      )}
    </button>
  );
}