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

      {/* Match List */}
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
                
                {/* Home Team */}
                <div className="flex-1 text-right">
                  <p className="text-xl font-[1000] text-white italic uppercase tracking-tighter leading-none mb-1">{match.home_team}</p>
                  <p className="text-[9px] font-black text-emerald-400/20 uppercase tracking-widest">Host</p>
                </div>

                {/* VS / Input Box */}
                <div className="flex items-center gap-4 py-6">
                  <input 
                    type="number" 
                    placeholder="0" 
                    onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)} 
                    className="w-20 h-24 bg-[#013323] border-2 border-[#044630] rounded-[1.8rem] text-center text-4xl font-[1000] text-white focus:border-[#00b359] focus:ring-4 focus:ring-[#00b359]/10 outline-none transition-all shadow-2xl placeholder:text-[#044630]" 
                  />
                  <div className="flex flex-col items-center gap-1">
                    <Swords className="text-[#044630] group-hover:text-[#00b359] transition-colors duration-500" size={24} />
                    <span className="text-[8px] font-black text-emerald-400/10 uppercase tracking-tighter">VERSUS</span>
                  </div>
                  <input 
                    type="number" 
                    placeholder="0" 
                    onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)} 
                    className="w-20 h-24 bg-[#013323] border-2 border-[#044630] rounded-[1.8rem] text-center text-4xl font-[1000] text-white focus:border-[#00b359] focus:ring-4 focus:ring-[#00b359]/10 outline-none transition-all shadow-2xl placeholder:text-[#044630]" 
                  />
                </div>

                {/* Away Team */}
                <div className="flex-1 text-left">
                  <p className="text-xl font-[1000] text-white italic uppercase tracking-tighter leading-none mb-1">{match.away_team}</p>
                  <p className="text-[9px] font-black text-emerald-400/20 uppercase tracking-widest">Visitor</p>
                </div>
              </div>

              {/* Action & Stats Side */}
              <div className="flex flex-row lg:flex-col xl:flex-row items-center gap-8 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-[#044630] p-6 lg:p-0 lg:pl-10">
                
                <div className="flex-1 lg:flex-none">
                  <p className="text-[9px] text-emerald-400/30 font-[1000] uppercase tracking-widest mb-1">Total Pool</p>
                  <div className="flex items-center gap-2">
                     <Zap size={14} className="text-[#00b359]" />
                     <p className="text-2xl font-[1000] text-white italic">฿{(match.total_bets || 0).toLocaleString()}</p>
                  </div>
                </div>

                <button 
                  onClick={() => submitSettlement(match)} 
                  className="group relative flex-1 lg:flex-none px-12 py-5 bg-white text-[#013323] hover:bg-[#00b359] hover:text-white font-[1000] rounded-[1.8rem] transition-all duration-500 uppercase text-[10px] tracking-widest shadow-xl flex items-center gap-3 overflow-hidden"
                >
                  <Calculator size={16} />
                  <span className="relative z-10">Confirm Result</span>
                </button>
              </div>

              {/* Background ID Decoration */}
              <span className="absolute -bottom-4 -left-2 text-[80px] font-[1000] text-white/[0.02] italic select-none">
                #{match.id}
              </span>
            </div>
          ))
        ) : (
          <div className="text-center py-40 bg-[#022c1e]/30 rounded-[3.5rem] border-2 border-dashed border-[#044630] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-[#044630]/20 rounded-full flex items-center justify-center text-emerald-400/10">
               <Trophy size={32} />
            </div>
            <p className="text-emerald-400/20 font-[1000] uppercase tracking-[0.4em] text-xs">Stadium Empty: All Matches Settled</p>
          </div>
        )}
      </div>
      <button 
  onClick={() => submitSettlement(match)}
  className="relative group overflow-hidden px-10 py-5 bg-[#00b359] hover:bg-[#00cc66] text-[#013323] font-[1000] rounded-[2rem] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,179,89,0.5)] active:scale-95"
>
  <div className="flex items-center gap-3 relative z-10 uppercase text-[11px] tracking-[0.2em] italic">
    <Calculator size={18} className="group-hover:rotate-12 transition-transform" />
    Authorize Settlement
  </div>
  {/* แสงเงาที่วิ่งผ่านเวลายกเมาส์วาง */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full duration-1000 transition-transform" />
</button>
    </div>
  );
}