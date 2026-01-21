"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCcw } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import Header from "@/components/Header";
import BetCapsule from "@/components/BetCapsule"; 
import BetSlipModal from "@/components/BetSlipModal"; 

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v3";

// 🔴 แก้ที่ 1: เปลี่ยนเป็น 1 (เพื่อให้รู้ว่าเป็น Single Play)
const MAX_SINGLE_SELECTIONS = 1; 

export default function SinglePlayPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // --- 1. Fetch Data (เหมือนเดิม) ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/v3/match/moung`, {
        method: "GET",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": token ? `Bearer ${token}` : "" 
        },
      }); 
      
      if (!res.ok) throw new Error(`Backend Error: ${res.status}`);
      const json = await res.json();
      let matchData = json.data?.matches || json.data || [];
      setMatches(Array.isArray(matchData) ? matchData : []);
    } catch (err) { 
      console.error("Fetch Error:", err); 
      setMatches([]); 
    } finally { 
      setLoading(false); 
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. Logic เลือกราคา (🔴 แก้ตรงนี้ครับ) ---
  const handleBetClick = (match: any, side: string, type: string, oddsValue: any, teamName: string, hdp: any) => {
    const realMatchId = String(match.matchId || match.id);
    const homeName = match.home?.engName || match.home?.name || "Home";
    const awayName = match.away?.engName || match.away?.name || "Away";
    
    const newBet = {
      id: `${realMatchId}-${side}-${type}`, 
      matchId: realMatchId,            
      homeName, 
      awayName,
      side, 
      type, 
      odds: oddsValue, 
      teamName, 
      hdp: hdp?.toString() || "0", 
      league: match.league?.name || "League",
      isHomeUpper: match.isHomeUpper || false 
    };

    setSelectedBets(prev => {
        // เช็คว่ากดตัวเดิมซ้ำไหม?
        const isSameBet = prev.find(b => b.id === newBet.id);
        
        // ถ้ากดซ้ำตัวเดิม -> เอาออก (เคลียร์บิลว่าง)
        if (isSameBet) return [];

        // 🔴 ถ้ากดตัวใหม่ -> แทนที่ของเดิมทันที (ให้เหลือแค่ 1 ตัวเสมอ)
        return [newBet];
    });
  };

  // --- 3. Group Data (เหมือนเดิม) ---
  const groupedData = useMemo(() => {
    if (!matches.length) return {};
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
      
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 pt-6 md:pt-10">
        
        {/* Banner Section */}
        <div className="mb-6 md:mb-10 flex flex-row items-center justify-between bg-emerald-900/40 p-4 md:p-6 rounded-2xl border border-emerald-500/20 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <h1 className="text-lg md:text-3xl font-[1000] italic text-white uppercase tracking-tighter">
                Single Play <span className="text-orange-400">HDP / OU</span>
              </h1>
            </div>
            <p className="text-emerald-400/80 text-[10px] md:text-xs font-bold uppercase tracking-widest ml-4 md:ml-6">
              เลือกวางเดิมพันแบบบอลเต็ง (เลือกได้ทีละ 1 คู่)
            </p>
          </div>
          
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="group p-3 bg-white/5 rounded-full hover:bg-orange-500 transition-all duration-300 border border-white/10"
          >
            <RefreshCcw size={20} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Matches List */}
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
               <div className="w-10 h-10 border-4 border-t-orange-500 border-emerald-500/30 rounded-full animate-spin mb-4"></div>
               <div className="text-orange-400/50 font-black italic text-sm tracking-widest animate-pulse">LOADING...</div>
            </div>
        ) : (
          <div className="space-y-8">
             {Object.entries(groupedData).map(([leagueName, leagueMatches]: any) => (
               <section key={leagueName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 {/* League Header */}
                 <div className="flex items-center gap-3 mb-4">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                   <h2 className="font-black italic uppercase text-emerald-200/90 text-xs md:text-sm tracking-widest px-4 py-1 bg-black/20 rounded-full border border-white/5 shadow-lg">
                     {leagueName}
                   </h2>
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                 </div>

                 {/* Match Cards Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
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

      <BetCapsule 
        count={selectedBets.length} 
        onOpen={() => setIsSlipOpen(true)} 
      />

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