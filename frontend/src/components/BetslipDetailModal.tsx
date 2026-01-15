"use client";
import { X, Trophy, CheckCircle2, XCircle, Clock } from "lucide-react";

interface BetslipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  betslip: any; // รับข้อมูล Betslip จาก Database
}

export default function BetslipDetailModal({ isOpen, onClose, betslip }: BetslipDetailModalProps) {
  // 1. ถ้าไม่เปิด หรือไม่มีข้อมูล ให้ return null (ป้องกัน Error)
  if (!isOpen || !betslip) return null;

  // 2. ดึง items อย่างปลอดภัย (ถ้าไม่มี items ให้เป็น array ว่าง)
  let items = betslip.items || betslip.bet_details || betslip.bets || [];

  // ถ้าเป็น Single Bet ระบบอาจจะส่งมาเป็น object "match" หรือ "Match" แทนที่จะเป็น array "items"
  // เราต้องแปลงให้เป็น array 1 ตัว เพื่อให้ตารางข้างล่าง render ได้
  if (items.length === 0 && (betslip.Match || betslip.match)) {
    const m = betslip.Match || betslip.match;
    items = [{
      // ดึงข้อมูลทีมจาก object Match
      id: m.id,
      league_name: m.league || m.League || "League",
      home_team: m.home_team || m.HomeTeam,
      away_team: m.away_team || m.AwayTeam,
      match_time: m.match_time || m.MatchTime || m.start_time || m.StartTime,
      
      // ดึงข้อมูลการแทงจากหัวบิล (เพราะ Single Bet ข้อมูลพวกนี้อยู่ที่หัวบิล)
      pick: betslip.pick || betslip.selection || "Single",
      bet_type: betslip.bet_type || "Handicap",
      odds: betslip.odds || betslip.price,
      price: betslip.price, // หรือค่าอื่นที่คุณเก็บราคา
      result: betslip.status // ใช้ status ของบิลไปก่อนสำหรับ Single
    }];
  }
  
  // Helper สำหรับสีของผลแพ้ชนะ
  const getResultColor = (result: string) => {
    const r = result?.toLowerCase() || "";
    if (r.includes("win")) return "text-emerald-600 bg-emerald-50 border-emerald-200";
    if (r.includes("lost") || r.includes("lose")) return "text-rose-600 bg-rose-50 border-rose-200";
    if (r.includes("draw")) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-slate-500 bg-slate-100 border-slate-200"; // Pending or others
  };

  const getResultIcon = (result: string) => {
    const r = result?.toLowerCase() || "";
    if (r.includes("win")) return <CheckCircle2 size={14} />;
    if (r.includes("lost")) return <XCircle size={14} />;
    return <Clock size={14} />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      {/* คลิกพื้นหลังเพื่อปิด */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-start shrink-0">
          <div>
            <h3 className="text-xl font-[1000] uppercase italic tracking-tighter text-slate-900 flex items-center gap-2">
              <Trophy className="text-emerald-600" size={24} />
              Betslip Details
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
              ID: {betslip.voucher_id || betslip.id}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 rounded-full hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white border-b border-slate-100 shrink-0">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User</span>
             <span className="font-bold text-slate-800">{betslip.user?.username || betslip.username || "-"}</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stake</span>
             <span className="font-bold text-slate-800">฿{Number(betslip.total_amount || betslip.amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
             <span className="font-bold text-emerald-600 uppercase">
               {items.length > 1 ? "Mix Parlay" : "Single"}
             </span>
          </div>
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
             <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border ${getResultColor(betslip.status || betslip.remark)}`}>
               {betslip.status || betslip.remark || "PENDING"}
             </span>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="overflow-y-auto p-0 bg-slate-50/50 grow">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm">
              <tr className="text-[10px] font-[1000] text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Match Info</th>
                <th className="px-6 py-3 text-center">Selection</th>
                <th className="px-6 py-3 text-center">Odds</th>
                <th className="px-6 py-3 text-center">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length > 0 ? (
                items.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-white transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                          {item.league_name || "League"}
                        </span>
                        <div className="text-xs font-bold text-slate-700">
                          {item.home_team} <span className="text-slate-400 font-normal">vs</span> {item.away_team}
                        </div>
                        <span className="text-[10px] text-slate-400">
                           Kickoff: {item.match_time ? new Date(item.match_time).toLocaleString() : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex flex-col items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                        <span className="text-xs font-black text-slate-800 uppercase">
                          {item.pick || item.side}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                           {item.bet_type_name || item.bet_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-emerald-600">
                          {item.odds}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                           (Price: {item.price || "-"})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black uppercase border ${getResultColor(item.result || "PENDING")}`}>
                         {getResultIcon(item.result || "PENDING")}
                         {item.result || "PENDING"}
                       </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-bold text-sm italic">
                    No match items found in this betslip.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0 flex justify-end">
           <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500 font-bold">Total Payout:</span>
              <span className={`text-xl font-[1000] tracking-tighter ${
                (betslip.status === 'won' || betslip.status === 'win') ? 'text-emerald-600' : 'text-slate-900'
              }`}>
                ฿{Number(betslip.total_payout || 0).toLocaleString()}
              </span>
           </div>
        </div>

      </div>
    </div>
  );
}