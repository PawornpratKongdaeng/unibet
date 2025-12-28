import Image from 'next/image';

interface MatchCardProps {
  match: any;
  isResultsPage: boolean;
  isLive?: boolean; // ✅ เพิ่มเพื่อเช็คว่าเป็นบอลสดหรือไม่
  onBetClick: (match: any, side: string, type: string, oddsValue: string | number) => void;
}

export default function MatchCard({ match, isResultsPage, isLive, onBetClick }: MatchCardProps) {
  // --- กำหนดสถานะการล็อคปุ่ม ---
  // ถ้าเป็นหน้า "ผลบอล" หรือ "บอลสด" ให้ล็อคปุ่มเดิมพันทั้งหมด
  const isLocked = isResultsPage || isLive;

  const homeName = match.home_team || match.home_name || "Home Team";
  const awayName = match.away_team || match.away_name || "Away Team";
  
  const homeLogo = match.home_team_image_url || match.home_logo || "https://placehold.co/40x40?text=H";
  const awayLogo = match.away_team_image_url || match.away_logo || "https://placehold.co/40x40?text=A";
  
  // Handicap
  const hdpHomeLine = match.hdp || match.odds?.handicap?.home_line || "0";
  const hdpAwayLine = match.hdp || match.odds?.handicap?.away_line || "0";
  const hdpHomePrice = match.hdp_home_odds || match.odds?.handicap?.home_price || "";
  const hdpAwayPrice = match.hdp_away_odds || match.odds?.handicap?.away_price || "";

  // Over/Under
  const ouLine = match.ou_total || match.odds?.over_under?.line || "0";
  const ouOverPrice = match.ou_over_odds || match.odds?.over_under?.over_price || "";
  const ouUnderPrice = match.ou_under_odds || match.odds?.over_under?.under_price || "";

  const matchTime = match.match_time?.split(' ')[1]?.substring(0, 5) || 'N/A';
  const homeScore = match.home_score ?? match.scores?.full_time?.home ?? '-';
  const awayScore = match.away_score ?? match.scores?.full_time?.away ?? '-';

  return (
    <div className={`bg-[#2D3748] rounded-lg shadow-xl overflow-hidden border border-gray-700 transition-opacity ${isLocked ? 'opacity-90' : 'opacity-100'}`}>
      {/* League Name & Match Time */}
      <div className="bg-[#3A4354] px-4 py-2 flex justify-between items-center text-xs font-semibold text-gray-300">
        <span className="truncate pr-2">{match.league_name || 'League'}</span>
        <div className="flex items-center gap-2">
           {isLive && <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>}
           <span className="whitespace-nowrap">{matchTime}</span>
        </div>
      </div>

      <div className="p-3">
        {/* --- Team Names & Logos Row --- */}
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
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60' 
                : 'bg-[#4A5568] hover:bg-yellow-600 text-white'}`}
          >
            <span>{hdpHomeLine}</span>
            <span className={isLocked ? "text-gray-500" : "text-yellow-400"}>{hdpHomePrice}</span>
          </button>
          
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'away', 'HDP', hdpAwayPrice)}
            className={`flex justify-between px-3 py-2 rounded-md text-sm font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60' 
                : 'bg-[#4A5568] hover:bg-yellow-600 text-white'}`}
          >
            <span>{hdpAwayLine}</span>
            <span className={isLocked ? "text-gray-500" : "text-yellow-400"}>{hdpAwayPrice}</span>
          </button>
        </div>

        {/* Over/Under (OU) Row */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'home', 'OU', ouOverPrice)}
            className={`col-span-2 flex justify-between px-2 py-2 rounded-md text-xs font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60' 
                : 'bg-[#4A5568] hover:bg-green-600 text-white'}`}
          >
            <span>Over</span>
            <span className={isLocked ? "text-gray-500" : "text-yellow-400"}>{ouOverPrice}</span>
          </button>
          
          <div className="col-span-1 bg-[#1A202C] text-yellow-400 flex items-center justify-center rounded-md text-sm font-bold">
            {ouLine}
          </div>
          
          <button
            disabled={isLocked}
            onClick={() => onBetClick(match, 'away', 'OU', ouUnderPrice)}
            className={`col-span-2 flex justify-between px-2 py-2 rounded-md text-xs font-bold transition duration-200 
              ${isLocked 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-60' 
                : 'bg-[#4A5568] hover:bg-red-600 text-white'}`}
          >
            <span>Under</span>
            <span className={isLocked ? "text-gray-500" : "text-yellow-400"}>{ouUnderPrice}</span>
          </button>
        </div>

        {/* ส่วนแสดงคะแนนและสถานะปิดรับแทง */}
        {isLocked && (
          <div className="mt-2 text-center">
            {isResultsPage ? (
              <div className="text-xl font-black text-yellow-400 p-1 bg-[#1A202C] rounded">
                FINAL: {homeScore} - {awayScore}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest border border-rose-500/30 py-1 rounded">
                🔴 Betting Closed - Match in Progress
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}