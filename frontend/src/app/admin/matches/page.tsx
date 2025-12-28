"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminMatchSettlement() {
  const { data: matches, mutate } = useSWR("/admin/matches?status=open", fetcher);

  const handleSettle = async (match: any) => {
    const { value: formValues } = await Swal.fire({
      title: 'กรอกผลการแข่งขัน',
      html: `
        <div class="flex gap-4 justify-center items-center text-black">
          <input id="home" type="number" placeholder="Home" class="swal2-input w-20">
          <span class="text-white font-black">-</span>
          <input id="away" type="number" placeholder="Away" class="swal2-input w-20">
        </div>
      `,
      focusConfirm: false,
      background: '#09090b', color: '#fff',
      preConfirm: () => {
        return {
          home: (document.getElementById('home') as HTMLInputElement).value,
          away: (document.getElementById('away') as HTMLInputElement).value
        }
      }
    });

    if (formValues) {
      const res = await apiFetch("/admin/settle", {
        method: "POST",
        body: JSON.stringify({
          match_id: match.id,
          home_score: parseInt(formValues.home),
          away_score: parseInt(formValues.away)
        })
      });

      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'สรุปผลสำเร็จ จ่ายเงินเรียบร้อย', background: '#09090b', color: '#fff' });
        mutate();
      }
    }
  };

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-4xl font-black uppercase italic italic text-white">Match <span className="text-zinc-600">Settlement</span></h1>
      
      <div className="grid gap-4">
        {matches?.map((match: any) => (
          <div key={match.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex justify-between items-center group hover:border-zinc-500 transition-all">
            <div className="flex items-center gap-8">
              <div className="text-right w-32">
                <p className="font-black text-lg uppercase">{match.home_team}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Home</p>
              </div>
              <div className="bg-zinc-800 px-4 py-2 rounded-xl font-black text-xl italic text-amber-400">VS</div>
              <div className="text-left w-32">
                <p className="font-black text-lg uppercase">{match.away_team}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Away</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-zinc-500 font-black uppercase tracking-widest">Total Bets</p>
                <p className="text-xl font-black">{match.bet_count || 0}</p>
              </div>
              <button 
                onClick={() => handleSettle(match)}
                className="bg-white text-black px-8 py-3 rounded-2xl font-black uppercase text-xs tracking-tighter hover:bg-amber-400 transition-colors"
              >
                Enter Score & Settle
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}