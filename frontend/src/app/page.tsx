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

// ✅ Fetcher ที่รองรับการเช็ค Status Error
const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.message || 'An error occurred');
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

export default function Home() {
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [endpoint, setEndpoint] = useState<string>("live");
  const router = useRouter();
  const { refreshBalance } = useWallet() as any;

  // 1. ✅ ดึงข้อมูล System Settings
  // หาก User ธรรมดาเรียก /admin/settings จะติด 403 ให้ใช้ค่า Fallback ด้านล่าง
  const { data: configData, error: configError } = useSWR("/settings", fetcher, {
    refreshInterval: 30000,
    shouldRetryOnError: false 
  });

  // ค่าตั้งต้นในกรณีที่ดึงจาก Backend ไม่ได้ (ป้องกันหน้าเว็บพัง)
  const settings = configData || {
    maintenance_mode: false,
    min_bet: 10,
    max_bet: 10000,
    contact_line: "@admin"
  };

  // 2. ✅ ดึงข้อมูลคู่บอล
  const { data, isLoading, error: matchError } = useSWR(
    `/match/${endpoint}`, 
    fetcher,
    { refreshInterval: 5000 }
  );

  // 3. ✅ ตรวจสอบการ Login
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.replace("/login");
    }
  }, []);

  const matches = data?.data || [];

  // --- Handlers ---

  const handleBetClick = (match: any, side: string, type: string, oddsValue: any) => {
    // เช็ค Maintenance Mode
    if (settings.maintenance_mode) {
      showToast('error', 'ระบบปิดปรับปรุงชั่วคราว ไม่สามารถวางเดิมพันได้');
      return;
    }

    const teamName = side === 'home' ? match.home_name : match.away_name;
    setSelectedBet({ 
        match, 
        side,    
        type,    
        team: teamName, 
        odds: oddsValue,
        hdp: type === 'HDP' ? match.hdp : match.ou_total 
    });
  };

  const handleConfirmBet = async (amount: number) => {
    if (!selectedBet) return;
    
    // ตรวจสอบขั้นต่ำ/สูงสุด
    if (amount < settings.min_bet) {
      showToast('error', `เดิมพันขั้นต่ำคือ ${settings.min_bet} บาท`);
      return;
    }
    if (amount > settings.max_bet) {
      showToast('error', `เดิมพันสูงสุดคือ ${settings.max_bet} บาท`);
      return;
    }

    const m = selectedBet.match;
    const payload = {
      match_id: String(m.id || m.match_id), 
      home_team: m.home_name || m.home_team,
      away_team: m.away_name || m.away_team,
      home_logo: m.home_logo || m.home_team_image_url,
      away_logo: m.away_logo || m.away_team_image_url,
      pick: selectedBet.side,   
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
        showToast('error', result.error || 'การวางเดิมพันไม่สำเร็จ');
      }
    } catch (error) {
      showToast('error', 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  // --- Render Logic ---

  // กรณี Backend กั้นสิทธิ์คู่บอลผิด (ขึ้น 403)
  if (matchError?.status === 403) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-rose-500 mb-2">ACCESS RESTRICTED</h1>
          <p className="text-zinc-500">บัญชีของคุณไม่มีสิทธิ์เข้าถึงข้อมูลส่วนนี้ กรุณาติดต่อฝ่ายบริการลูกค้า</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-24 sm:pb-12 font-sans overflow-x-hidden">
      <Header />
      
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 z-40 bg-[#020617]/80 backdrop-blur-md">
          <EndpointSelector 
            currentEndpoint={endpoint} 
            setEndpoint={(val: string) => { setEndpoint(val); setSelectedBet(null); }} 
          />
        </div>
        
        {/* แถบแจ้งเตือนปิดปรับปรุง */}
        {settings.maintenance_mode && (
          <div className="bg-rose-600 text-white text-[10px] font-black py-2 text-center uppercase tracking-[0.3em] animate-pulse">
            ⚠️ System Maintenance: Betting is currently disabled
          </div>
        )}

        <div className="bg-slate-900/50 text-slate-500 py-3 text-center text-[9px] font-black uppercase tracking-[0.2em] border-y border-slate-800/30">
          Network Status: <span className="text-emerald-500">Active</span> 
          <span className="text-zinc-700 mx-2">|</span>
          Endpoint: <span className="text-yellow-500">{endpoint.toUpperCase()}</span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-20 text-center">
             <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-zinc-500 text-[10px] font-black tracking-widest uppercase">Loading Matches...</p>
          </div>
        )}

        {/* Match List */}
        {!isLoading && matches.length === 0 ? (
          <div className="py-20 text-center text-zinc-600 text-xs uppercase tracking-widest italic">
            No active matches found in {endpoint}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-6">
            {matches.map((match: any, i: number) => (
              <div key={match.id || i} className="w-full">
                <MatchCard 
                  match={match}
                  isResultsPage={endpoint === "results"} 
                  isLive={endpoint === "live"}
                  isMaintenance={settings.maintenance_mode} 
                  onBetClick={handleBetClick}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bet Slip Modal */}
      {selectedBet && (
        <BetSlipModal 
          selectedBet={selectedBet}
          minBet={Number(settings.min_bet)}
          maxBet={Number(settings.max_bet)}
          onClose={() => setSelectedBet(null)}
          onConfirm={handleConfirmBet}
        />
      )}
    </main>
  );
}