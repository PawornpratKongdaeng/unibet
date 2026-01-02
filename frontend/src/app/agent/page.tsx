"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { LayoutDashboard, Users, BarChart3, History, Settings } from "lucide-react";
import TeamTable from "./components/TeamTable";
import WinLossTable from "./components/WinLossTable";
import CreditLogsTable from "./components/CreditLogsTable";

export default function AgentSystem() {
  const [activeTab, setActiveTab] = useState("team"); // team, winloss, logs
  const [myInfo, setMyInfo] = useState<any>(null);

  // ดึงข้อมูล Agent เอง
  const fetchMyInfo = async () => {
    const res = await apiFetch("/auth/me"); // หรือ path ที่คุณใช้ดึงข้อมูลตัวเอง
    if (res.ok) setMyInfo(await res.json());
  };

  useEffect(() => { fetchMyInfo(); }, []);

  const menu = [
    { id: "team", label: "Team Manager", icon: <Users size={18} /> },
    { id: "winloss", label: "Win/Loss Report", icon: <BarChart3 size={18} /> },
    { id: "logs", label: "Credit Logs", icon: <History size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-6 bg-zinc-900/40 p-3 rounded-[2rem] border border-zinc-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4 px-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-black">
              <LayoutDashboard size={20} />
            </div>
            <h1 className="text-xl font-black italic uppercase tracking-tighter">Agent Terminal</h1>
          </div>
          
          <nav className="flex gap-2">
            {menu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] font-black uppercase transition-all ${
                  activeTab === item.id 
                  ? "bg-white text-black scale-105 shadow-xl shadow-white/10" 
                  : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* View Controller */}
        <main className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
          {activeTab === "team" && <TeamTable myInfo={myInfo} refreshMyInfo={fetchMyInfo} />}
          {activeTab === "winloss" && <WinLossTable agentId={myInfo?.id} />}
          {activeTab === "logs" && <CreditLogsTable />}
        </main>

      </div>
    </div>
  );
}