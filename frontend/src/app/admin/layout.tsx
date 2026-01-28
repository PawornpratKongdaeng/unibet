"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  LayoutDashboard,
  Users,
  Landmark,
  LogOut,
  Menu,
  ShieldCheck,
  Loader2,
  Wallet,
  RefreshCw,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  History,
  FileText, // ✅ Icon สำหรับ Report
  Table,    // ✅ Icon สำหรับ Table
  ChevronDown,
  Users2,
  X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

// --- Types ---
interface UserProfile {
  id: number;
  username: string;
  role: string;
  credit: number;
}

// --- Fetcher ---
const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    const error: any = new Error("An error occurred while fetching the data.");
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // ✅ แยก State สำหรับ Dropdown 2 อัน
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // 1. Fetch User Data
  const {
    data: adminInfo,
    mutate: mutateAdmin,
    isLoading: isUserLoading,
  } = useSWR<UserProfile>("/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
    onError: (err) => {
        if (err.status === 401) handleLogout();
    }
  });

  // 2. Check Authorization Logic
  const isAuthorized = useMemo(() => {
    if (!adminInfo) return false;
    const role = adminInfo.role?.toLowerCase();
    return ["admin", "agent", "master"].includes(role);
  }, [adminInfo]);

  // 3. Fetch Pending Transactions
  const { data: pendingList } = useSWR(
    isAuthorized ? "/admin/transactions/pending" : null,
    fetcher,
    { refreshInterval: 15000 }
  );

  // 4. Calculate Badges
  const badges = useMemo(() => {
    if (!pendingList || !Array.isArray(pendingList)) return { deposit: 0, withdraw: 0 };
    return {
      deposit: pendingList.filter((tx: any) => tx.type === "deposit").length,
      withdraw: pendingList.filter((tx: any) => tx.type === "withdraw").length,
    };
  }, [pendingList]);

  // 5. Auth Effect
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    if (adminInfo && !isAuthorized) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "คุณไม่มีสิทธิ์เข้าถึงส่วนจัดการระบบ",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        router.replace("/");
      });
    }
  }, [adminInfo, isAuthorized, router]);

  // 6. Mobile UX
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Action: Logout
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    router.replace("/login");
  }, [router]);

  // Loading Screen
  if (isUserLoading || (adminInfo && !isAuthorized)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6">
        <div className="relative">
             <div className="absolute inset-0 bg-emerald-200 rounded-full blur-xl opacity-50 animate-pulse"></div>
             <Loader2 className="animate-spin text-emerald-600 relative z-10" size={56} />
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">
          Authenticating...
        </p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-200">
              <span className="text-xl font-black">TH</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                Unibet<span className="text-emerald-600">.</span>
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-rose-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-hide">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" href="/admin" active={pathname === "/admin"} />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Transactions</p>
          </div>
          
          <NavItem icon={<ArrowDownCircle size={20} />} label="Deposit" href="/admin/deposit" active={pathname === "/admin/deposit"} badge={badges.deposit} />
          <NavItem icon={<ArrowUpCircle size={20} />} label="Withdraw" href="/admin/withdraw" active={pathname === "/admin/withdraw"} badge={badges.withdraw} />
          
          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">History</p>
          </div>
          <NavItem icon={<ClipboardList size={20} />} label="Deposit History" href="/admin/deposit-transactions" active={pathname.includes("deposit-transactions")} />
          <NavItem icon={<ClipboardList size={20} />} label="Withdraw History" href="/admin/withdraw-transactions" active={pathname.includes("withdraw-transactions")} />
          <NavItem icon={<History size={20} />} label="Betslip History" href="/admin/betslips" active={pathname.includes("/betslips")} />

          <div className="pt-4 pb-2">
            <p className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Management</p>
          </div>

          <NavItem icon={<Users size={20} />} label="All Users" href="/admin/users" active={pathname === "/admin/users" || pathname.startsWith("/admin/users/")} />
          <NavItem icon={<Landmark size={20} />} label="Bank Accounts" href="/admin/bank-settings" active={pathname.includes("/bank-settings")} />

          {/* 1. Dropdown: Create Accounts (Registration) */}
          <div className="pt-1">
             <button
              onClick={() => setIsRegistrationOpen(!isRegistrationOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${
                isRegistrationOpen ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users2 size={20} />
                <span className="text-xs font-bold uppercase tracking-wide">Registration</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isRegistrationOpen ? "rotate-180" : ""}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isRegistrationOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
               <div className="space-y-1 pl-4 border-l-2 border-emerald-100 ml-6">
                 <SubNavItem icon={<Users2 size={16} />} label="New Agent" href="/admin/agent/create" active={pathname.includes("/agent/create")} />
                 <SubNavItem icon={<Users size={16} />} label="New Member" href="/admin/member/create" active={pathname.includes("/member/create")} />
               </div>
            </div>
          </div>

          {/* 2. ✅ Dropdown: Member Report (เพิ่มกลับมาตรงนี้) */}
          <div className="pt-1">
             <button
              onClick={() => setIsReportOpen(!isReportOpen)}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${
                isReportOpen ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileText size={20} />
                <span className="text-xs font-bold uppercase tracking-wide">Member Report</span>
              </div>
              <ChevronDown size={14} className={`transition-transform duration-300 ${isReportOpen ? "rotate-180" : ""}`} />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isReportOpen ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"}`}>
               <div className="space-y-1 pl-4 border-l-2 border-emerald-100 ml-6">
                 <SubNavItem icon={<Table size={16} />} label="Matches Summary" href="/admin/reports/matches" active={pathname.includes("/reports/matches")} />
               </div>
            </div>
          </div>

        </nav>

        {/* Logout Section */}
        <div className="border-t border-slate-100 p-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 hover:shadow-sm"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/90 px-6 backdrop-blur-md lg:px-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="rounded-xl bg-slate-50 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-1 items-center justify-end gap-4 sm:gap-6">
            {/* Credit Balance Card */}
            <div 
                onClick={() => mutateAdmin()}
                className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-2 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md sm:px-5 sm:py-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-110 sm:h-10 sm:w-10">
                <Wallet size={18} />
              </div>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Stock Balance</p>
                <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-black text-slate-800 sm:text-base">
                    ฿ {Number(adminInfo?.credit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <RefreshCw size={12} className={`text-slate-300 transition-all group-hover:text-emerald-500 ${isUserLoading ? "animate-spin" : ""}`} />
                </div>
              </div>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
               <div className="hidden text-right sm:block">
                <p className="flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                   <ShieldCheck size={10} /> {adminInfo?.role}
                </p>
                <p className="text-sm font-bold text-slate-700">{adminInfo?.username}</p>
               </div>
               <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-black shadow-sm">
                 {adminInfo?.username?.charAt(0).toUpperCase()}
               </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-7xl animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- Sub Components ---

function NavItem({ icon, label, href, active, badge }: { icon: React.ReactNode; label: string; href: string; active: boolean; badge?: number }) {
  return (
    <Link href={href} className="block w-full mb-1">
      <div
        className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
          active
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
            : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
        }`}
      >
        <div className={`transition-transform duration-200 ${active ? "scale-110" : "group-hover:scale-110"}`}>
            {icon}
        </div>
        <span className="flex-1 text-xs font-bold uppercase tracking-wide">{label}</span>
        {badge ? (
          <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-md bg-rose-500 px-1.5 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {badge > 99 ? '99+' : badge}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function SubNavItem({ icon, label, href, active }: { icon: React.ReactNode; label: string; href: string; active: boolean }) {
  return (
    <Link href={href} className="block w-full">
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all ${
          active
            ? "bg-white text-emerald-600 shadow-sm border border-emerald-100"
            : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50/50"
        }`}
      >
        {icon}
        <span className="text-[11px] font-bold uppercase tracking-tight">{label}</span>
      </div>
    </Link>
  );
}