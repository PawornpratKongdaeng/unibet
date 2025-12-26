"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // สำหรับ Redirect ไปหน้า Login
import { showToast } from "@/lib/sweetAlert";
import SettlementPage from "@/components/settlement";

// นำเข้าหน้าย่อย (เดี๋ยวเราจะสร้างข้างล่างนี้)
import TeamManager from "@/app/agent/views/TeamManager";
import WinLossReport from "@/app/agent/views/WinLossReport";

export default function AgentDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard"); // 'dashboard' | 'reports' | 'finance'
  const [myInfo, setMyInfo] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const userStore = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    if (!userStore.id || !token) {
      router.push("/login"); // ถ้าไม่มีสิทธิ์ ให้ดีดออกไปหน้า Login
    } else {
      setMyInfo(userStore);
    }
  }, [router]);

  // --- ระบบ Logout ---
  const handleLogout = () => {
    localStorage.clear(); // ล้างข้อมูลทั้งหมด
    showToast("success", "ออกจากระบบเรียบร้อย");
    router.push("/login"); // ดีดไปหน้า Login
  };

  // --- ฟังก์ชัน Render เนื้อหาตามเมนูที่เลือก ---
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <TeamManager myInfo={myInfo} />;
      case "reports":
        return <WinLossReport agentId={myInfo?.id} />;
      default:
        return <TeamManager myInfo={myInfo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f172a] border-r border-slate-800 transform transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center font-black text-black">T</div>
            <span className="text-xl font-black text-white">AGENT PANEL</span>
          </div>

          <nav className="flex-1 space-y-2">
            <NavItem 
              icon="🏠" label="จัดการสายงาน" 
              active={activeTab === "dashboard"} 
              onClick={() => setActiveTab("dashboard")} 
            />
            <NavItem 
              icon="📊" label="รายงาน Win/Loss" 
              active={activeTab === "reports"} 
              onClick={() => setActiveTab("reports")} 
            />
          </nav>

          <button 
            onClick={handleLogout}
            className="w-full mt-auto flex items-center justify-center gap-2 p-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-[#020617]/80 flex items-center px-6">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2">☰</button>
          <div className="ml-auto flex items-center gap-4">
             <span className="text-sm font-bold">{myInfo?.username}</span>
          </div>
        </header>
        <SettlementPage />

        <main className="p-6 lg:p-10 overflow-y-auto">
          {renderContent()} {/* 👈 เนื้อหาจะเปลี่ยนไปตามค่า activeTab */}
        </main>
      </div>
    </div>
  );
}

// NavItem Component ที่รับ onClick มาทำงาน
function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${active ? "bg-yellow-500 text-black" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}
    >
      <span>{icon}</span> {label}
    </button>
  );
}