"use client";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Gift, Percent, Trash2, Edit3, Plus, Power } from "lucide-react";

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
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">
            Campaign <span className="text-rose-500">Center</span>
          </h1>
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">บริหารจัดการโบนัสและข้อเสนอพิเศษ</p>
        </div>
        <button className="flex items-center gap-3 px-8 py-4 bg-white text-black font-black rounded-2xl hover:bg-rose-500 hover:text-white transition-all uppercase text-[10px] tracking-widest shadow-lg">
          <Plus size={16} strokeWidth={3} /> Create Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {promos?.map((promo: any) => (
          <div key={promo.id} className={`group relative p-8 rounded-[3rem] border transition-all duration-500 ${promo.status === 'active' ? 'bg-zinc-900/40 border-zinc-800 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-zinc-950 border-zinc-900 opacity-50 grayscale'}`}>
            
            <div className="flex justify-between items-start mb-8">
               <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${promo.status === 'active' ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 'bg-zinc-800 text-zinc-600'}`}>
                  {promo.bonus_type === 'percent' ? <Percent size={24} strokeWidth={3} /> : <Gift size={24} strokeWidth={3} />}
               </div>
               <button onClick={() => toggleStatus(promo.id, promo.status)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-tighter border transition-all ${promo.status === 'active' ? 'border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white' : 'border-zinc-800 text-zinc-700'}`}>
                 <Power size={12} /> {promo.status}
               </button>
            </div>
            
            <h3 className="text-2xl font-black text-white mb-2 italic uppercase tracking-tighter">{promo.name}</h3>
            <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-8 h-10 overflow-hidden line-clamp-2">{promo.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-900/50">
                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest block mb-1">Bonus</span>
                <span className="text-lg font-black text-white italic">{promo.bonus_type === 'percent' ? `${promo.bonus_value}%` : `฿${promo.bonus_value}`}</span>
              </div>
              <div className="bg-black/40 p-4 rounded-2xl border border-zinc-900/50">
                <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest block mb-1">Turnover</span>
                <span className="text-lg font-black text-rose-500 italic">{promo.turnover_multiplier}X</span>
              </div>
            </div>

            <div className="flex gap-3">
               <button className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                 <Edit3 size={14} /> Edit
               </button>
               <button className="p-4 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all">
                 <Trash2 size={18} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}