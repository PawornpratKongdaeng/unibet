"use client";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronUp } from "lucide-react";

interface BetCapsuleProps {
  count: number;
  onOpen: () => void;
}

export default function BetCapsule({ count, onOpen }: BetCapsuleProps) {
  const [mounted, setMounted] = useState(false);
  const [amount, setAmount] = useState(""); 

  useEffect(() => {
    setMounted(true);
    // เช็คว่า Function นี้ทำงานไหม
    console.log("BetCapsule Mounted!"); 
  }, []);

  if (!mounted) return null;

  // ตรวจสอบว่า document.body มีอยู่จริง (กันเหนียว)
  if (typeof document === "undefined") return null;

  return createPortal(
    // 🔴 1. ลบ animate-in ออก
    // 🔴 2. ใส่ z-[99999] ให้สูงสุด
    // 🔴 3. ใส่ bg-red-500 ชั่วคราวเพื่อให้เห็นว่ามันอยู่ตรงไหน (ถ้าเห็นแล้วค่อยแก้กลับ)
    <div className="fixed bottom-4 left-0 right-0 z-[99999] flex justify-center pointer-events-none">
      
      <div className="pointer-events-auto flex items-center gap-2 p-2 bg-[#2d3748] rounded-full shadow-2xl border border-white/20">
        
        {/* ส่วนแสดงจำนวน */}
        {count > 0 && (
          <div className="flex items-center justify-center min-w-[30px] h-[30px] bg-emerald-500 rounded-full text-white text-xs font-bold px-2">
            {count}
          </div>
        )}


        {/* ปุ่ม Confirm */}
        <button
          onClick={onOpen}
          className="h-10 px-4 bg-blue-600 rounded-full font-bold text-white flex items-center gap-1"
        >
          <span>โพย</span>
          <ChevronUp size={16} />
        </button>

      </div>
    </div>,
    document.body
  );
}