"use client";
import { useState, useEffect, useMemo } from "react"; // เพิ่ม useMemo
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr"; 
import Link from "next/link";
import { 
  LayoutDashboard, Users, Landmark, LogOut, Menu, 
  ShieldCheck, Loader2, Wallet, RefreshCw, ArrowDownCircle, 
  ArrowUpCircle, ClipboardList, History, BarChart3, FileText, Table, ChevronDown
} from "lucide-react";
import { apiFetch } from "@/lib/api";

const fetcher = (url: string) => apiFetch(url).then((res) => {
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // 1. ดึงข้อมูล Admin
  const { data: adminInfo, mutate: mutateAdmin, isLoading, error } = useSWR("/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  // 2. ดึงข้อมูลรายการที่ค้างตรวจสอบ (Pending) 
  // เพิ่ม refreshInterval: 30000 เพื่อให้ Badge อัปเดตทุก 30 วินาทีอัตโนมัติ
  const { data: pendingList } = useSWR("/admin/transactions/pending", fetcher, {
    refreshInterval: 30000, 
  });

  // 3. คำนวณจำนวน Badge จากข้อมูล API
  const badges = useMemo(() => {
    if (!pendingList || !Array.isArray(pendingList)) return { deposit: 0, withdraw: 0 };
    
    return {
      deposit: pendingList.filter((tx: any) => tx.type === "deposit").length,
      withdraw: pendingList.filter((tx: any) => tx.type === "withdraw").length
    };
  }, [pendingList]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || error) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }, [error]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (isLoading && !adminInfo) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">Verifying Security Clearance...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans italic">
      {/* Sidebar Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-all duration-500 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static flex flex-col`}>
          <div className="p-8 pb-4">
            <div className="mb-8 flex items-center gap-4 px-2">
                <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-emerald-200">TH</div>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">Unibet Admin<span className="text-emerald-600">.</span></h1>
                </div>
            </div>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
              <NavItem icon={<LayoutDashboard size={20}/>} label="Dashboard" href="/admin" active={pathname === "/admin"} />
              
              {/* Badge จะเปลี่ยนตามจำนวนที่นับได้จาก API */}
              <NavItem 
                icon={<ArrowDownCircle size={20}/>} 
                label="Deposit" 
                href="/admin/deposit" 
                active={pathname === "/admin/deposit"} 
                badge={badges.deposit > 0 ? badges.deposit : null} 
              />
              
              <NavItem 
                icon={<ArrowUpCircle size={20}/>} 
                label="Withdraw" 
                href="/admin/withdraw" 
                active={pathname === "/admin/withdraw"} 
                badge={badges.withdraw > 0 ? badges.withdraw : null} 
              />
              
              <div className="my-4 border-t border-slate-50 mx-4" />

              <NavItem icon={<ClipboardList size={20}/>} label="Deposit History" href="/admin/deposit-transactions" active={pathname.includes("deposit-transactions")} />
              <NavItem icon={<ClipboardList size={20}/>} label="Withdraw History" href="/admin/withdraw-transactions" active={pathname.includes("withdraw-transactions")} />
              <NavItem icon={<Users size={20}/>} label="Accounts Management" href="/admin/users" active={pathname.includes("/users")} />
              <NavItem icon={<History size={20}/>} label="Betslip History" href="/admin/betslips" active={pathname.includes("/betslips")} />
              <NavItem icon={<Landmark size={20}/>} label="Payment Accounts" href="/admin/bank-settings" active={pathname.includes("/bank-settings")} />
              <NavItem icon={<BarChart3 size={20}/>} label="Daily Status" href="/admin/daily-status" active={pathname.includes("/daily-status")} />

              {/* Member Report */}
              <div>
                <button 
                  onClick={() => setIsReportOpen(!isReportOpen)}
                  className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isReportOpen ? "text-emerald-600 bg-emerald-50/50" : "text-slate-400 hover:bg-slate-50"}`}
                >
                  <FileText size={20} />
                  <span className="text-xs font-black uppercase flex-1 text-left">Member Report</span>
                  <ChevronDown size={14} className={`transition-transform ${isReportOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isReportOpen && (
                  <div className="mt-1 ml-6 space-y-1 border-l-2 border-emerald-100 pl-4 animate-in slide-in-from-top-2 duration-300">
                    <SubNavItem icon={<Table size={14}/>} label="Matches Summary" href="/admin/reports/matches" active={pathname.includes("/matches")} />
                    <SubNavItem icon={<Table size={14}/>} label="Football Bets" href="/admin/reports/football" active={pathname.includes("/football")} />
                  </div>
                )}
              </div>
          </nav>

          <div className="p-8 pt-4">
            <button onClick={handleLogout} className="group w-full p-5 text-[10px] font-black text-slate-400 hover:text-rose-600 bg-slate-50 rounded-2xl border border-slate-100 transition-all uppercase tracking-widest flex items-center justify-center gap-3">
                <LogOut size={16} /> Log Out
            </button>
          </div>
      </aside>

      {/* Header & Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-24 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-12 shrink-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600">
            <Menu size={20} />
          </button>

          <div className="flex-1 flex justify-end items-center gap-6">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-6 py-3 rounded-2xl group cursor-pointer" onClick={() => mutateAdmin()}>
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Wallet size={18} />
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Balance</p>
                    <div className="flex items-center gap-2">
                        <span className="text-lg font-[1000] text-slate-800 tracking-tighter italic">
                            ฿ {Number(adminInfo?.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <RefreshCw size={12} className={`text-slate-300 group-hover:text-emerald-500 transition-colors ${isLoading ? 'animate-spin' : ''}`} />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                        <ShieldCheck size={10} /> {adminInfo?.role}
                    </p>
                    <p className="text-sm font-black text-slate-900 uppercase leading-none">{adminInfo?.username}</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-2xl border-2 border-slate-100 flex items-center justify-center shadow-sm">
                    <span className="font-black text-emerald-700 text-lg">{adminInfo?.username?.charAt(0).toUpperCase()}</span>
                </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto bg-slate-50/50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

// NavItem และ SubNavItem เหมือนเดิม...
// NavItem Component
function NavItem({ icon, label, href, active, badge }: any) {
  return (
    <Link href={href} className="block w-full">
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
        active 
          ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
          : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
      }`}>
        <div className={active ? "text-white" : "text-slate-300 group-hover:text-emerald-500"}>{icon}</div>
        <span className="text-xs font-black uppercase flex-1">{label}</span>
        {badge && (
          <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}

// SubNavItem Component
function SubNavItem({ icon, label, href, active }: any) {
  return (
    <Link href={href} className="block w-full">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active ? "text-emerald-600 font-black" : "text-slate-400 hover:text-emerald-500"
      }`}>
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-tight">{label}</span>
      </div>
    </Link>
  );
}