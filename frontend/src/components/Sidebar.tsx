import Logo from "./Logo";
import NavItem from "./NavItem";
import LogoutButton from "./LogoutButton";
import { UsersIcon, ChartIcon, SettingsIcon } from "./Icons";

export default function Sidebar({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  handleLogout,
}: any) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-80 bg-zinc-950 border-r border-zinc-800 transform transition-all duration-300 ease-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0 lg:static`}
    >
      <div className="h-full flex flex-col p-8">
        <Logo />

        <nav className="flex-1 space-y-3 mt-12">
          <NavItem
            icon={<UsersIcon />}
            label="จัดการสมาชิก"
            sublabel="User Management"
            active={activeTab === "users"}
            onClick={() => {
              setActiveTab("users");
              setIsSidebarOpen(false);
            }}
          />
          <NavItem
            icon={<ChartIcon />}
            label="รายงานเดิมพัน"
            sublabel="Betting Reports"
            active={activeTab === "bets"}
            onClick={() => {
              setActiveTab("bets");
              setIsSidebarOpen(false);
            }}
          />

          <div className="pt-6 pb-3">
            <div className="h-px bg-zinc-800"></div>
          </div>

          <div className="px-4 text-xs font-bold text-zinc-600 uppercase tracking-widest">
            System
          </div>

          <NavItem
            icon={<SettingsIcon />}
            label="ตั้งค่าระบบ"
            sublabel="Settings"
            active={activeTab === "settings"}
            onClick={() => {
              setActiveTab("settings");
              setIsSidebarOpen(false);
            }}
          />
        </nav>

        <LogoutButton onClick={handleLogout} />
      </div>
    </aside>
  );
}