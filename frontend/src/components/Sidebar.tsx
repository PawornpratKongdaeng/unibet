"use client";
import React from "react";
import Logo from "./Logo";
import NavItem from "./NavItem";
import LogoutButton from "./LogoutButton";
import { 
  Users, 
  BarChart3, 
  Settings, 
  LayoutDashboard, 
  Wallet
} from "lucide-react";

// ปรับ Type ของ Props ให้ดีขึ้นแทนการใช้ any
interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
}: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-80 bg-zinc-950 border-r border-zinc-900 transform transition-all duration-300 ease-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static`}
    >
      <div className="h-full flex flex-col p-8">
        <div className="mb-10 px-4">
          <Logo />
        </div>

        <nav className="flex-1 space-y-2">
          <div className="px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
            Main Menu
          </div>

          <NavItem
            icon={LayoutDashboard} // ✅ แก้จาก <LayoutDashboard /> เป็น LayoutDashboard
            label="ภาพรวมระบบ"
            sublabel="Dashboard"
            active={activeTab === "stats"}
            onClick={() => {
              setActiveTab("stats");
              setIsSidebarOpen(false);
            }}
          />

          <NavItem
            icon={Users} // ✅ แก้เป็นชื่อ Component ตรงๆ
            label="จัดการสมาชิก"
            sublabel="User Management"
            active={activeTab === "users"}
            onClick={() => {
              setActiveTab("users");
              setIsSidebarOpen(false);
            }}
          />

          <div className="pt-8 px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 border-t border-zinc-900/50">
            Transactions
          </div>

          <NavItem
            icon={Wallet} // ✅ แก้เป็นชื่อ Component ตรงๆ
            label="รายการฝาก-ถอน"
            sublabel="Finance Hub"
            active={activeTab === "transactions"}
            onClick={() => {
              setActiveTab("transactions");
              setIsSidebarOpen(false);
            }}
          />

          <NavItem
            icon={BarChart3} // ✅ แก้เป็นชื่อ Component ตรงๆ
            label="รายงานเดิมพัน"
            sublabel="Betting Reports"
            active={activeTab === "bets"}
            onClick={() => {
              setActiveTab("bets");
              setIsSidebarOpen(false);
            }}
          />

          <div className="pt-8 px-4 mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 border-t border-zinc-900/50">
            System
          </div>

          <NavItem
            icon={Settings} // ✅ แก้เป็นชื่อ Component ตรงๆ
            label="ตั้งค่าระบบ"
            sublabel="Settings"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setIsSidebarOpen(false);
            }}
          />
        </nav>

        <div className="pt-6 mt-auto">
          <LogoutButton onClick={handleLogout} />
        </div>
      </div>
    </aside>
  );
}