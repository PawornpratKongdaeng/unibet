"use client";
import React from 'react';
import { Clock, Trophy } from "lucide-react";

interface MatchCardProps {
  match: any;
  onBetClick: (match: any, side: string, type: string, oddsValue: string | number, teamName: string, hdp: string) => void;
  selectedBets: any[];
}

export default function MatchCard({ match, onBetClick, selectedBets = [] }: MatchCardProps) {
  // --- การดึงข้อมูลจาก API ---
  const homeName = match.home_team || "Home Team";
  const awayName = match.away_team || "Away Team";
  const homeLogo = match.home_team_image_url;
  const awayLogo = match.away_team_image_url;
  
  const hdpLine = match.odds?.handicap?.home_line || "0";
  const hdpHomePrice = match.odds?.handicap?.home_price || 0;
  const hdpAwayPrice = match.odds?.handicap?.away_price || 0;
  
  const ouLine = match.odds?.over_under?.line || "0";
  const ouOverPrice = match.odds?.over_under?.over_price || 0;
  const ouUnderPrice = match.odds?.over_under?.under_price || 0;

  const matchTime = match.match_time?.split(' ')[1]?.substring(0, 5) || '--:--';

  const formatLine = (line: string) => (line === "0" || line === "0.0" ? "Even" : line);
  
  const isActive = (type: string, side: string) => {
    const betId = `${match.id}-${type}`;
    return selectedBets.some(bet => bet.id === betId && bet.side === side);
  };

  return (
    <div className="bg-white rounded-[1.5rem] md:rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group w-full mb-6">
      
      {/* 1. Header: League & Time (ขยาย Padding) */}
      <div className="px-6 md:px-12 py-4 md:py-6 bg-slate-50/80 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Trophy size={18} className="text-emerald-500 shrink-0" />
          <span className="text-xs md:text-base font-black uppercase tracking-widest text-slate-500 italic truncate">
            {match.league_name}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-900 font-mono text-xs md:text-lg font-black bg-white px-4 md:px-6 py-2 rounded-full border-2 border-slate-100 shadow-sm">
          <Clock size={16} className="text-emerald-500" />
          {matchTime}
        </div>
      </div>

      <div className="p-6 md:p-12">
        {/* 2. Teams Display (ปรับให้องค์ประกอบใหญ่ขึ้นเพื่อลดที่ว่าง) */}
        <div className="flex justify-between items-center mb-10 md:mb-16">
          <div className="flex flex-col items-center gap-4 md:gap-6 w-[40%] text-center">
            <div className="w-20 h-20 md:w-32 md:h-32 p-4 md:p-6 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-md group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
              <img src={homeLogo} alt="home" className="w-full h-full object-contain" />
            </div>
            <span className={`text-xs md:text-xl font-black uppercase italic leading-tight tracking-tight ${match.odds_team === 'home' ? 'text-emerald-600' : 'text-slate-800'}`}>
              {homeName}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-slate-500 font-black italic text-sm md:text-3xl tracking-[0.5em]">VS</div>
          </div>
          
          <div className="flex flex-col items-center gap-4 md:gap-6 w-[40%] text-center">
            <div className="w-20 h-20 md:w-32 md:h-32 p-4 md:p-6 bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-100 shadow-md group-hover:scale-110 transition-transform duration-500 flex items-center justify-center">
              <img src={awayLogo} alt="away" className="w-full h-full object-contain" />
            </div>
            <span className={`text-xs md:text-xl font-black uppercase italic leading-tight tracking-tight ${match.odds_team === 'away' ? 'text-emerald-600' : 'text-slate-800'}`}>
              {awayName}
            </span>
          </div>
        </div>

        {/* 3. Betting Section (ขยายขนาดปุ่มและจัดวางค่าน้ำตามทีม) */}
        <div className="space-y-3 md:space-y-5 max-w-[1400px] mx-auto">
          
          {/* --- Handicap Row --- */}
          <div className="grid grid-cols-[1fr_70px_1fr] md:grid-cols-[1fr_120px_1fr] gap-2 md:gap-4 h-14 md:h-24">
            {/* ฝั่ง Home */}
            <button 
              onClick={() => onBetClick(match, 'home', 'HDP', hdpHomePrice, homeName, hdpLine)}
              className={`px-4 md:px-8 rounded-xl md:rounded-[2rem] text-[10px] md:text-lg font-black transition-all border-2 flex justify-between items-center shadow-sm ${
                isActive('HDP', 'home') ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#1a5d2c] border-emerald-800/50 text-white hover:brightness-110'
              }`}
            >
              <span className="truncate mr-2">{homeName}</span>
              <span className="bg-black/30 px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-base text-emerald-300 font-mono">0-{hdpHomePrice}</span>
            </button>

            {/* ช่องกลาง (Line) */}
            <div className="flex items-center justify-center bg-[#0d3d1d] text-emerald-300 text-[11px] md:text-2xl font-black rounded-xl md:rounded-[2rem] border-2 border-emerald-900 shadow-inner">
              {formatLine(hdpLine)}
            </div>

            {/* ฝั่ง Away */}
            <button 
              onClick={() => onBetClick(match, 'away', 'HDP', hdpAwayPrice, awayName, hdpLine)}
              className={`px-4 md:px-8 rounded-xl md:rounded-[2rem] text-[10px] md:text-lg font-black transition-all border-2 flex justify-between items-center shadow-sm ${
                isActive('HDP', 'away') ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#1a5d2c] border-emerald-800/50 text-white hover:brightness-110'
              }`}
            >
              <span className="truncate mr-2">{awayName}</span>
              <span className="bg-black/30 px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-base text-emerald-300 font-mono">0-{hdpAwayPrice}</span>
            </button>
          </div>

          {/* --- Over/Under Row --- */}
          <div className="grid grid-cols-[1fr_70px_1fr] md:grid-cols-[1fr_120px_1fr] gap-2 md:gap-4 h-14 md:h-24">
            {/* Over */}
            <button 
              onClick={() => onBetClick(match, 'over', 'OU', ouOverPrice, 'Over', ouLine)}
              className={`px-4 md:px-8 rounded-xl md:rounded-[2rem] text-[10px] md:text-lg font-black transition-all border-2 flex justify-between items-center shadow-sm ${
                isActive('OU', 'over') ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#1a5d2c] border-emerald-800/50 text-white hover:brightness-110'
              }`}
            >
              <span>OVER</span>
              <span className="bg-black/30 px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-base text-emerald-300 font-mono">{ouLine}+{ouOverPrice}</span>
            </button>

            {/* ช่องกลาง (Odd/Even) */}
            <div className="flex flex-col gap-1.5">
              <button className="flex-1 bg-[#0d3d1d] hover:bg-emerald-800 text-[8px] md:text-xs text-white font-black rounded-lg md:rounded-xl border border-emerald-900/50 transition-colors uppercase italic shadow-sm">Odd</button>
              <button className="flex-1 bg-[#0d3d1d] hover:bg-emerald-800 text-[8px] md:text-xs text-white font-black rounded-lg md:rounded-xl border border-emerald-900/50 transition-colors uppercase italic shadow-sm">Even</button>
            </div>

            {/* Under */}
            <button 
              onClick={() => onBetClick(match, 'under', 'OU', ouUnderPrice, 'Under', ouLine)}
              className={`px-4 md:px-8 rounded-xl md:rounded-[2rem] text-[10px] md:text-lg font-black transition-all border-2 flex justify-between items-center shadow-sm ${
                isActive('OU', 'under') ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-[#1a5d2c] border-emerald-800/50 text-white hover:brightness-110'
              }`}
            >
              <span>UNDER</span>
              <span className="bg-black/30 px-2 md:px-3 py-1 rounded-lg text-[9px] md:text-base text-emerald-300 font-mono">0-{ouUnderPrice}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}