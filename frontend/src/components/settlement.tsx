"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function SettlementPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    apiFetch("/agent/settlements")
      .then(res => res.json())
      .then(json => setData(json));
  }, []);

  if (!data) return <div className="text-white">กำลังคำนวณยอด...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Settlement Summary</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* บัตรสรุปฝั่งซ้าย: ยอดของลูกทีม */}
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] space-y-4">
          <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Downline Performance</p>
          <div>
            <p className="text-sm text-zinc-400">Total Turnover (ยอดเล่นรวม)</p>
            <p className="text-2xl font-bold text-white">฿{data.total_turnover.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-400">Total Win/Loss (แพ้-ชนะรวม)</p>
            <p className={`text-2xl font-bold ${data.total_win_loss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ฿{data.total_win_loss.toLocaleString()}
            </p>
          </div>
        </div>

        {/* บัตรสรุปฝั่งขวา: ยอดที่เอเย่นต์ได้รับจริง */}
        <div className="bg-white p-8 rounded-[2.5rem] space-y-4 text-black">
          <p className="text-zinc-500 font-black uppercase text-xs tracking-widest">Your Profit / Loss</p>
          <div>
            <p className="text-sm font-bold">Your Share (กำไรจากหุ้น)</p>
            <p className="text-3xl font-black">฿{data.agent_share_amt.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-bold">Commission (ค่าคอมมิชชั่น)</p>
            <p className="text-xl font-bold">+ ฿{data.agent_com_amt.toLocaleString()}</p>
          </div>
          <div className="pt-4 border-t border-black/10">
            <p className="text-xs font-black uppercase">Net Settlement (ยอดเคลียร์สุทธิ)</p>
            <p className="text-4xl font-black text-blue-600">฿{data.net_settlement.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-950 border border-yellow-500/30 p-6 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500">⚠️</div>
        <p className="text-sm text-zinc-400 font-medium">
          ยอดนี้เป็นยอดประมาณการเบื้องต้น การตัดรอบบัญชีจริงจะเกิดขึ้นทุกวันจันทร์ เวลา 12:00 น.
        </p>
      </div>
    </div>
  );
}