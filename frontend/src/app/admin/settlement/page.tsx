"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function SettlementPage() {
  const { data: matches, mutate, isLoading } = useSWR("/admin/matches/pending-settle", fetcher);
  const [scores, setScores] = useState<any>({});

  const handleScoreChange = (matchId: number, field: string, value: string) => {
    setScores({ ...scores, [matchId]: { ...scores[matchId], [field]: parseInt(value) } });
  };

  const submitSettlement = async (match: any) => {
    const score = scores[match.id];
    if (score?.home === undefined || score?.away === undefined) {
      return Swal.fire("กรุณากรอกสกอร์", "ต้องระบุผลการแข่งขันทั้งสองฝั่ง", "warning");
    }

    const confirm = await Swal.fire({
      title: 'ยืนยันการเคลียร์บิล?',
      html: `<p className="text-sm">คู่ ${match.home_team} vs ${match.away_team}</p><p className="text-xl font-black text-amber-500">${score.home} - ${score.away}</p>`,
      showCancelButton: true,
      confirmButtonText: 'SETTLE NOW',
      background: '#09090b', color: '#fff'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/settle/${match.id}`, {
          method: 'POST',
          body: JSON.stringify({ home_score: score.home, away_score: score.away })
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'เคลียร์บิลเรียบร้อย!', timer: 1500, showConfirmButton: false });
          mutate();
        }
      } catch (err) {
        Swal.fire("Error", "เกิดข้อผิดพลาดในการคำนวณ", "error");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-black uppercase italic italic tracking-tighter">Match <span className="text-amber-500">Settlement</span></h1>
        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">ตัดสินผลแพ้-ชนะและกระจายเครดิต</p>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-20 text-zinc-600 animate-pulse font-black uppercase">Loading Matches...</div>
        ) : matches?.length > 0 ? (
          matches.map((match: any) => (
            <div key={match.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[2rem] flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1 grid grid-cols-3 items-center gap-4 text-center">
                <span className="text-lg font-black text-white">{match.home_team}</span>
                <div className="flex justify-center items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="0"
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                    className="w-16 h-16 bg-black border border-zinc-700 rounded-2xl text-center text-2xl font-black text-amber-500 focus:border-amber-500 outline-none"
                  />
                  <span className="text-zinc-700 font-black">VS</span>
                  <input 
                    type="number" 
                    placeholder="0"
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                    className="w-16 h-16 bg-black border border-zinc-700 rounded-2xl text-center text-2xl font-black text-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
                <span className="text-lg font-black text-white">{match.away_team}</span>
              </div>

              <div className="w-full lg:w-px h-px lg:h-12 bg-zinc-800"></div>

              <div className="flex flex-col items-center lg:items-start">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Active Bets</p>
                <p className="text-xl font-black text-white">{match.total_bets || 0} <span className="text-xs text-zinc-600">Tickets</span></p>
              </div>

              <button 
                onClick={() => submitSettlement(match)}
                className="w-full lg:w-auto px-10 py-4 bg-white text-black hover:bg-amber-400 font-black rounded-2xl transition-all uppercase text-xs tracking-widest"
              >
                Settle Results
              </button>
            </div>
          ))
        ) : (
          <div className="py-20 bg-zinc-900/20 border-2 border-dashed border-zinc-900 rounded-[3rem] text-center text-zinc-600 font-black uppercase">No pending matches to settle</div>
        )}
      </div>
    </div>
  );
}