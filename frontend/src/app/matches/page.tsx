"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, Trophy, Zap, Trash2 } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import BetSlipModal from "@/components/BetSlipModal";
import Header from "@/components/Header";

export default function MixplayPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // คำนวณค่าน้ำรวม (Total Multiplier) สำหรับบอลชุด
  const totalOdds = useMemo(() => {
    if (selectedBets.length === 0) return 0;
    // สูตรคำนวณราคาพม่ามักจะเป็นการนำค่าน้ำมาสัมพันธ์กัน หรือถ้าเป็นแบบสากลคือการคูณกัน
    // ในที่นี้ขอโชว์เป็นจำนวนคู่ไปก่อน หรือคำนวณตาม Logic ค่าน้ำที่คุณต้องการ
    return selectedBets.length; 
  }, [selectedBets]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://htayapi.com/mmk-autokyay/v3/moung?key=eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke");
      const json = await res.json();
      if (json.status === "success" && json.data) setMatches(json.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleBetClick = (match: any, side: string, type: string, oddsValue: string | number, teamName: string, hdp: string) => {
    const matchId = match.id.toString();
    
    setSelectedBets(prev => {
      // ตรวจสอบว่าคู่นี้ถูกเลือกไปแล้วหรือยัง (Mixplay 1 คู่เลือกได้แค่ 1 อย่าง)
      const isExistSameType = prev.find(b => b.matchId === matchId && b.type === type && b.side === side);
      
      if (isExistSameType) {
        return prev.filter(b => !(b.matchId === matchId && b.type === type));
      }

      // ลบราคาอื่นในคู่เดียวกันออกก่อนเพิ่มราคาใหม่ (เพื่อให้ 1 คู่มีแค่ 1 รายการในโพยชุด)
      const filtered = prev.filter(b => b.matchId !== matchId);
      
      return [...filtered, {
        id: `${matchId}-${type}`, 
        matchId, 
        homeName: match.home_team, 
        awayName: match.away_team,
        side, type, odds: oddsValue, teamName, hdp, 
        league: match.league_name
      }];
    });
  };

  const groupedData = useMemo(() => {
    if (!matches || matches.length === 0) return {};
    return matches.reduce((acc: any, item: any) => {
      const name = item?.league_name || "OTHERS";
      if (!acc[name]) acc[name] = [];
      acc[name].push(item);
      return acc;
    }, {});
  }, [matches]);

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-40 font-sans relative">
      <Header />
      
      <div className="max-w-[98%] xl:max-w-[1600px] mx-auto px-2 md:px-6 pt-12">
        {/* Banner บอกว่าเป็นหน้า Mixplay */}
        <div className="mb-8 flex items-center justify-between bg-emerald-900/30 p-4 rounded-2xl border border-emerald-500/20">
          <div>
            <h1 className="text-xl md:text-3xl font-[1000] italic text-emerald-400 uppercase">Mixplay </h1>
          </div>
          <button onClick={fetchData} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <Clock size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Match List */}
        <div className="space-y-12">
           {Object.entries(groupedData).map(([leagueName, leagueMatches]: any) => (
             <section key={leagueName}>
               <h2 className="mb-6 font-black italic uppercase text-emerald-400/80 tracking-widest text-center">--- {leagueName} ---</h2>
               <div className="grid grid-cols-1 gap-6">
                 {leagueMatches.map((match: any) => (
                   <MatchCard key={match.id} match={match} onBetClick={handleBetClick} selectedBets={selectedBets} />
                 ))}
               </div>
             </section>
           ))}
        </div>
      </div>

      {/* 🚀 Floating "Mixplay" Slip Button */}
      {selectedBets.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[90] w-full max-w-md px-4">
          <button 
            onClick={() => setIsSlipOpen(true)}
            className="w-full bg-emerald-500 text-[#013323] py-5 rounded-3xl font-[1000] italic uppercase shadow-[0_20px_50px_rgba(16,185,129,0.5)] flex items-center justify-between px-8 hover:scale-[1.02] active:scale-95 transition-all border-b-4 border-[#107a58]"
          >
            <div className="flex items-center gap-3">
              <div className="bg-[#013323] text-emerald-400 w-8 h-8 rounded-xl flex items-center justify-center text-sm">
                {selectedBets.length}
              </div>
              <span className="text-sm md:text-base">ตรวจสอบโพยชุด</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] opacity-70">MIXPLAY MODE</span>
              <Zap size={20} fill="currentColor" />
            </div>
          </button>
        </div>
      )}

      <BetSlipModal 
        bets={selectedBets} 
        isOpen={isSlipOpen} 
        setIsOpen={setIsSlipOpen}
        onRemove={(id) => setSelectedBets(prev => prev.filter(b => b.id !== id))}
        onClear={() => { setSelectedBets([]); setIsSlipOpen(false); }}
      />
    </main>
  );
}