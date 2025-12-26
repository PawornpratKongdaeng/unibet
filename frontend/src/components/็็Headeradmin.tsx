import { MenuIcon, UserIcon } from "./Icons";

export default function Header({ activeTab, adminInfo, setIsSidebarOpen }: any) {
  const getTitle = () => {
    switch (activeTab) {
      case "users": return "User Management";
      case "bets": return "Betting Reports";
      case "settings": return "System Settings";
      default: return "Dashboard";
    }
  };

  const getSubtitle = () => {
    switch (activeTab) {
      case "users": return "จัดการข้อมูลสมาชิกทั้งหมด";
      case "bets": return "ดูรายงานการเดิมพันทั้งหมด";
      case "settings": return "ตั้งค่าระบบทั้งหมด";
      default: return "";
    }
  };

  return (
    <header className="h-24 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40 flex items-center px-6 lg:px-10">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden p-3 text-white hover:bg-zinc-900 rounded-xl mr-4 transition-all duration-200"
      >
        <MenuIcon />
      </button>

      <div className="flex-1">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
          {getTitle()}
        </h2>
        <p className="text-xs text-zinc-500 font-semibold mt-1">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1.5">
            Administrator
          </p>
          <p className="text-base font-bold text-white">
            {adminInfo?.username}
          </p>
        </div>
        <div className="relative">
          <div className="w-14 h-14 bg-zinc-900 rounded-xl border-2 border-zinc-800 flex items-center justify-center">
            <UserIcon />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
        </div>
      </div>
    </header>
  );
}