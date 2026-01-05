"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { Trophy, Layers, Ticket, History, Download, Upload, Settings, PlayCircle, LogOut, Server, User, RefreshCcw } from "lucide-react";

import Header from "../components/Header";
import BetSlipModal from "../components/BetSlipModal";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";
import { useWallet } from "../context/WalletContext";

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
  const router = useRouter();
  
  // Wallet Context
  const walletContext = useWallet() as any;
  const { balance, refreshBalance } = walletContext;
  
  const usernameMock = "THUNIBET28290";
  const Modal = BetSlipModal as any;

  // Configuration SWR
  const { data: configData } = useSWR("/settings", fetcher, {
    refreshInterval: 30000,
    shouldRetryOnError: false
  });

  const settings = configData || {
    maintenance_mode: false,
    min_bet: 10,
    max_bet: 10000,
    contact_line: "@admin"
  };

  // Auth Protection
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.replace("/login");
    }
  }, []);

  // --- Betting Logic ---
  const handleConfirmBet = async (amount: number) => {
    if (!selectedBet) return;
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

  const navItems = [
    { icon: Trophy, label: "SPORTS", subLabel: "MATCH LIST", link: "/matchone" },
    { icon: Layers, label: "PARLAY", subLabel: "MULTI BET", link: "/matches" },
    { icon: Ticket, label: "VOUCHERS", subLabel: "HISTORY", link: "/history" },
    { icon: History, label: "FINANCE", subLabel: "LOGS", link: "/transactions" },
    { icon: Download, label: "DEPOSIT", subLabel: "ADD FUNDS", link: "/deposit" },
    { icon: Upload, label: "WITHDRAW", subLabel: "CASH OUT", link: "/withdraw" },
    { icon: Settings, label: "SETTINGS", subLabel: "PROFILE", link: "/settings" },
    { icon: PlayCircle, label: "LIVE", subLabel: "WATCH NOW", link: "/live" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.replace("/login");
  };

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-12 font-sans overflow-x-hidden">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 md:pt-10">

        {/* 1. Hero Banner */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-[#034a31] via-[#046c48] to-[#013323] p-8 md:p-14 mb-8 shadow-2xl relative overflow-hidden flex items-center border border-white/10">
          <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-emerald-400/20 rounded-full blur-[80px]"></div>
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter leading-[0.85]">
              PREMIUM<br />
              <span className="text-emerald-400">SPORT ENGINE</span>
            </h1>
            <p className="mt-4 text-[10px] md:text-xs font-black tracking-[0.4em] opacity-40 uppercase">Thunibet Professional System</p>
          </div>
        </div>

        {/* 2. Profile & Balance */}
        <div className="bg-[#022c1e] rounded-3xl p-5 md:p-8 mb-8 flex flex-col sm:flex-row gap-6 justify-between items-center shadow-xl border border-[#044630]">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="w-14 h-14 md:w-16 md:h-16 bg-emerald-500 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <User className="w-8 h-8 text-[#013323] -rotate-3" />
            </div>
            <div className="truncate">
              <h2 className="text-xl md:text-2xl font-black tracking-tight truncate">{usernameMock}</h2>
              <p className="text-[10px] md:text-xs text-emerald-400/50 font-bold tracking-widest mt-0.5">ID: 885-948-9183</p>
            </div>
          </div>
          
          <div className="text-center sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-[#044630] pt-4 sm:pt-0">
            <p className="text-[10px] text-emerald-400/60 uppercase font-black tracking-[0.2em] mb-1">Available Credit</p>
            <div className="text-3xl md:text-5xl font-black text-emerald-400 flex items-baseline justify-center sm:justify-end tracking-tighter tabular-nums">
              <span className="text-xl md:text-2xl mr-2 font-bold opacity-80">฿</span>
              {balance ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
              <button 
                onClick={() => refreshBalance()} 
                className="ml-3 p-2 hover:bg-emerald-500/10 rounded-full transition-all active:rotate-180 duration-500"
              >
                 <RefreshCcw size={18} className="text-emerald-400/40" />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Navigation Grid */}
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 mb-10">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.link)}
              className="bg-white rounded-[2rem] py-6 md:py-10 px-4 flex flex-col items-center justify-center shadow-lg transition-all hover:-translate-y-2 active:scale-95 group border-b-4 border-slate-200"
            >
              <div className="mb-4 p-4 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <item.icon className="w-7 h-7 md:w-8 md:h-8" strokeWidth={2.5} />
              </div>
              <span className="text-[#013323] font-black text-xs md:text-sm tracking-tight mb-1">
                {item.label}
              </span>
              <span className="text-slate-400 text-[9px] md:text-[10px] font-black tracking-widest uppercase opacity-80">
                {item.subLabel}
              </span>
            </button>
          ))}
        </div>

        {/* 4. Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-center mb-12">
            <button 
              onClick={handleLogout}
              className="w-full sm:flex-1 bg-rose-950/20 border border-rose-900/40 text-rose-500 rounded-[1.5rem] py-5 px-6 flex items-center justify-center gap-3 font-black tracking-[0.1em] text-[11px] md:text-xs hover:bg-rose-900/30 transition-all uppercase active:scale-[0.98]"
            >
               <LogOut size={18} />
               <span>Sign Out System</span>
            </button>

             <div className="w-full sm:flex-1 bg-emerald-950/20 border border-emerald-900/40 text-emerald-500 rounded-[1.5rem] py-5 px-6 flex items-center justify-center gap-3 font-black tracking-[0.1em] text-[10px] md:text-[11px] uppercase">
               <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
               </span>
               <span className="opacity-80">Server: Operational</span>
            </div>
        </div>
      </div>

      {selectedBet && (
        <Modal
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