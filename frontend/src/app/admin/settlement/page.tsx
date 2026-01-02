"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Trophy, Swords, Zap } from "lucide-react";

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
      return Swal.fire({ icon: 'warning', title: 'MISSING SCORES', text: 'กรุณากรอกคะแนนให้ครบถ้วน', background: '#09090b', color: '#fff' });
    }

    const confirm = await Swal.fire({
      title: 'CONFIRM SETTLEMENT?',
      html: `
        <div class="p-6 bg-zinc-950 rounded-3xl border border-zinc-900 mt-4">
          <p class="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-4">Official Result</p>
          <div class="flex justify-between items-center px-4">
             <span class="text-white font-black italic uppercase">${match.home_team}</span>
             <span class="text-4xl font-black text-white px-6">${score.home} - ${score.away}</span>
             <span class="text-white font-black italic uppercase">${match.away_team}</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'SETTLE & PAYOUT',
      confirmButtonColor: '#f43f5e',
      background: '#09090b', color: '#fff'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/settle/${match.id}`, {
          method: 'POST',
          body: JSON.stringify({ home_score: score.home, away_score: score.away })
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'PAYOUT SUCCESSFUL', timer: 1500, showConfirmButton: false });
          mutate();
        }
      } catch (err) {
        Swal.fire("Error", "FAILED TO SETTLE", "error");
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white">
          Match <span className="text-rose-500">Settlement</span>
        </h1>
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">ตัดสินผลแพ้-ชนะและกระจายเครดิตเข้าระบบ</p>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="text-center py-20 animate-pulse text-zinc-700 font-black uppercase tracking-widest">Awaiting Matches...</div>
        ) : matches?.length > 0 ? (
          matches.map((match: any) => (
            <div key={match.id} className="bg-zinc-950 border border-zinc-900 p-8 rounded-[3rem] flex flex-col lg:flex-row items-center gap-10 hover:border-zinc-800 transition-all group">
              
              <div className="flex-1 flex items-center justify-center gap-8 w-full">
                <div className="flex-1 text-right">
                  <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{match.home_team}</p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase mt-1">Home Team</p>
                </div>

                <div className="flex items-center gap-3">
                  <input type="number" placeholder="0" onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)} className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-4xl font-black text-white focus:border-rose-500 outline-none transition-all shadow-inner" />
                  <Swords className="text-zinc-800 group-hover:text-rose-500/50 transition-colors" />
                  <input type="number" placeholder="0" onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)} className="w-20 h-24 bg-zinc-900 border-2 border-zinc-800 rounded-3xl text-center text-4xl font-black text-white focus:border-rose-500 outline-none transition-all shadow-inner" />
                </div>

                <div className="flex-1 text-left">
                  <p className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{match.away_team}</p>
                  <p className="text-[10px] font-black text-zinc-600 uppercase mt-1">Away Team</p>
                </div>
              </div>

              <div className="flex items-center gap-10 w-full lg:w-auto">
                <div className="text-center lg:text-left px-6 border-l border-zinc-900">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Total Stake</p>
                  <div className="flex items-center gap-2">
                     <Zap size={14} className="text-rose-500" />
                     <p className="text-2xl font-black text-white italic">{match.total_bets || 0}</p>
                  </div>
                </div>
                <button onClick={() => submitSettlement(match)} className="flex-1 lg:flex-none px-12 py-5 bg-white text-black hover:bg-rose-500 hover:text-white font-black rounded-[2rem] transition-all uppercase text-[10px] tracking-widest shadow-xl">
                  Settle Results
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-24 bg-zinc-950/50 border-2 border-dashed border-zinc-900 rounded-[3rem] text-center">
             <Trophy size={48} className="mx-auto text-zinc-800 mb-4" />
             <p className="text-zinc-700 font-black uppercase tracking-widest">No Matches Awaiting Settlement</p>
          </div>
        )}
      </div>
    </div>
  );
}