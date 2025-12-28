"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

export default function PromotionPage() {
  const { data: promos, mutate } = useSWR("/admin/promotions", (url) => apiFetch(url).then(res => res.json()));

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await apiFetch(`/admin/promotions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    mutate();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">
            Promotion <span className="text-zinc-500">Settings</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">สร้างเงื่อนไขและโบนัสสำหรับสมาชิก</p>
        </div>
        <button className="px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-amber-400 transition-all uppercase text-xs">
          + Create New Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos?.map((promo: any) => (
          <div key={promo.id} className={`p-8 rounded-[2.5rem] border transition-all ${promo.status === 'active' ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-950 border-zinc-900 opacity-60'}`}>
            <div className="flex justify-between items-start mb-6">
               <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-2xl">🎁</div>
               <button 
                 onClick={() => toggleStatus(promo.id, promo.status)}
                 className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${promo.status === 'active' ? 'border-emerald-500 text-emerald-500' : 'border-zinc-700 text-zinc-700'}`}
               >
                 {promo.status}
               </button>
            </div>
            
            <h3 className="text-xl font-black text-white mb-2">{promo.name}</h3>
            <p className="text-zinc-500 text-sm font-medium mb-6">{promo.description}</p>
            
            <div className="space-y-3 mb-8">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-zinc-600">Bonus Amount:</span>
                <span className="text-white">{promo.bonus_type === 'percent' ? `${promo.bonus_value}%` : `฿${promo.bonus_value}`}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-zinc-600">Turnover Req:</span>
                <span className="text-white text-lg">{promo.turnover_multiplier}X</span>
              </div>
            </div>

            <div className="flex gap-2">
               <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-[10px] uppercase transition-all">Edit</button>
               <button className="px-4 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase transition-all">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}