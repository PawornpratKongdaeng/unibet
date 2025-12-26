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

// --- 1. กำหนด Interfaces ให้ TypeScript รู้จักโครงสร้างข้อมูล ---
interface Match {
  id: string | number;
  ID?: number; // รองรับ ID จาก GORM
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

// Fetcher พร้อมระบุประเภท Argument
const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export default function Home() {
  const [selectedBet, setSelectedBet] = useState<SelectedBet | null>(null);
  const [endpoint, setEndpoint] = useState<string>("moung");
  const router = useRouter();
  
  // ✅ ดึง balance มาเช็คก่อนส่ง API
  const { balance, refreshBalance } = useWallet();

  // 1. ดึงข้อมูลคู่บอล
  const { data, isLoading } = useSWR(
    `/match/${endpoint}`, 
    fetcher,
    { refreshInterval: 10000 }
  );

  // 2. ตรวจสอบสิทธิ์การเข้าใช้งาน
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      router.push("/auth"); 
    }
  }, [router]);

  const matches: Match[] = data?.data || (Array.isArray(data) ? data : []);

  // 3. ✅ แก้ไข: ระบุ Types ให้พารามิเตอร์ของ handleBetClick
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

  // 4. ✅ แก้ไข: ระบุ Type ให้ amount
  const handleConfirmBet = async (amount: number) => {
    if (!selectedBet) return;

    // 🚩 เช็คเงินในกระเป๋าที่หน้า Home อีกรอบ (Security Check)
    if (amount > balance) {
      showToast('error', 'ยอดเงินคงเหลือไม่เพียงพอ');
      return;
    }

    // 🚩 เช็คขั้นต่ำ 50 บาท
    if (amount < 50) {
      showToast('error', 'เดิมพันขั้นต่ำ 50 บาท');
      return;
    }

    const payload = {
      match_id: String(selectedBet.match.id || selectedBet.match.ID), 
      side: selectedBet.side,   
      type: selectedBet.type,   
      odds: parseFloat(String(selectedBet.odds)), 
      amount: amount, // ส่งเป็นตัวเลขไปเลย
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
        refreshBalance(); // 💰 อัปเดตเงินใน WalletContext ทันที
      } else {
        showToast('error', result.error || 'เกิดข้อผิดพลาดในการวางเดิมพัน');
      }
    } catch (error) {
      console.error("Betting Error:", error);
      showToast('error', 'ไม่สามารถเชื่อมต่อกับระบบเดิมพันได้');
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20 font-sans">
      <Header />

      <EndpointSelector 
        currentEndpoint={endpoint} 
        setEndpoint={(val: string) => { setEndpoint(val); setSelectedBet(null); }} 
      />
      
      <div className="bg-slate-900 text-slate-500 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.3em] shadow-inner mb-4 border-y border-slate-800/50">
        Today's Schedule <span className="text-yellow-500 ml-2">{new Date().toLocaleDateString('th-TH')}</span>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-600">
           <div className="w-8 h-8 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
           <p className="text-xs font-black tracking-widest uppercase">Fetching Live Data...</p>
        </div>
      )}

      {!isLoading && matches.length === 0 && (
        <div className="text-center py-24 bg-slate-900/50 rounded-[3rem] mx-6 mt-4 border border-dashed border-slate-800">
          <span className="text-5xl mb-6 block opacity-20">🏟️</span>
          <p className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-600">No active matches in {endpoint}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 px-4 max-w-2xl mx-auto">
        {matches.map((match: Match, i: number) => (
          <MatchCard 
            key={match.id || match.ID || i}
            match={match}
            isResultsPage={endpoint === "results"}
            onBetClick={handleBetClick}
          />
        ))}
      </div>

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