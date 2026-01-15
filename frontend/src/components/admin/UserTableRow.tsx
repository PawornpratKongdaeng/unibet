"use client";
import React from "react";
import { User as UserIcon } from "lucide-react";

export const UserTableRow = ({ user, onDetail, onCredit, onToggleLock, onEdit, onDelete }: any) => {
  const isLocked = user.status === "locked";

  return (
    <>
      <tr className="hover:bg-slate-50/50 transition-all border-b border-slate-100 group">
        {/* 1. NAME */}
        <td className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shrink-0">
              <UserIcon size={14} className="sm:w-4 sm:h-4" />
            </div>
            <span className="font-[1000] text-slate-800 text-xs sm:text-sm uppercase tracking-tighter">
              {user.first_name|| "UNNAMED PLAYER"}
            </span>
          </div>
        </td>

        {/* 2. USER NAME */}
        <td className="px-4 sm:px-6 py-4 sm:py-5">
          <span className="text-sm font-bold text-slate-700">{user.username || "-"}</span>
        </td>

        {/* 3. CURRENT AMOUNT */}
        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
          <span className="font-[1000] text-base sm:text-lg text-slate-900">
            {Number(user.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </td>

        {/* 4. ACTION */}
        <td className="px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <button 
              onClick={() => onCredit(user, 'deposit')} 
              className="h-8 px-3 bg-emerald-500 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-emerald-600 transition-all shadow-sm"
            >
              Deposit
            </button>
            <button 
              onClick={() => onCredit(user, 'withdraw')} 
              className="h-8 px-3 bg-sky-500 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-sky-600 transition-all shadow-sm"
            >
              Withdraw
            </button>
            <button 
              onClick={() => onDetail(user)} 
              className="h-8 px-3 bg-slate-700 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-slate-800 transition-all shadow-sm"
            >
              Detail
            </button>
            <button 
  onClick={() => onEdit(user)} 
  // เปลี่ยนจาก bg-sky-400 เป็น bg-indigo-500 เพื่อความชัดเจน
  className="h-8 px-3 bg-indigo-500 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-indigo-600 transition-all shadow-sm flex items-center justify-center"
>
  Edit
</button>
            <button 
              onClick={() => onToggleLock(user)} 
              className="h-8 px-3 bg-rose-500 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-rose-600 transition-all shadow-sm"
            >
              {isLocked ? "Unlock" : "Lock"}
            </button>
            {onDelete && (
              <button 
                onClick={() => onDelete(user)} 
                className="h-8 px-3 bg-rose-600 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-rose-700 transition-all shadow-sm"
              >
                Delete
              </button>
            )}
          </div>
        </td>

        {/* 5. PHONE */}
        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
          <span className="text-sm font-bold text-slate-600">{user.phone || "-"}</span>
        </td>
      </tr>

    </>
  );
};