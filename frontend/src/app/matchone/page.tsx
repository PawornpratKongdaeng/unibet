"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Clock, Trophy, MousePointer2, RefreshCcw, Zap } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import BetSlipModal from "@/components/BetSlipModal";
import Header from "@/components/Header";

export default function SingleBetPage() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("https://htayapi.com/mmk-autokyay/v3/moung?key=eXBW5dl32piS2UbN75U1vikjWJJ9v7Ke");
      const json = await res.json();
      if (json.status === "success" && json.data) setMatches(json.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Logic สำหรับบอลเต็ง (Single Bet) ---
  const handleBetClick = (match: any, side: string, type: string, oddsValue: string | number, teamName: string, hdp: string) => {
    const betId = `${match.id}-${type}`;
    
    // เลือกได้แค่รายการเดียว: แทนที่ค่าเดิมทันที
    setSelectedBets([{
      id: betId,
      matchId: match.id.toString(),
      homeName: match.home_team,
      awayName: match.away_team,
      side,
      type,
      odds: oddsValue,
      teamName,
      hdp,
      league: match.league_name
    }]);

    // เปิด Slip ทันทีเพื่อความรวดเร็วตามสไตล์บอลเต็ง
    setIsSlipOpen(true);
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
        
        {/* Banner Section - ดีไซน์เดียวกับ Mixplay */}
        <div className="mb-8 flex items-center justify-between bg-emerald-900/30 p-6 rounded-[2rem] border border-emerald-500/20 shadow-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
              <h1 className="text-xl md:text-3xl font-[1000] italic text-white uppercase tracking-tighter">
                Handicap & Over/Under
              </h1>
            </div>
          </div>
          
          <button 
            onClick={fetchData} 
            className="p-4 bg-white/5 rounded-full hover:bg-emerald-500 hover:text-[#013323] transition-all duration-300 border border-white/10 shadow-lg group"
          >
            <RefreshCcw size={22} className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform`} />
          </button>
        </div>

        {/* Match List - ปรับเป็นคอลัมน์เดียวแผ่กว้างเหมือน Mixplay */}
        <div className="space-y-12">
           {Object.entries(groupedData).map(([leagueName, leagueMatches]: any) => (
             <section key={leagueName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
               {/* League Header Style */}
               <div className="flex items-center gap-4 mb-6">
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                 <h2 className="font-[1000] italic uppercase text-emerald-400/90 text-sm md:text-lg tracking-[0.3em] whitespace-nowrap">
                   {leagueName}
                 </h2>
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
               </div>

               {/* Full Width Grid */}
               <div className="grid grid-cols-1 gap-6">
                 {leagueMatches.map((match: any) => (
                   <MatchCard 
                     key={match.id} 
                     match={match} 
                     onBetClick={handleBetClick} 
                     selectedBets={selectedBets} 
                   />
                 ))}
               </div>
             </section>
           ))}
        </div>
      </div>

      {/* 🚀 Floating "Open Slip" Button - แสดงเมื่อเลือกแล้วแต่ปิด Modal ไป */}
      {selectedBets.length > 0 && !isSlipOpen && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[90] animate-in zoom-in duration-300">
          <button 
            onClick={() => setIsSlipOpen(true)}
            className="bg-orange-500 text-white px-8 py-4 rounded-full font-black italic uppercase text-sm shadow-[0_15px_40px_rgba(249,115,22,0.4)] flex items-center gap-3 border-2 border-orange-400 hover:scale-110 active:scale-95 transition-all"
          >
            <MousePointer2 size={18} />
            เปิดโพยที่ค้างไว้
          </button>
        </div>
      )}

      {/* Bet Slip Modal */}
      <BetSlipModal 
        bets={selectedBets} 
        isOpen={isSlipOpen} 
        setIsOpen={setIsSlipOpen}
        onRemove={() => setSelectedBets([])}
        onClear={() => { setSelectedBets([]); setIsSlipOpen(false); }}
      />
    </main>
  );
}