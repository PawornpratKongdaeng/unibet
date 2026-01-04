"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
// ไอคอนตัวอย่าง (หากคุณมีชุดไอคอนของคุณเอง ให้เปลี่ยนส่วนนี้)
import { Trophy, Layers, Ticket, History, Download, Upload, Settings, PlayCircle, LogOut, Server, User } from "lucide-react";

import Header from "../components/Header";
// EndpointSelector และ MatchCard ไม่ได้ใช้ในหน้านี้ตามรูปภาพ จึง comment ไว้ก่อน
// import EndpointSelector from "../components/EndpointSelector";
// import MatchCard from "../components/MatchCard";
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
  // state endpoint อาจไม่ได้ใช้ในหน้านี้แล้ว แต่เก็บไว้ไม่เสียหายหากมีการย้ายหน้า
  const [endpoint, setEndpoint] = useState<string>("live");
  const router = useRouter();

  // ดึง balance และ userData (ถ้ามี) จาก context
  const walletContext = useWallet() as any;
  const { balance, refreshBalance } = walletContext;
  // Mockup ชื่อผู้ใช้ เนื่องจากใน context อาจไม่มี (ปรับแก้ตามจริง)
  const usernameMock = "THUNIBET28290";


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

  // การดึงข้อมูล Match ยังคงทำงานอยู่เบื้องหลัง (ถ้าไม่ต้องการให้ดึงในหน้านี้ ควรย้ายไป page อื่น)
  const { data, isLoading } = useSWR(
    `/match/${endpoint}`,
    fetcher,
    { refreshInterval: 5000 }
  );

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (!token) {
      window.location.replace("/login");
    }
  }, []);

  // --- Handlers (เก็บไว้ใช้ร่วมกับ BetSlipModal) ---
  // ฟังก์ชัน handleBetClick ไม่ได้ถูกเรียกใช้จากปุ่มในหน้า Dashboard นี้โดยตรง
  // แต่เก็บไว้เผื่อกรณีมี logic เรียก Modal
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

  // ข้อมูลสำหรับปุ่ม Navigation Grid
  const navItems = [
    { icon: Trophy, label: "SPORTS BETTING", subLabel: "MATCH LIST", link: "/matchone" }, // ตัวอย่างลิงก์ไปหน้าเดิมพัน
    { icon: Layers, label: "MIXED PARLAY", subLabel: "MULTI BET", link: "/matches" },
    { icon: Ticket, label: "MY VOUCHERS", subLabel: "BETTING HISTORY", link: "/history" },
    { icon: History, label: "TRANSACTIONS", subLabel: "FINANCE LOGS", link: "/transactions" },
    { icon: Download, label: "DEPOSIT", subLabel: "ADD FUNDS", link: "/deposit" },
    { icon: Upload, label: "WITHDRAW", subLabel: "CASH OUT", link: "/withdraw" },
    { icon: Settings, label: "SETTINGS", subLabel: "PROFILE INFO", link: "/settings" },
    { icon: PlayCircle, label: "LIVE STREAM", subLabel: "WATCH NOW", link: "/live" },
  ];

  return (
    // 1. เปลี่ยน Background หลักเป็นสีเขียวเข้มตามรูป
    <main className="min-h-screen bg-[#013323] text-white pb-24 sm:pb-12 font-sans overflow-x-hidden font-bold">
      {/* Header ควรปรับให้รองรับ Dark Theme */}
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-6">

        {/* 2. Hero Banner Section */}
        <div className="rounded-3xl bg-gradient-to-b from-[#034a31] to-[#046c48] p-6 mb-6 shadow-lg relative overflow-hidden min-h-[160px] flex items-center">
          {/* Background Pattern (Optional - ใส่เพื่อให้ดูมีมิติขึ้น) */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent pointer-events-none"></div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold italic tracking-wide leading-tight">
              PREMIUM
              <br />
              SPORT ENGINE
            </h1>
          </div>
        </div>

        {/* 3. Profile & Balance Section */}
        <div className="bg-[#022c1e] rounded-2xl p-4 mb-6 flex justify-between items-center shadow-md border border-[#044630]">
          <div className="flex items-center space-x-4">
            {/* User Avatar Icon */}
            <div className="w-12 h-12 bg-[#00b359] rounded-full flex items-center justify-center border-2 border-[#00b359]/30">
              <User className="w-6 h-6 text-[#013323]" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-wider">{usernameMock}</h2>
               {/* Mockup เบอร์โทร หรือ ID ถ้ามี */}
              <p className="text-[10px] text-emerald-400/70 tracking-widest">ID: 885-948-9183</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[10px] text-emerald-400/70 uppercase tracking-widest mb-1">Available Credit</p>
             {/* แสดง Balance ที่ดึงมาจาก Context */}
            <div className="text-3xl font-extrabold text-[#00b359] flex items-baseline justify-end tracking-tighter">
              <span className="text-xl mr-1">฿</span>
              {balance ? balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
            </div>
          </div>
        </div>

        {/* 4. Navigation Grid Section (ปุ่มขาว 8 ปุ่ม) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {navItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.link)} // นำทางไปยังหน้าอื่นๆ
              className="bg-white rounded-2xl py-6 px-2 flex flex-col items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 group"
            >
              {/* Icon Container */}
              <div className="mb-3 p-2 rounded-full border-2 border-[#00b359]/20 group-hover:border-[#00b359] transition-colors">
                 {/* ใช้สีเขียวสดสำหรับไอคอน */}
                <item.icon className="w-6 h-6 text-[#00b359]" strokeWidth={2.5} />
              </div>
              {/* Main Label */}
              <span className="text-[#013323] font-extrabold text-xs sm:text-sm tracking-wider mb-1">
                {item.label}
              </span>
               {/* Sub Label */}
              <span className="text-zinc-400 text-[9px] font-bold tracking-widest uppercase">
                {item.subLabel}
              </span>
            </button>
          ))}
        </div>

        {/* 5. Footer Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Sign Out Button (Red) */}
            <button className="w-full md:w-auto flex-1 bg-[#3b1215] border border-rose-900/50 text-rose-500 rounded-xl py-3 px-6 flex items-center justify-center space-x-2 font-extrabold tracking-widest text-xs hover:bg-[#4a171b] transition-colors">
               <LogOut className="w-4 h-4 transform rotate-180" />
               <span>SIGN OUT SYSTEM</span>
            </button>

            {/* Server Status (Green) */}
             <div className="w-full md:w-auto flex-1 bg-[#022c1e] border border-[#044630] text-[#00b359] rounded-xl py-3 px-6 flex items-center justify-center space-x-2 font-extrabold tracking-widest text-[10px] uppercase">
               <Server className="w-4 h-4" />
               <span>Server Status: Operational</span>
            </div>
        </div>


        {/* --- UI เดิมที่ถูกซ่อนไว้ (ตามรูปภาพ Dashboard ไม่ได้แสดงส่วนนี้) --- */}
        {/*
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
          <EndpointSelector
            currentEndpoint={endpoint}
            setEndpoint={(val: string) => { setEndpoint(val); setSelectedBet(null); }}
          />
        </div>

        {settings.maintenance_mode && (
          <div className="bg-rose-500 text-white text-[10px] font-bold py-2 text-center uppercase tracking-widest">
            ⚠️ System Maintenance: Betting is currently disabled
          </div>
        )}

        <div className="bg-emerald-50 text-emerald-700 py-3 text-center text-[9px] font-bold uppercase tracking-[0.2em] border-b border-emerald-100">
          Network Status: <span className="text-emerald-600 underline">Active</span>
          <span className="text-emerald-200 mx-2">|</span>
          Endpoint: <span className="text-emerald-800">{endpoint.toUpperCase()}</span>
        </div>

        {isLoading && (
          <div className="py-20 text-center">
             <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-emerald-700 text-[10px] font-bold tracking-widest uppercase">Fetching Data...</p>
          </div>
        )}

        {!isLoading && matches.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs uppercase tracking-widest">
            No active matches found in {endpoint}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-4 mt-6">
            {matches.map((match: any, i: number) => (
              <div key={match.id || i} className="w-full drop-shadow-sm">
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
        */}
      </div>

      {/* Bet Slip Modal ยังคงเก็บไว้ เผื่อมีการเรียกใช้ */}
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