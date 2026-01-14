"use client";
import React from 'react';
import { formatMyanmarDisplay, safeFloat } from '@/lib/myanmarOdds'; 

export default function MatchCard({ match, onBetClick, selectedBets = [] }: { match: any, onBetClick: any, selectedBets: any[] }) {
  
  const homeName = match.home?.engName || match.home?.name || "Home";
  const awayName = match.away?.engName || match.away?.name || "Away";
  const leagueName = match.league?.name || "League";

  const timeDisplay = match.startTime 
    ? new Date(match.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) 
    : "Live";

  const isActive = (side: string, type: string) => 
    selectedBets.some((b: any) => b.matchId === match.id.toString() && b.side === side && b.type === type);

  // --- Sub-Component: OddsButton ---
  // ✅ 1. เพิ่ม prop "hidePrice" เข้ามา (default เป็น false)
  const OddsButton = ({ label, hdp, price, type, side, isTeamName = false, isUpperTeam = false, hidePrice = false }: any) => {
    
    // เช็คว่ามีราคาหรือไม่ (ถ้า price เป็น 0 ก็ถือว่ามี เพราะเราจะส่ง 0 มาหลอกระบบ)
    const hasData = (price !== undefined && price !== null); 
    const active = isActive(side, type);
    
    // เงื่อนไขซ่อนราคาเดิม (ทีมรอง HDP)
    const isHdpAway = (type === 'HDP' && side === 'away');

    let displayValue = "-";
    if (hasData) {
        if (type === 'OE') {
            displayValue = safeFloat(price).toFixed(2); 
        } else {
            displayValue = formatMyanmarDisplay(hdp, price);
        }
    }

    // ถ้าไม่มีข้อมูลเลย ให้แสดงขีดเหมือนเดิม
    if (!hasData) {
        return (
            <div className="w-full flex items-center justify-center px-2 py-3 rounded-md border border-white/5 bg-black/20 text-slate-600 select-none">
                <span className="text-[10px] font-bold">-</span>
            </div>
        );
    }

    return (
      <button 
        onClick={() => onBetClick(match, side, type, price, label, hdp)}
        className={`
          relative w-full flex items-center justify-between px-3 py-3 rounded-md border transition-all duration-200 active:scale-[0.98] bg-white
          ${active 
            ? 'bg-amber-400 border-amber-500 text-[#013323]' 
            : 'bg-[#2d5a27] border-white/10 hover:border-emerald-400 text-black shadow-sm '
          }
        `}
      >
        <span className={`
            text-[11px] font-bold uppercase tracking-tight text-left truncate
            ${isTeamName ? 'w-[70%]' : 'w-auto'} 
            ${isUpperTeam && !active ? 'text-yellow-400' : ''} 
        `}>
          {label}
        </span>

        {/* ✅ 2. เพิ่มเงื่อนไข !hidePrice ตรงนี้ ถ้าเป็น true จะไม่แสดงตัวเลข */}
        {!isHdpAway && !hidePrice && (
            <span className={`
                font-mono text-xs sm:text-sm font-black tracking-tight whitespace-nowrap ml-1
                ${active ? 'text-[#013323]' : 'text-emerald-300'}
            `}>
              {displayValue}
            </span>
        )}
      </button>
    );
  };

  return (
    <div className="bg-[#1a3a16]/40 rounded-xl overflow-hidden shadow-lg border border-white/5 mb-3">
      {/* Header */}
      <div className="bg-black/20 px-4 py-2 flex justify-between items-center border-b border-white/5">
         <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.1em] truncate max-w-[70%]">
           {leagueName}
         </span>
         <span className="text-[10px] text-slate-400 font-mono">{timeDisplay}</span>
      </div>

      <div className="p-2 space-y-2">
          {/* Row 1: Handicap */}
          <div className="grid grid-cols-[20px_1fr_1fr] gap-2 items-center">
             <span className="text-[9px] font-black text-emerald-500/50 -rotate-90 text-center uppercase">Hdp</span>
             <OddsButton 
                type="HDP" side="home" label={homeName} 
                hdp={match.odds} price={match.price} 
                isTeamName={true} isUpperTeam={match.homeUpper === true} 
             />
             <OddsButton 
                type="HDP" side="away" label={awayName} 
                hdp={match.odds} price={match.price} 
                isTeamName={true} isUpperTeam={match.homeUpper === false} 
             />
          </div>

          {/* Row 2: Over/Under */}
          <div className="grid grid-cols-[20px_1fr_1fr] gap-2 items-center">
             <span className="text-[9px] font-black text-emerald-500/50 -rotate-90 text-center uppercase">O/U</span>
             <OddsButton 
                type="OU" side="over" label="Over" 
                hdp={match.goalTotal} price={match.goalTotalPrice} 
             />
             <OddsButton 
                type="OU" side="under" label="Under" 
                hdp={match.goalTotal} price={match.goalTotalPrice} 
             />
          </div>

          {/* Row 3: Odd/Even */}
          {/* ✅ 3. แก้ตรงนี้: ใส่ price={0} เพื่อให้ปุ่ม Active แต่ใส่ hidePrice={true} เพื่อซ่อนเลข */}
          <div className="grid grid-cols-[20px_1fr_1fr] gap-2 items-center pt-1 border-t border-white/5">
             <span className="text-[9px] font-black text-emerald-500/50 -rotate-90 text-center uppercase">O/E</span>
             <OddsButton 
                type="OE" side="odd" label="Odd" 
                hdp="Total" price={0} hidePrice={true} 
             />
             <OddsButton 
                type="OE" side="even" label="Even" 
                hdp="Total" price={0} hidePrice={true} 
             />
          </div>
      </div>
    </div>
  );
}