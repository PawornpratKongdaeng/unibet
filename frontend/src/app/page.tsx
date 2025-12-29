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

const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export default function Home() {
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [endpoint, setEndpoint] = useState<string>("live"); // เริ่มที่ live หรือ body-goalboung ตาม API
  const router = useRouter();
  const { balance, refreshBalance } = useWallet();

  // เรียก API ผ่าน Backend Proxy ของคุณ (แนะนำให้ตั้งชื่อตาม endpoint ของ HtayAPI)
  const { data, isLoading } = useSWR(
    `/match/${endpoint}`, 
    fetcher,
    { refreshInterval: 5000 } // อัปเดตทุก 5 วินาทีเพราะเป็นราคาพม่า
  );

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) router.push("/auth"); 
  }, [router]);

  // HtayAPI ส่งข้อมูลมาใน data.data
  const matches = data?.data || [];

  const handleBetClick = (match: any, side: string, type: string, oddsValue: any) => {
    // Mapping ชื่อทีมให้ตรงกับสิ่งที่ UI ต้องการ
    const teamName = side === 'home' ? match.home_name : match.away_name;
    
    setSelectedBet({ 
        match, 
        side,    
        type,    
        team: teamName, 
        odds: oddsValue,
        hdp: type === 'HDP' ? match.hdp : match.ou_total // ถ้าแทงสูงต่ำให้ใช้ราคา OU
    });
  };

  const handleConfirmBet = async (amount: number) => {
  if (!selectedBet) return;
  
  // 💡 ดึง match object ออกมาเพื่อให้เรียกใช้ง่ายๆ
  const m = selectedBet.match;

  const payload = {
    match_id: String(m.id || m.match_id), 
    // ✅ ปรับตรงนี้: ดึงค่าจากทุกความเป็นไปได้ (เหมือนใน MatchCard)
    home_team: m.home_name || m.home_team || "Home Team",
    away_team: m.away_name || m.away_team || "Away Team",
    home_logo: m.home_logo || m.home_team_image_url || "",
    away_logo: m.away_logo || m.away_team_image_url || "",
    
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
        showToast('error', result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      showToast('error', 'การเชื่อมต่อขัดข้อง');
    }
  };

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
        
        <div className="bg-slate-900/50 text-slate-500 py-3 text-center text-[9px] font-black uppercase tracking-[0.2em] border-y border-slate-800/30">
          HtayAPI Live <span className="text-yellow-500 ml-2">{endpoint.toUpperCase()}</span>
        </div>

        {isLoading && <div className="py-20 text-center animate-pulse">Loading Matches...</div>}

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mt-6">
  {matches.map((match: Match, i: number) => (
  <div key={match.id || match.ID || i} className="w-full">
    <MatchCard 
      match={match}
      isResultsPage={endpoint === "results"} 
      isLive={endpoint === "live"} // ✅ ถ้า endpoint คือ live ปุ่มจะโดนล็อคทันที
      onBetClick={handleBetClick}
    />
  </div>
))}
</div>
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