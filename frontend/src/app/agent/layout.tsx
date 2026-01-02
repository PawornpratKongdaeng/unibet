"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { 
  LayoutDashboard, Users, BarChart3, History, 
  LogOut, Menu, X, Wallet, ShieldCheck, ChevronRight
} from "lucide-react";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [myInfo, setMyInfo] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const res = await apiFetch("/auth/me");
        if (res.ok) setMyInfo(await res.json());
      } catch (err) {
        console.error("Failed to fetch info");
      }
    };
    fetchMyInfo();
  }, []);

  const menuItems = [
    { id: "team", label: "Team Manager", href: "/agent", icon: <Users size={20} /> },
    { id: "winloss", label: "Win/Loss Report", href: "/agent/winloss", icon: <BarChart3 size={20} /> },
    { id: "logs", label: "Credit Logs", href: "/agent/logs", icon: <History size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-400 flex font-sans">
      
      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950 border-r border-zinc-900 
        transition-transform duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0
      `}>
        <div className="h-full flex flex-col p-6">
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 mb-12">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg shadow-white/10">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-white font-black italic uppercase tracking-tighter leading-none">Agent</h1>
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em]">Terminal v2.0</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`
                    w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 group
                    ${isActive 
                      ? "bg-zinc-900 text-white shadow-inner border border-zinc-800" 
                      : "hover:bg-zinc-900/50 hover:text-zinc-200"}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className={`${isActive ? "text-blue-500" : "text-zinc-600 group-hover:text-zinc-400"}`}>
                      {item.icon}
                    </span>
                    <span className="text-xs font-black uppercase italic tracking-widest">
                      {item.label}
                    </span>
                  </div>
                  {isActive && <ChevronRight size={14} className="text-zinc-700" />}
                </Link>
              );
            })}
          </nav>

          {/* User Profile (Bottom) */}
          <div className="mt-auto pt-6 border-t border-zinc-900">
            <div className="bg-zinc-900/30 p-4 rounded-[2.2rem] border border-zinc-900/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-zinc-700 flex items-center justify-center text-white font-black text-xs">
                  {myInfo?.username?.substring(0, 2).toUpperCase() || "??"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-white font-black italic truncate text-sm">{myInfo?.username || "Loading..."}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Authorized Agent</p>
                </div>
              </div>
              <button className="w-full bg-zinc-900 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-500 py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-800 active:scale-95">
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Top Header Bar */}
        <header className="h-20 border-b border-zinc-900 bg-black/50 backdrop-blur-xl flex items-center justify-between px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-white p-2 hover:bg-zinc-900 rounded-lg">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-none mb-1">Available Credit</span>
              <span className="text-xl font-black italic text-emerald-400 leading-none tracking-tighter">
                ฿{(myInfo?.balance || 0).toLocaleString()}
              </span>
            </div>
            <div className="w-[1px] h-8 bg-zinc-900 mx-2" />
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-zinc-500 border border-zinc-800 shadow-inner">
              <Wallet size={18} />
            </div>
          </div>
        </header>

        {/* Dynamic Content Space */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black">
          <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}