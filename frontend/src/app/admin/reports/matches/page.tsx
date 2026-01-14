"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import { Loader2, Search, RefreshCw, Calendar, Trophy, Hash, TrendingUp } from "lucide-react";

// --- Types ---
interface MatchSummary {
  match_id: string;
  home_team: string;
  away_team: string;
  total_home: number;
  total_away: number;
  total_over: number;
  total_under: number;
  total_even: number;
}

// --- Sub-components ---

/** ส่วนแสดงตัวเลขเงินเดิมพัน */
const ValueCell = ({ value, isTotal = false }: { value: number; isTotal?: boolean }) => {
  const safeVal = Number(value || 0);
  if (safeVal === 0) return <td className="p-4 text-right text-zinc-300 font-medium">-</td>;

  return (
    <td className={`p-4 text-right ${isTotal ? "bg-zinc-800/50" : ""}`}>
      <span
        className={`text-lg font-black tracking-tight italic ${
          isTotal ? "text-emerald-400" : "text-orange-500"
        }`}
      >
        {safeVal.toLocaleString(undefined, { minimumFractionDigits: 0 })}
      </span>
    </td>
  );
};

// --- Main Component ---

const fetcher = (url: string) => apiFetch(url).then((res) => (res.ok ? res.json() : []));

export default function ExposurePage() {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toLocaleDateString("en-CA"));
  const [searchTerm, setSearchTerm] = useState("");

  const { data, isLoading, mutate } = useSWR<MatchSummary[]>(
    `/api/v3/admin/matches-summary?date=${selectedDate}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const matches = data || [];

  // Filter Logic
  const filteredMatches = useMemo(() => {
    return matches.filter((m) =>
      `${m.home_team} ${m.away_team}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [matches, searchTerm]);

  // Grand Totals Logic
  const grandTotals = useMemo(() => {
    return filteredMatches.reduce(
      (acc, m) => ({
        h: acc.h + (m.total_home || 0),
        a: acc.a + (m.total_away || 0),
        o: acc.o + (m.total_over || 0),
        u: acc.u + (m.total_under || 0),
        e: acc.e + (m.total_even || 0),
      }),
      { h: 0, a: 0, o: 0, u: 0, e: 0 }
    );
  }, [filteredMatches]);

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-600 rounded-lg text-white">
                <Trophy size={20} />
              </div>
              <h2 className="text-sm font-bold text-emerald-700 uppercase tracking-widest">Administrator</h2>
            </div>
            <h1 className="text-5xl font-black text-zinc-900 italic tracking-tighter uppercase">
              Match <span className="text-emerald-600">Exposure</span>
            </h1>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="date"
                className="pl-11 pr-4 py-3 bg-white rounded-xl shadow-sm border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold transition-all"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="ค้นหาทีม..."
                className="pl-11 pr-4 py-3 bg-white rounded-xl shadow-sm border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold w-64 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => mutate()}
              className="p-3.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 active:scale-95 transition-all shadow-lg"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* --- Table Section --- */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-zinc-200/50 border border-zinc-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-black text-zinc-500 uppercase tracking-[0.15em] italic">
                  <th className="p-6 text-left">Match Details</th>
                  <th className="p-6 text-right">Home (1)</th>
                  <th className="p-6 text-right bg-zinc-100/50">Away (2)</th>
                  <th className="p-6 text-right">Over (O)</th>
                  <th className="p-6 text-right bg-zinc-100/50">Under (U)</th>
                  <th className="p-6 text-right">Draw/Even</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-zinc-50">
                {isLoading && matches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <Loader2 className="animate-spin inline-block text-emerald-600 mb-4" size={40} />
                      <p className="text-zinc-400 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Live Data...</p>
                    </td>
                  </tr>
                ) : filteredMatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-32 text-center">
                      <div className="inline-flex p-4 bg-zinc-50 rounded-full mb-4 text-zinc-300">
                        <Hash size={40} />
                      </div>
                      <p className="text-zinc-400 font-black italic uppercase text-xl">No match entries found</p>
                    </td>
                  </tr>
                ) : (
                  filteredMatches.map((m) => (
                    <tr key={m.match_id} className="hover:bg-emerald-50/30 transition-colors group">
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-xl font-extrabold text-zinc-800 italic uppercase leading-tight group-hover:text-emerald-700 transition-colors">
                            {m.home_team} <span className="text-zinc-300 mx-1 not-italic font-medium text-sm">VS</span> {m.away_team}
                          </span>
                          <code className="text-[10px] text-zinc-400 font-bold mt-1.5 bg-zinc-50 self-start px-2 py-0.5 rounded border border-zinc-100 uppercase tracking-tighter">
                            Match ID: {m.match_id}
                          </code>
                        </div>
                      </td>
                      <ValueCell value={m.total_home} />
                      <ValueCell value={m.total_away} />
                      <ValueCell value={m.total_over} />
                      <ValueCell value={m.total_under} />
                      <ValueCell value={m.total_even} />
                    </tr>
                  ))
                )}
              </tbody>

              {/* Grand Total Footer */}
              {filteredMatches.length > 0 && (
                <tfoot className="bg-zinc-900 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] relative z-10">
                  <tr className="border-t border-zinc-800 italic">
                    <td className="p-8">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-emerald-400" size={24} />
                        <span className="text-2xl font-black uppercase tracking-tighter text-white">Totals</span>
                      </div>
                    </td>
                    <ValueCell value={grandTotals.h} isTotal />
                    <ValueCell value={grandTotals.a} isTotal />
                    <ValueCell value={grandTotals.o} isTotal />
                    <ValueCell value={grandTotals.u} isTotal />
                    <ValueCell value={grandTotals.e} isTotal />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}