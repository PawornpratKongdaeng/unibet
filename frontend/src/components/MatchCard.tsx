"use client";
import Image from 'next/image';

interface MatchCardProps {
  match: any;
  isResultsPage: boolean;
  isLive?: boolean;
  isMaintenance?: boolean; // ✅ รับค่าจาก System Setting
  onBetClick: (match: any, side: string, type: string, oddsValue: string | number) => void;
}

export default function MatchCard({ 
  match, 
  isResultsPage, 
  isLive, 
  isMaintenance, // ✅ รับสถานะปิดปรับปรุง
  onBetClick 
}: MatchCardProps) {
  
  // --- กำหนดสถานะการล็อคปุ่ม ---
  // เพิ่มเงื่อนไข: ถ้าเป็นโหมดปิดปรับปรุง (isMaintenance) ให้ล็อคปุ่มทันที
  const isLocked = isResultsPage || isLive || isMaintenance;

  const homeName = match.home_team || match.home_name || "Home Team";
  const awayName = match.away_team || match.away_name || "Away Team";
  
  const homeLogo = match.home_team_image_url || match.home_logo || "https://placehold.co/40x40?text=H";
  const awayLogo = match.away_team_image_url || match.away_logo || "https://placehold.co/40x40?text=A";
  
  // Odds Data... (เหมือนเดิม)
  const hdpHomeLine = match.hdp || match.odds?.handicap?.home_line || "0";
  const hdpHomePrice = match.hdp_home_odds || match.odds?.handicap?.home_price || "";
  const hdpAwayLine = match.hdp || match.odds?.handicap?.away_line || "0";
  const hdpAwayPrice = match.hdp_away_odds || match.odds?.handicap?.away_price || "";
  const ouLine = match.ou_total || match.odds?.over_under?.line || "0";
  const ouOverPrice = match.ou_over_odds || match.odds?.over_under?.over_price || "";
  const ouUnderPrice = match.ou_under_odds || match.odds?.over_under?.under_price || "";

  const matchTime = match.match_time?.split(' ')[1]?.substring(0, 5) || 'N/A';
  const homeScore = match.home_score ?? match.scores?.full_time?.home ?? '-';
  const awayScore = match.away_score ?? match.scores?.full_time?.away ?? '-';

  return (
    <div className={`bg-[#2D3748] rounded-lg shadow-xl overflow-hidden border transition-all ${
      isMaintenance ? 'border-amber-500/50 grayscale-[0.5]' : 'border-gray-700'
    } ${isLocked ? 'opacity-90' : 'opacity-100'}`}>
      
      {/* League Name & Match Time */}
      <div className={`${isMaintenance ? 'bg-amber-900/40' : 'bg-[#3A4354]'} px-4 py-2 flex justify-between items-center text-xs font-semibold text-gray-300`}>
        <span className="truncate pr-2">{match.league_name || 'League'}</span>
        <div className="flex items-center gap-2">
           {isLive && !isMaintenance && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>}
           {isMaintenance && <span className="text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded font-black">MAINTENANCE</span>}
           <span className="whitespace-nowrap">{matchTime}</span>
        </div>
      </div>

      <div className="p-3">
        {/* Team Names & Logos */}
        <div className="flex justify-between items-center mb-3 text-white">
            <div className="flex items-center gap-2 w-[45%]">
                 <img src={homeLogo} alt="home" className="w-6 h-6 object-contain" />
                 <span className={`text-sm font-bold truncate ${match.odds_team === 'home' ? 'text-red-400' : ''}`}>
                    {homeName}
                 </span>
            </div>
            <div className="text-gray-500 text-xs">VS</div>
            <div className="flex items-center justify-end gap-2 w-[45%]">
                 <span className={`text-sm font-bold truncate ${match.odds_team === 'away' ? 'text-red-400' : ''}`}>
                    {awayName}
                 </span>
                 <img src={awayLogo} alt="away" className="w-6 h-6 object-contain" />
            </div>
        </div>

        {/* Handicap (HDP) Row */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'home', 'HDP', hdpHomePrice)}
            className={`flex justify-between px-3 py-2 rounded-md text-sm font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-[#4A5568] hover:bg-yellow-600 text-white'}`}
          >
            <span>{hdpHomeLine}</span>
            <span className={isLocked ? "text-gray-600" : "text-yellow-400"}>{hdpHomePrice}</span>
          </button>
          
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'away', 'HDP', hdpAwayPrice)}
            className={`flex justify-between px-3 py-2 rounded-md text-sm font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-[#4A5568] hover:bg-yellow-600 text-white'}`}
          >
            <span>{hdpAwayLine}</span>
            <span className={isLocked ? "text-gray-600" : "text-yellow-400"}>{hdpAwayPrice}</span>
          </button>
        </div>

        {/* Over/Under (OU) Row */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'home', 'OU', ouOverPrice)}
            className={`col-span-2 flex justify-between px-2 py-2 rounded-md text-xs font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-[#4A5568] hover:bg-green-600 text-white'}`}
          >
            <span>Over</span>
            <span className={isLocked ? "text-gray-600" : "text-yellow-400"}>{ouOverPrice}</span>
          </button>
          
          <div className={`col-span-1 flex items-center justify-center rounded-md text-sm font-bold ${isLocked ? 'bg-gray-900 text-gray-600' : 'bg-[#1A202C] text-yellow-400'}`}>
            {ouLine}
          </div>
          
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'away', 'OU', ouUnderPrice)}
            className={`col-span-2 flex justify-between px-2 py-2 rounded-md text-xs font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed' 
                : 'bg-[#4A5568] hover:bg-red-600 text-white'}`}
          >
            <span>Under</span>
            <span className={isLocked ? "text-gray-600" : "text-yellow-400"}>{ouUnderPrice}</span>
          </button>
        </div>

        {/* ส่วนแสดงคะแนนและสถานะปิดรับแทง */}
        {isLocked && (
          <div className="mt-2 text-center">
            {isResultsPage ? (
              <div className="text-xl font-black text-yellow-400 p-1 bg-[#1A202C] rounded shadow-inner">
                FINAL: {homeScore} - {awayScore}
              </div>
            ) : isMaintenance ? (
              <div className="text-[10px] font-black text-amber-500 uppercase tracking-tighter border border-amber-500/20 py-1.5 rounded bg-amber-500/5">
                ⚠️ System Maintenance - Back Soon
              </div>
            ) : (
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest border border-rose-500/30 py-1 rounded">
                🔴 Betting Closed - Live Match
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}