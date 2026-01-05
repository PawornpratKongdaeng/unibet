"use client";
import React from 'react';
import { Clock, Trophy } from "lucide-react";

interface MatchCardProps {
  match: any;
  onBetClick: (match: any, side: string, type: string, oddsValue: string | number, teamName: string, hdp: string) => void;
  selectedBets: any[];
}

export default function MatchCard({ match, onBetClick, selectedBets = [] }: MatchCardProps) {
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
    <div className="bg-white rounded-2xl md:rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden w-full mb-4 md:mb-6">
      
      {/* 1. Header: League & Time */}
      <div className="px-4 md:px-8 py-3 md:py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2 max-w-[70%]">
          <Trophy size={16} className="text-emerald-500 shrink-0 md:w-5 md:h-5" />
          <span className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-slate-500 italic truncate">
            {match.league_name}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-900 font-mono text-[11px] md:text-base font-black bg-white px-3 md:px-4 py-1 rounded-full border border-slate-200">
          <Clock size={14} className="text-emerald-500 md:w-4 md:h-4" />
          {matchTime}
        </div>
      </div>

      <div className="p-4 md:p-8">
        {/* 2. Teams Display */}
        <div className="flex justify-between items-center mb-6 md:mb-10">
          <div className="flex flex-col items-center gap-2 md:gap-4 w-[42%]">
            <div className="size-14 md:size-24 p-2 md:p-4 bg-white rounded-xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center transition-transform hover:scale-105">
              <img src={homeLogo} alt="home" className="w-full h-full object-contain" />
            </div>
            <span className={`text-[11px] md:text-lg font-black uppercase italic leading-tight text-center line-clamp-2 ${match.odds_team === 'home' ? 'text-emerald-600 underline decoration-2' : 'text-slate-800'}`}>
              {homeName}
            </span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="text-slate-300 font-black italic text-xs md:text-2xl tracking-widest">VS</div>
          </div>
          
          <div className="flex flex-col items-center gap-2 md:gap-4 w-[42%]">
            <div className="size-14 md:size-24 p-2 md:p-4 bg-white rounded-xl md:rounded-3xl border border-slate-100 shadow-sm flex items-center justify-center transition-transform hover:scale-105">
              <img src={awayLogo} alt="away" className="w-full h-full object-contain" />
            </div>
            <span className={`text-[11px] md:text-lg font-black uppercase italic leading-tight text-center line-clamp-2 ${match.odds_team === 'away' ? 'text-emerald-600 underline decoration-2' : 'text-slate-800'}`}>
              {awayName}
            </span>
          </div>
        </div>

        {/* 3. Betting Section */}
        <div className="grid gap-2 md:gap-4 max-w-4xl mx-auto">
          
          {/* --- Handicap Row --- */}
          <div className="grid grid-cols-[1fr_55px_1fr] md:grid-cols-[1fr_100px_1fr] gap-1.5 md:gap-3">
            <button 
              onClick={() => onBetClick(match, 'home', 'HDP', hdpHomePrice, homeName, hdpLine)}
              className={`px-3 md:px-6 py-3 md:py-5 rounded-lg md:rounded-2xl text-[10px] md:text-base font-bold transition-all border-b-4 flex justify-between items-center active:translate-y-0.5 ${
                isActive('HDP', 'home') 
                ? 'bg-emerald-500 border-emerald-700 text-white' 
                : 'bg-emerald-900 border-emerald-950 text-white hover:bg-emerald-800'
              }`}
            >
              <span className="truncate">HOME</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono ml-1">{hdpHomePrice}</span>
            </button>

            <div className="flex items-center justify-center bg-slate-100 text-slate-800 text-[10px] md:text-xl font-black rounded-lg md:rounded-2xl border border-slate-200 shadow-inner">
              {formatLine(hdpLine)}
            </div>

            <button 
              onClick={() => onBetClick(match, 'away', 'HDP', hdpAwayPrice, awayName, hdpLine)}
              className={`px-3 md:px-6 py-3 md:py-5 rounded-lg md:rounded-2xl text-[10px] md:text-base font-bold transition-all border-b-4 flex justify-between items-center active:translate-y-0.5 ${
                isActive('HDP', 'away') 
                ? 'bg-emerald-500 border-emerald-700 text-white' 
                : 'bg-emerald-900 border-emerald-950 text-white hover:bg-emerald-800'
              }`}
            >
              <span className="truncate">AWAY</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono ml-1">{hdpAwayPrice}</span>
            </button>
          </div>

          {/* --- Over/Under Row --- */}
          <div className="grid grid-cols-[1fr_55px_1fr] md:grid-cols-[1fr_100px_1fr] gap-1.5 md:gap-3">
            <button 
              onClick={() => onBetClick(match, 'over', 'OU', ouOverPrice, 'Over', ouLine)}
              className={`px-3 md:px-6 py-3 md:py-5 rounded-lg md:rounded-2xl text-[10px] md:text-base font-bold transition-all border-b-4 flex justify-between items-center active:translate-y-0.5 ${
                isActive('OU', 'over') 
                ? 'bg-emerald-500 border-emerald-700 text-white' 
                : 'bg-emerald-900 border-emerald-950 text-white hover:bg-emerald-800'
              }`}
            >
              <span>OVER</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono ml-1">{ouOverPrice}</span>
            </button>

            <div className="flex flex-col gap-1">
               <div className="flex-1 flex items-center justify-center bg-slate-100 rounded-md md:rounded-lg text-[8px] md:text-[10px] font-bold text-slate-400 border border-slate-200 uppercase tracking-tighter">Line</div>
               <div className="flex-1 flex items-center justify-center bg-slate-50 rounded-md md:rounded-lg text-[9px] md:text-sm font-black text-emerald-700 border border-slate-200">{ouLine}</div>
            </div>

            <button 
              onClick={() => onBetClick(match, 'under', 'OU', ouUnderPrice, 'Under', ouLine)}
              className={`px-3 md:px-6 py-3 md:py-5 rounded-lg md:rounded-2xl text-[10px] md:text-base font-bold transition-all border-b-4 flex justify-between items-center active:translate-y-0.5 ${
                isActive('OU', 'under') 
                ? 'bg-emerald-500 border-emerald-700 text-white' 
                : 'bg-emerald-900 border-emerald-950 text-white hover:bg-emerald-800'
              }`}
            >
              <span>UNDER</span>
              <span className="bg-black/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono ml-1">{ouUnderPrice}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}