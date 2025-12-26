"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import useSWR from "swr";
import Header from "../components/Header";
import EndpointSelector from "../components/EndpointSelector";
import MatchCard from "../components/MatchCard";
import BetSlipModal from "../components/BetSlipModal";
import { showToast } from "@/lib/sweetAlert"; 
import { apiFetch } from "@/lib/api"; 
import { useWallet } from "../context/WalletContext"; 

interface Match {
  id: string | number;
  ID?: number;
  home_team: string;
  away_team: string;
  hdp: string;
  league_name?: string;
}

interface SelectedBet {
  match: any;
  side: string;
  type: string;
  team: string;
  odds: string | number;
  hdp: string;
}

const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export default function Home() {
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [endpoint, setEndpoint] = useState<string>("moung");
  const router = useRouter();
  const { balance, refreshBalance } = useWallet();

  const { data, isLoading } = useSWR(
    `/match/${endpoint}`, 
    fetcher,
    { refreshInterval: 10000 }
  );

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth"); 
    }
  }, [router]);

  const matches: Match[] = data?.data || (Array.isArray(data) ? data : []);

  const handleBetClick = (match: Match, side: string, type: string, oddsValue: string | number) => {
    const teamName = side === 'home' ? (match.home_team || 'Home') : (match.away_team || 'Away');
    setSelectedBet({ 
        match, 
        side,    
        type,    
        team: teamName, 
        odds: oddsValue,
        hdp: match.hdp || "0"
    });
  };

  const handleConfirmBet = async (amount: number) => {
    if (!selectedBet) return;
    if (amount > balance) {
      showToast('error', 'ยอดเงินคงเหลือไม่เพียงพอ');
      return;
    }
    if (amount < 50) {
      showToast('error', 'เดิมพันขั้นต่ำ 50 บาท');
      return;
    }

    const payload = {
      match_id: String(selectedBet.match.id || selectedBet.match.ID), 
      side: selectedBet.side,   
      type: selectedBet.type,   
      odds: parseFloat(String(selectedBet.odds)), 
      amount: amount,
      hdp: String(selectedBet.hdp || "0")
    };

    try {
      const res = await apiFetch("/bet", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok) {
        showToast('success', 'วางเดิมพันสำเร็จ!');
        setSelectedBet(null); 
        refreshBalance();
      } else {
        showToast('error', result.error || 'เกิดข้อผิดพลาดในการวางเดิมพัน');
      }
    } catch (error) {
      showToast('error', 'ไม่สามารถเชื่อมต่อกับระบบเดิมพันได้');
    }
  };

  return (
    // เพิ่ม padding-bottom สำหรับ mobile navigation และรองรับ safe area
    <main className="min-h-screen bg-[#020617] text-white pb-24 sm:pb-12 font-sans overflow-x-hidden">
      <Header />

      {/* Wrapper สำหรับเนื้อหาเพื่อจัดการความกว้าง */}
      <div className="max-w-4xl mx-auto">
        
        {/* ส่วนเลือกประเภทการแข่งขัน - ปรับให้ติดขอบบนได้ถ้าต้องการ (Sticky) */}
        <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md">
          <EndpointSelector 
            currentEndpoint={endpoint} 
            setEndpoint={(val: string) => { setEndpoint(val); setSelectedBet(null); }} 
          />
        </div>
        
        {/* วันที่และตารางเวลา - ปรับ Font size ให้เหมาะกับมือถือ */}
        <div className="bg-slate-900/50 text-slate-500 py-3 text-center text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] shadow-inner border-y border-slate-800/30">
          Today's Schedule <span className="text-yellow-500 ml-2">{new Date().toLocaleDateString('th-TH')}</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-600">
             <div className="w-10 h-10 border-4 border-yellow-500/10 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
             <p className="text-[10px] font-black tracking-[0.2em] uppercase animate-pulse">Fetching Live Data...</p>
          </div>
        )}

        {/* Empty State - ปรับขนาด Padding และ Icon ให้ยืดหยุ่น */}
        {!isLoading && matches.length === 0 && (
          <div className="text-center py-20 sm:py-32 bg-slate-900/30 rounded-[2rem] sm:rounded-[3rem] mx-4 mt-6 border border-dashed border-slate-800/50">
            <span className="text-4xl sm:text-6xl mb-4 block opacity-20">🏟️</span>
            <p className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-600 px-4">
              No active matches in <span className="text-slate-400">{endpoint}</span>
            </p>
          </div>
        )}

        {/* Match List Grid - ปรับจาก 1 เป็น 2 คอลัมน์ในจอใหญ่ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-6">
          {matches.map((match: Match, i: number) => (
            <div key={match.id || match.ID || i} className="w-full">
              <MatchCard 
                match={match}
                isResultsPage={endpoint === "results"}
                onBetClick={handleBetClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal - ตัวนี้ปรับ Responsive ภายในคอมโพเนนต์เองแล้ว */}
      {selectedBet && (
        <BetSlipModal 
          selectedBet={selectedBet}
          onClose={() => setSelectedBet(null)}
          onConfirm={handleConfirmBet}
        />
      )}
    </main>
  );
}