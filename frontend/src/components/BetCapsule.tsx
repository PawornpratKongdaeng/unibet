"use client";
import React from "react";
import { Ticket, ChevronRight } from "lucide-react";

interface BetCapsuleProps {
  count: number;        // จำนวนคู่ที่เลือกปัจจุบัน
  minBets: number;      // ขั้นต่ำ (เช่น 2)
  onClick: () => void;  // ฟังก์ชันเมื่อกดปุ่ม
}

export default function BetCapsule({ count, minBets, onClick }: BetCapsuleProps) {
  // ถ้ายังไม่เลือกอะไรเลย ไม่ต้องแสดง
  if (count === 0) return null;

  const isValid = count >= minBets;
  const needed = minBets - count;

  return (
    <div className="fixed bottom-8 left-0 right-0 z-[2000] flex justify-center pointer-events-none animate-in slide-in-from-bottom-4 fade-in duration-300">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="pointer-events-auto cursor-pointer bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-full p-2 pl-3 flex items-center justify-between gap-4 w-auto min-w-[300px] max-w-[90%] hover:scale-[1.02] active:scale-95 transition-all duration-200 ring-1 ring-white/5 group"
      >
        {/* ฝั่งซ้าย: Info & Status */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-lg shadow-lg border border-white/20 transition-all ${
                isValid
                  ? "bg-gradient-to-br from-[#008de3] to-[#005f99] text-white group-hover:rotate-12"
                  : "bg-slate-700 text-slate-400"
              }`}
            >
              {count}
            </div>

            {!isValid && (
              <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-slate-900 animate-bounce">
                !
              </div>
            )}
          </div>

          <div className="flex flex-col items-start">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              Mix Parlay
            </span>
            <span
              className={`text-sm font-bold truncate ${
                isValid ? "text-white" : "text-slate-300"
              }`}
            >
              {isValid ? "พร้อมเดิมพัน" : `ขาดอีก ${needed} คู่`}
            </span>
          </div>
        </div>

        {/* ฝั่งขวา: Action Visual */}
        <div className="pr-1">
          <div
            className={`h-10 px-6 rounded-full font-bold text-xs text-white shadow-md whitespace-nowrap transition-all flex items-center gap-2 ${
              isValid
                ? "bg-emerald-500 group-hover:bg-emerald-600 shadow-emerald-500/20"
                : "bg-slate-700 text-slate-400"
            }`}
          >
            {isValid ? (
              <>
                <Ticket size={16} className="fill-white/20" />
                ดูบิล
                <ChevronRight size={14} className="animate-pulse" />
              </>
            ) : (
              "ยังไม่ครบ"
            )}
          </div>
        </div>
      </button>
    </div>
  );
}