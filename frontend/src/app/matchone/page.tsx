"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCcw, MousePointer2 } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import BetSlipModal from "@/components/BetSlipModal";
import Header from "@/components/Header"; 

// ✅ 1. ตั้งค่า Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v3";

export default function SingleBetPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // --- 2. ฟังก์ชันดึงข้อมูล ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/match/moung`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "" 
        },
      }); 
      
      if (!res.ok) {
         throw new Error(`Backend Error: ${res.status}`);
      }
  
      const json = await res.json();
      let matchData: any[] = [];
  
      if (json.data && Array.isArray(json.data.matches)) {
          matchData = json.data.matches;
      } else if (Array.isArray(json.data)) {
          matchData = json.data;
      }
  
      setMatches(matchData.length > 0 ? matchData : []);
  
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setMatches([]); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 3. ฟังก์ชันจัดการเมื่อคลิกราคา ---
 // ไฟล์: SingleBetPage.tsx

const handleBetClick = (match: any, side: string, type: string, oddsValue: any, teamName: string, hdp: any) => {
    
  // ✅ แก้ไข: ใช้ match.matchId (ตามที่เห็นใน Log)
  const realMatchId = match.matchId ? match.matchId.toString() : match.id.toString();

  // ... ส่วนอื่นเหมือนเดิม
  const homeName = match.home?.engName || match.home?.name || "Home";
  const awayName = match.away?.engName || match.away?.name || "Away";
  const currentLeague = match.league?.name || "League";

  const newBet = {
    id: `${realMatchId}-${side}-${type}`, // ใช้ realMatchId เป็น Key
    matchId: realMatchId,                 // ✅ ส่งค่าที่ถูกต้อง (354850923) ไป
    homeName: homeName, 
    awayName: awayName,
    side,      
    type,      
    odds: oddsValue,
    teamName: teamName, 
    hdp: hdp?.toString() || "0",
    league: currentLeague
  };

  setSelectedBets([newBet]); 
  setIsSlipOpen(true);
};

  // --- 4. จัดกลุ่มลีก ---
  const groupedData = useMemo(() => {
    if (!matches || matches.length === 0) return {};
    return matches.reduce((acc: any, item: any) => {
      const leagueName = item.league?.name || "OTHERS";
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(item);
      return acc;
    }, {});
  }, [matches]);

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-32 font-sans relative">
      <Header />
      
      {/* Container: ปรับ Padding และ Max-Width ให้ Responsive */}
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 pt-6 md:pt-10">
        
        {/* Banner Section: ปรับให้ยืดหยุ่น (Flex-col บนมือถือ, Flex-row บนจอใหญ่) */}
        <div className="mb-6 md:mb-10 flex flex-row items-center justify-between bg-emerald-900/40 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-emerald-500/20 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-orange-500 rounded-full animate-ping"></div>
              <h1 className="text-lg md:text-3xl font-[1000] italic text-white uppercase tracking-tighter">
                Handicap <span className="text-emerald-400">&</span> Over/Under
              </h1>
            </div>
            <p className="text-emerald-400/60 text-[10px] md:text-xs font-bold uppercase tracking-widest ml-4 md:ml-6">
                Live Myanmar Odds
            </p>
          </div>
          
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-3 md:p-4 bg-white/5 rounded-full hover:bg-emerald-500 hover:text-[#013323] transition-all duration-300 border border-white/10 shadow-lg group disabled:opacity-50"
          >
            <RefreshCcw size={20} className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform md:w-6 md:h-6`} />
          </button>
        </div>

        {/* Matches List */}
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              <div className="text-emerald-500/50 font-black italic text-sm tracking-widest animate-pulse">LOADING DATA...</div>
           </div>
        ) : matches.length === 0 ? (
           <div className="text-center py-20 text-white/40 font-bold bg-black/10 rounded-3xl border border-white/5 mx-auto max-w-md">
                ไม่พบข้อมูลแมตช์การแข่งขัน
           </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
             {Object.entries(groupedData).map(([leagueName, leagueMatches]: any) => (
               <section key={leagueName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 
                 {/* League Header: เส้นขีดข้างๆ และชื่อลีก */}
                 <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-5">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                   <h2 className="font-[900] italic uppercase text-emerald-400/90 text-xs md:text-lg tracking-[0.15em] whitespace-nowrap px-3 py-1 bg-black/20 rounded-full border border-white/5">
                     {leagueName}
                   </h2>
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                 </div>

                 {/* Grid Layout: Responsive Breakpoints */}
                 {/* 1 col (Mobile) | 2 cols (Tablet) | 3 cols (Laptop) | 4 cols (Large Screen) */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
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
        )}
      </div>

      {/* ปุ่มเปิดโพย (Floating Button) */}
      {selectedBets.length > 0 && !isSlipOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-[90] flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => setIsSlipOpen(true)}
            className="w-full max-w-sm md:w-auto bg-orange-500 text-white px-6 py-3 md:px-10 md:py-4 rounded-full font-black italic uppercase text-sm shadow-[0_10px_40px_rgba(249,115,22,0.5)] flex items-center justify-center gap-3 border-2 border-orange-400 hover:scale-105 active:scale-95 transition-all"
          >
            <MousePointer2 size={20} className="animate-bounce" />
            <span>เปิดโพย ({selectedBets.length})</span>
          </button>
        </div>
      )}

      {/* Modal หน้าต่างเดิมพัน */}
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