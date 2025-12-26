"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert";
import SettlementPage from "@/components/settlement";

// นำเข้าหน้าย่อย
import TeamManager from "@/app/agent/views/TeamManager";
import WinLossReport from "@/app/agent/views/WinLossReport";

export default function AgentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [myInfo, setMyInfo] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูลจาก localStorage

  useEffect(() => {
    // ดึงข้อมูลจาก LocalStorage
    const userJson = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userJson || !token) {
      router.push("/login");
      return;
    }

    try {
      const userStore = JSON.parse(userJson);
      if (!userStore.id) {
        router.push("/login");
      } else {
        setMyInfo(userStore);
      }
    } catch (error) {
      console.error("Failed to parse user data", error);
      router.push("/login");
    } finally {
      // ให้รอสักครู่เพื่อให้แน่ใจว่า state myInfo ถูกตั้งค่าแล้วค่อยปิด Loading
      setLoading(false);
    }
  }, [router]);

  // --- ระบบ Logout ---
  const handleLogout = () => {
    localStorage.clear();
    showToast("success", "ออกจากระบบเรียบร้อย");
    router.push("/login");
  };

  // --- ฟังก์ชัน Render เนื้อหาตามเมนูที่เลือก ---
  const renderContent = () => {
    if (!myInfo) return null;

    switch (activeTab) {
      case "dashboard":
        return <TeamManager myInfo={myInfo} />;
      case "reports":
        return <WinLossReport agentId={myInfo?.id} />;
      default:
        return <TeamManager myInfo={myInfo} />;
    }
  };

  // 1. ถ้ากำลังโหลดข้อมูล หรือยังไม่มี myInfo ให้แสดง Spinner ป้องกันหน้าเว็บพัง
  if (loading || !myInfo) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold animate-pulse uppercase tracking-widest text-xs">Loading Agent Panel...</p>
      </div>
    );
  }

  // 2. เมื่อมีข้อมูลครบแล้วค่อย Render หน้า Dashboard จริง
  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-800 transform transition-transform duration-300 lg:translate-x-0 lg:static ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center font-black text-black text-xl shadow-lg shadow-yellow-500/20">
              T
            </div>
            <span className="text-xl font-black text-white tracking-tighter">AGENT PANEL</span>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem 
              icon="🏠" label="จัดการสายงาน" 
              active={activeTab === "dashboard"} 
              onClick={() => { setActiveTab("dashboard"); setIsSidebarOpen(false); }} 
            />
            <NavItem 
              icon="📊" label="รายงาน Win/Loss" 
              active={activeTab === "reports"} 
              onClick={() => { setActiveTab("reports"); setIsSidebarOpen(false); }} 
            />
          </nav>

          <button 
            onClick={handleLogout}
            className="w-full mt-auto flex items-center justify-center gap-2 p-4 text-sm font-bold text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl transition-all active:scale-95"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-md flex items-center px-6 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="lg:hidden p-2 bg-slate-800 rounded-lg mr-4"
          >
            ☰
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ยินดีต้อนรับ</span>
            <span className="text-sm font-black text-white">{myInfo?.username}</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-yellow-500 uppercase">Your Credit</span>
              <span className="text-lg font-black italic text-white leading-none">
                ฿{(myInfo?.credit ?? 0).toLocaleString()}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* ✅ SettlementPage จะไม่พังแล้วเพราะถูกครอบด้วย Loading Guard ด้านบน */}
          <SettlementPage />

          <main className="p-6 lg:p-10 pb-20">
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}

// NavItem Component
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-sm font-black transition-all duration-200 ${
        active 
          ? "bg-yellow-500 text-black shadow-lg shadow-yellow-500/20 scale-[1.02]" 
          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
      }`}
    >
      <span className="text-lg">{icon}</span> {label}
    </button>
  );
}