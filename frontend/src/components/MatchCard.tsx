import Image from 'next/image'; // หรือใช้ <img /> ธรรมดาถ้าไม่ได้ config next/image

interface MatchCardProps {
  match: any;
  isResultsPage: boolean;
  onBetClick: (match: any, side: string, type: string, oddsValue: string) => void;
}

export default function MatchCard({ match, isResultsPage, onBetClick }: MatchCardProps) {
  const homeName = match.home_team || "Home Team";
  const awayName = match.away_team || "Away Team";
  
  // --- ดึงข้อมูลที่ขาดไปมาใช้ ---
  const homeLogo = match.home_team_image_url || "https://placehold.co/40x40?text=H";
  const awayLogo = match.away_team_image_url || "https://placehold.co/40x40?text=A";
  
  // Handicap
  const hdpHomeLine = match.odds?.handicap?.home_line || "0";
  const hdpAwayLine = match.odds?.handicap?.away_line || "0"; // ดึงของทีมเยือนด้วย
  const hdpHomePrice = match.odds?.handicap?.home_price || ""; // ราคาน้ำเจ้าบ้าน
  const hdpAwayPrice = match.odds?.handicap?.away_price || ""; // ราคาน้ำทีมเยือน

  // Over/Under
  const ouLine = match.odds?.over_under?.line || "0";
  const ouOverPrice = match.odds?.over_under?.over_price || "";
  const ouUnderPrice = match.odds?.over_under?.under_price || "";

  const matchTime = match.match_time?.split(' ')[1]?.substring(0, 5) || 'N/A';
  const homeScore = match.scores?.full_time?.home ?? '-';
  const awayScore = match.scores?.full_time?.away ?? '-';

  return (
    <div className="bg-[#2D3748] rounded-lg shadow-xl overflow-hidden border border-gray-700">
      {/* League Name & Match Time */}
      <div className="bg-[#3A4354] px-4 py-2 flex justify-between items-center text-xs font-semibold text-gray-300">
        <span className="truncate pr-2">{match.league_name || 'League'}</span>
        <span className="whitespace-nowrap">{matchTime}</span>
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
          {/* ปุ่มเจ้าบ้าน */}
          <button
            disabled={isResultsPage}
            onClick={() => onBetClick(match, 'home', 'HDP', hdpHomePrice)}
            className={`flex justify-between px-3 bg-[#4A5568] hover:bg-yellow-600 text-white py-2 rounded-md text-sm font-bold transition duration-200 ${isResultsPage && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>{hdpHomeLine}</span>
            <span className="text-yellow-400">{hdpHomePrice}</span> {/* แสดงราคาน้ำ */}
          </button>
          
          {/* ปุ่มทีมเยือน */}
          <button
            disabled={isResultsPage}
            onClick={() => onBetClick(match, 'away', 'HDP', hdpAwayPrice)}
            className={`flex justify-between px-3 bg-[#4A5568] hover:bg-yellow-600 text-white py-2 rounded-md text-sm font-bold transition duration-200 ${isResultsPage && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>{hdpAwayLine}</span> {/* ใช้ Line ของทีมเยือน */}
            <span className="text-yellow-400">{hdpAwayPrice}</span> {/* แสดงราคาน้ำ */}
          </button>
        </div>

        {/* Over/Under (OU) Row */}
        <div className="grid grid-cols-5 gap-1 mb-2">
          <button
            disabled={isResultsPage}
            onClick={() => onBetClick(match, 'OU', 'Over', ouOverPrice)}
            className={`col-span-2 flex justify-between px-2 bg-[#4A5568] hover:bg-green-600 text-white py-2 rounded-md text-xs font-bold transition duration-200 ${isResultsPage && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>Over</span>
            <span className="text-yellow-400">{ouOverPrice}</span>
          </button>
          
          <div className="col-span-1 bg-[#1A202C] text-yellow-400 flex items-center justify-center rounded-md text-sm font-bold">
            {ouLine}
          </div>
          
          <button
            disabled={isResultsPage}
            onClick={() => onBetClick(match, 'OU', 'Under', ouUnderPrice)}
            className={`col-span-2 flex justify-between px-2 bg-[#4A5568] hover:bg-red-600 text-white py-2 rounded-md text-xs font-bold transition duration-200 ${isResultsPage && 'opacity-50 cursor-not-allowed'}`}
          >
            <span>Under</span>
            <span className="text-yellow-400">{ouUnderPrice}</span>
          </button>
        </div>

        {/* Scores for Results Page */}
        {isResultsPage && (
          <div className="text-center text-2xl font-black text-yellow-400 mt-3 p-2 bg-[#1A202C] rounded">
            FINAL: {homeScore} - {awayScore}
          </div>
        )}
      </div>
    </div>
  );
}