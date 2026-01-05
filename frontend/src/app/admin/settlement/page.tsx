"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Trophy, Swords, Zap, Activity, ChevronRight, Calculator } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function SettlementPage() {
  const { data: matches, mutate, isLoading } = useSWR("/admin/matches/pending-settle", fetcher);
  const [scores, setScores] = useState<any>({});

  const handleScoreChange = (matchId: number, field: string, value: string) => {
    setScores({ ...scores, [matchId]: { ...scores[matchId], [field]: parseInt(value) } });
  };

  const swalConfig = {
    background: '#022c1e',
    color: '#fff',
    confirmButtonColor: '#00b359',
    cancelButtonColor: 'transparent',
  };

  const submitSettlement = async (match: any) => {
    const score = scores[match.id];
    if (score?.home === undefined || score?.away === undefined) {
      return Swal.fire({ 
        icon: 'warning', 
        title: 'MISSING SCORES', 
        text: 'กรุณากรอกคะแนนให้ครบถ้วนก่อนตัดสินผล',
        ...swalConfig 
      });
    }

    const result = await Swal.fire({
      title: 'CONFIRM SETTLEMENT?',
      html: `
        <div class="text-left bg-[#013323] p-6 rounded-[2rem] border border-[#044630] mt-4 shadow-2xl">
          <p class="text-emerald-400/30 text-[9px] uppercase font-[1000] tracking-[0.3em] mb-4">Official Score Entry</p>
          <div class="flex justify-between items-center gap-4">
             <div class="text-right flex-1">
                <p class="text-white font-[1000] italic uppercase text-sm truncate">${match.home_team}</p>
             </div>
             <div class="bg-white/10 px-6 py-2 rounded-2xl border border-white/10">
                <span class="text-3xl font-[1000] text-[#00b359] tracking-tighter">${score.home} - ${score.away}</span>
             </div>
             <div class="text-left flex-1">
                <p class="text-white font-[1000] italic uppercase text-sm truncate">${match.away_team}</p>
             </div>
          </div>
          <div class="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
             <p class="text-rose-400 text-[10px] font-bold text-center">⚠️ การตัดสินผลจะโอนเครดิตให้ผู้ชนะทันที ไม่สามารถยกเลิกได้</p>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'SETTLE & PAYOUT',
      cancelButtonText: 'ABORT',
      ...swalConfig
    });

    if (result.isConfirmed) {
      Swal.fire({ title: 'Processing Payouts...', didOpen: () => Swal.showLoading(), ...swalConfig });
      try {
        const res = await apiFetch(`/admin/settle/${match.id}`, {
          method: 'POST',
          body: JSON.stringify({ home_score: score.home, away_score: score.away })
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: 'PAYOUT FINALIZED', 
            text: 'ระบบกระจายเครดิตให้ผู้ชนะเรียบร้อยแล้ว',
            timer: 2000, 
            showConfirmButton: false,
            ...swalConfig 
          });
          mutate();
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'SYSTEM ERROR', text: 'ไม่สามารถสรุปผลได้ กรุณาลองใหม่', ...swalConfig });
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
             <div className="w-2 h-2 rounded-full bg-[#00b359] animate-pulse"></div>
             <p className="text-emerald-400/40 text-[10px] font-[1000] uppercase tracking-[0.4em]">Settlement Engine</p>
          </div>
          <h1 className="text-5xl font-[1000] uppercase italic tracking-tighter text-white">
            Result <span className="text-[#00b359]">Manager</span>
          </h1>
        </div>
        
        <div className="flex gap-4">
            <div className="bg-[#022c1e] border border-[#044630] px-6 py-4 rounded-2xl flex items-center gap-4">
                <Activity size={20} className="text-[#00b359]" />
                <div>
                    <p className="text-emerald-400/30 text-[8px] font-black uppercase tracking-widest">Pending Matches</p>
                    <p className="text-xl font-black text-white italic leading-none">{matches?.length || 0}</p>
                </div>
            </div>
        </div>
      </div>

      <div className="grid gap-6">
        {isLoading ? (
          <div className="py-32 text-center bg-[#022c1e]/50 rounded-[3rem] border border-dashed border-[#044630]">
             <div className="w-12 h-12 border-4 border-[#044630] border-t-[#00b359] rounded-full animate-spin mx-auto mb-6"></div>
             <p className="text-emerald-400/20 font-[1000] uppercase tracking-[0.4em] text-[10px]">Scanning Database...</p>
          </div>
        ) : matches?.length > 0 ? (
          matches.map((match: any) => (
            <div key={match.id} className="group bg-[#022c1e] border border-[#044630] p-1.5 pr-8 rounded-[3rem] hover:border-[#00b359]/30 transition-all duration-500 flex flex-col lg:flex-row items-center gap-10 relative overflow-hidden">
              
              {/* Score Input Interface */}
              <div className="flex-1 flex items-center justify-center gap-8 w-full pl-2">
                <div className="flex-1 text-right">
                  <p className="text-xl font-[1000] text-white italic uppercase tracking-tighter leading-none mb-1">{match.home_team}</p>
                </div>

                <div className="flex items-center gap-4 py-6">
                  <input 
                    type="number" 
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)} 
                    className="..." 
                  />
                  <Swords className="..." size={24} />
                  <input 
                    type="number" 
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)} 
                    className="..." 
                  />
                </div>

                <div className="flex-1 text-left">
                  <p className="text-xl font-[1000] text-white italic uppercase tracking-tighter leading-none mb-1">{match.away_team}</p>
                </div>
              </div>

              {/* Action Side - ปุ่มต้องอยู่ภายในวงเล็บของ map นี้เท่านั้น */}
              <div className="flex items-center gap-8 border-[#044630] p-6 lg:p-0 lg:pl-10">
                <button 
                  onClick={() => submitSettlement(match)} // ตรงนี้จะหา 'match' เจอแน่นอน
                  className="group relative px-12 py-5 bg-white text-[#013323] hover:bg-[#00b359] hover:text-white font-[1000] rounded-[1.8rem] transition-all duration-500 uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 overflow-hidden"
                >
                  <Calculator size={16} />
                  <span>Confirm Result</span>
                </button>
              </div>

              <span className="absolute -bottom-4 -left-2 text-[80px] font-[1000] text-white/[0.02] italic select-none">
                #{match.id}
              </span>
            </div>
          )) // ปิด map ตรงนี้
        ) : (
          <div className="text-center py-40 ...">
            <Trophy size={32} />
            <p>All Matches Settled</p>
          </div>
        )}
      </div>
      </div>
  );
}