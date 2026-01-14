"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCcw, Layers, Ticket, AlertCircle } from "lucide-react"; // ใช้ Icon ให้สื่อถึงบอลชุด
import MatchCard from "@/components/MatchCard";
import MixplayBetSlipModal from "@/components/MixplayBetSlipModal"; // ⚠️ แนะนำให้แยก Modal หรือใช้ตัวเดิมแต่รองรับ Array
import Header from "@/components/Header"; 

// 1. Config Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v3";
const MIN_PARLAY = 2; // ขั้นต่ำ 2 คู่
const MAX_PARLAY = 12; // สูงสุด 12 คู่

export default function MixplayPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBets, setSelectedBets] = useState<any[]>([]);
  const [isSlipOpen, setIsSlipOpen] = useState(false);

  // --- 2. Fetch Data (ใช้ Pattern เดียวกับ Single Page) ---
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
      
      if (!res.ok) throw new Error(`Backend Error: ${res.status}`);
  
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

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 3. Logic เลือกคู่ (Mixplay Specific) ---
  const handleBetClick = (match: any, side: string, type: string, oddsValue: any, teamName: string, hdp: any) => {
    const matchId = match.id.toString();
    const homeName = match.home?.engName || match.home?.name || "Home";
    const awayName = match.away?.engName || match.away?.name || "Away";
    
    // สร้าง Object บิล
    const newBet = {
      id: `${matchId}-${side}-${type}`, // Unique Key สำหรับราคานี้
      matchId: matchId, // Key สำหรับเช็คคู่ซ้ำ
      homeName, 
      awayName,
      side, type, odds: oddsValue, teamName, 
      hdp: hdp?.toString() || "0", 
      league: match.league?.name || "League"
    };

    setSelectedBets(prev => {
        // A. ถ้ากดตัวเดิมซ้ำ -> เอาออก (Toggle Off)
        const isSameBet = prev.find(b => b.id === newBet.id);
        if (isSameBet) {
            return prev.filter(b => b.id !== newBet.id);
        }

        // B. ถ้ากดคู่เดิม แต่คนละราคา -> เปลี่ยนราคา (Replace)
        // (Mixplay 1 คู่ แทงได้แค่ 1 หน้า)
        const existingMatchIndex = prev.findIndex(b => b.matchId === matchId);
        if (existingMatchIndex !== -1) {
            const updated = [...prev];
            updated[existingMatchIndex] = newBet;
            return updated;
        }

        // C. ถ้ายังไม่เต็ม Max -> เพิ่มคู่ใหม่
        if (prev.length >= MAX_PARLAY) {
            alert(`สูงสุด ${MAX_PARLAY} คู่`); // หรือทำ Toast Notification
            return prev;
        }

        return [...prev, newBet];
    });
  };

  // --- 4. Group Data ---
  const groupedData = useMemo(() => {
    if (!matches || matches.length === 0) return {};
    return matches.reduce((acc: any, item: any) => {
      const leagueName = item.league?.name || "OTHERS";
      if (!acc[leagueName]) acc[leagueName] = [];
      acc[leagueName].push(item);
      return acc;
    }, {});
  }, [matches]);

  // Helper เช็คว่าพร้อมแทงหรือยัง (เช่น ต้องครบ 2 คู่)
  const isValidToBet = selectedBets.length >= MIN_PARLAY;

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-32 font-sans relative">
      <Header />
      
      {/* Container: Responsive Padding */}
      <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-4 md:px-6 pt-6 md:pt-10">
        
        {/* Banner Section: Mixplay Style */}
        <div className="mb-6 md:mb-10 flex flex-row items-center justify-between bg-emerald-900/40 p-4 md:p-6 rounded-2xl md:rounded-[2rem] border border-emerald-500/20 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 md:gap-3 mb-1">
              {/* เปลี่ยนสีจุดเป็นม่วงหรือฟ้า เพื่อแยกความต่างจากหน้า Single (หรือใช้ส้มเหมือนเดิมก็ได้) */}
              <div className="w-2 h-2 md:w-3 md:h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <h1 className="text-lg md:text-3xl font-[1000] italic text-white uppercase tracking-tighter">
                Mix Parlay <span className="text-purple-400">&</span> Step
              </h1>
            </div>
            <div className="flex items-center gap-2 ml-4 md:ml-6">
                 <p className="text-purple-300/80 text-[10px] md:text-xs font-bold uppercase tracking-widest">
                    Step {MIN_PARLAY} - {MAX_PARLAY} Matches
                 </p>
            </div>
          </div>
          
          <button 
            onClick={fetchData} 
            disabled={loading}
            className="p-3 md:p-4 bg-white/5 rounded-full hover:bg-purple-500 hover:text-white transition-all duration-300 border border-white/10 shadow-lg group disabled:opacity-50"
          >
            <RefreshCcw size={20} className={`${loading ? "animate-spin" : ""} group-active:rotate-180 transition-transform md:w-6 md:h-6`} />
          </button>
        </div>

        {/* Matches List */}
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 space-y-4">
             <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-purple-500 rounded-full animate-spin"></div>
             <div className="text-purple-400/50 font-black italic text-sm tracking-widest animate-pulse">LOADING MIXPARLAY...</div>
           </div>
        ) : matches.length === 0 ? (
           <div className="text-center py-20 text-white/40 font-bold bg-black/10 rounded-3xl border border-white/5 mx-auto max-w-md">
               ไม่พบข้อมูลการแข่งขัน
           </div>
        ) : (
          <div className="space-y-8 md:space-y-12">
             {Object.entries(groupedData).map(([leagueName, leagueMatches]: any) => (
               <section key={leagueName} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                 
                 {/* League Header Style เดียวกับ Single */}
                 <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-5">
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                   <h2 className="font-[900] italic uppercase text-purple-200/90 text-xs md:text-lg tracking-[0.15em] whitespace-nowrap px-3 py-1 bg-black/20 rounded-full border border-white/5">
                     {leagueName}
                   </h2>
                   <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                 </div>

                 {/* Grid Layout */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                   {leagueMatches.map((match: any) => (
                     <MatchCard 
                       key={match.id} 
                       match={match} 
                       onBetClick={handleBetClick} 
                       selectedBets={selectedBets} // ส่ง Array ไป MatchCard จะต้องเช็คว่า ID นี้อยู่ใน Array ไหม
                     />
                   ))}
                 </div>
               </section>
             ))}
          </div>
        )}
      </div>

      {/* ✅ Floating Button (ปรับให้โชว์จำนวนคู่) */}
      {selectedBets.length > 0 && !isSlipOpen && (
        <div className="fixed bottom-6 left-0 right-0 z-[90] flex justify-center px-4 animate-in slide-in-from-bottom-10 fade-in duration-300">
          <button 
            onClick={() => setIsSlipOpen(true)}
            className={`w-full max-w-sm md:w-auto px-6 py-3 md:px-10 md:py-4 rounded-full font-black italic uppercase text-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-between md:justify-center gap-4 border-2 hover:scale-105 active:scale-95 transition-all
                ${isValidToBet 
                    ? "bg-purple-600 text-white border-purple-400 shadow-purple-500/40" 
                    : "bg-gray-700 text-gray-300 border-gray-600" // สียังไม่พร้อมแทง
                }
            `}
          >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isValidToBet ? "bg-white text-purple-700" : "bg-gray-600 text-gray-400"}`}>
                    {selectedBets.length}
                </div>
                <div className="flex flex-col text-left leading-tight">
                    <span>{isValidToBet ? "ดูสเต็ป" : "เลือกอีก " + (MIN_PARLAY - selectedBets.length) + " คู่"}</span>
                    <span className="text-[10px] font-normal opacity-80">Mix Parlay</span>
                </div>
            </div>
            
            {isValidToBet ? (
                <Ticket size={24} className="animate-bounce" />
            ) : (
                <AlertCircle size={24} className="opacity-50" />
            )}
          </button>
        </div>
      )}

      {/* Modal - ต้องมั่นใจว่า Component นี้รองรับ prop `bets` ที่เป็น Array */}
      <MixplayBetSlipModal 
        bets={selectedBets} 
        isOpen={isSlipOpen} 
        setIsOpen={setIsSlipOpen}
        minBets={MIN_PARLAY}
        maxBets={MAX_PARLAY}
        onRemove={(id) => setSelectedBets(prev => prev.filter(b => b.id !== id))}
        onClear={() => { setSelectedBets([]); setIsSlipOpen(false); }}
      />
    </main>
  );
}