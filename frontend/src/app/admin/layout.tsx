"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/v3/me", {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (data.role !== 'admin') {
        await Swal.fire({
          icon: 'error',
          title: 'Access Denied',
          text: 'เฉพาะผู้ดูแลระบบเท่านั้น!',
          background: '#18181b', color: '#fff', confirmButtonColor: '#fff'
        });
        localStorage.removeItem("token");
        router.push("/login");
      } else {
        setAdminInfo(data);
        setIsLoading(false);
      }
    } catch (err) {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (isLoading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin mb-4"></div>
      <p className="text-zinc-500 font-black text-xs uppercase tracking-widest animate-pulse">Verifying Access...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-900 transform transition-all duration-500 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-xl shadow-[0_0_20px_rgba(255,255,255,0.3)]">A</div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter leading-none">SOCCER</h1>
              <p className="text-[10px] text-zinc-500 font-black tracking-[0.2em]">ADMIN PANEL</p>
            </div>
          </div>
          
          <nav className="flex-1 space-y-1">
            <NavItem icon="🏠" label="หน้าหลัก" sublabel="Overview" href="/admin" active={pathname === "/admin"} />
            <NavItem icon="👥" label="จัดการสมาชิก" sublabel="Users" href="/admin/users" active={pathname.includes("/users")} />
            <NavItem icon="💸" label="รายการฝาก-ถอน" sublabel="Transactions" href="/admin/transactions" active={pathname.includes("/transactions")} />
            <NavItem icon="📊" label="สรุปการเงิน" sublabel="Finance" href="/admin/finance" active={pathname.includes("/finance")} />
            <NavItem icon="📑" label="รายงานเดิมพัน" sublabel="Bets" href="/admin/bets" active={pathname.includes("/bets")} />
            <NavItem icon="⚙️" label="ตั้งค่าบอล" sublabel="Settlement" href="/admin/settlement" active={pathname.includes("/settlement")} />
            <NavItem icon="🏦" label="ตั้งค่าธนาคาร" sublabel="Bank Settings" href="/admin/bank-settings" active={pathname.includes("/bank-settings")} />
            <NavItem icon="⚙️" label="ตั้งค่าระบบ" sublabel="Settings" href="/admin/settings" active={pathname.includes("/settings")} />
          </nav>

          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }} className="w-full mt-auto p-4 text-xs font-black text-zinc-500 hover:text-white bg-zinc-900/50 rounded-2xl border border-zinc-800 transition-all uppercase tracking-widest hover:bg-rose-500/10 hover:border-rose-500/50">
            Logout System
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="h-20 border-b border-zinc-900 bg-black/50 backdrop-blur-md flex items-center px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-white mr-4">☰</button>
          <div className="flex-1">
            <h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               System Online
            </h2>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-zinc-600 uppercase">Super Admin</p>
              <p className="text-sm font-bold text-white">{adminInfo?.username}</p>
            </div>
            <div className="w-10 h-10 bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center italic font-black text-white">
              {adminInfo?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-y-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// NavItem Reusable Component
function NavItem({ icon, label, sublabel, href, active }: any) {
  return (
    <Link href={href} className="block w-full">
      <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        active 
          ? "bg-white text-black font-black scale-[1.02] shadow-[0_10px_25px_rgba(255,255,255,0.1)]" 
          : "text-zinc-500 hover:text-white hover:bg-zinc-900"
      }`}>
        <span className="text-xl">{icon}</span>
        <div className="text-left">
          <p className="text-sm font-bold leading-none">{label}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${active ? "text-zinc-400" : "text-zinc-600"}`}>
            {sublabel}
          </p>
        </div>
      </div>
    </Link>
  );
}