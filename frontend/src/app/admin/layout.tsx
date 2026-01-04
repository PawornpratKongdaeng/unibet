"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Swal from "sweetalert2";
import { 
  LayoutDashboard, Users, BadgeDollarSign, 
  FileText, Gavel, Landmark, Settings, 
  LogOut, Menu, X, ShieldCheck, Loader2
} from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const res = await apiFetch("/me");
      if (!res.ok) throw new Error("Session Invalid");
      const data = await res.json();

      const userRole = data.role?.toLowerCase();
      if (userRole !== 'admin') {
        await Swal.fire({
          icon: 'error',
          title: 'ACCESS DENIED',
          text: 'เฉพาะผู้ดูแลระบบที่มีสิทธิ์ระดับสูงเท่านั้น!',
          background: '#fff', color: '#000', confirmButtonColor: '#10b981'
        });
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      setAdminInfo(data);
      setIsLoading(false);
    } catch (err) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => { 
    checkAuth(); 
  }, [checkAuth]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-emerald-600" size={48} />
      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.5em] animate-pulse">
        Verifying Security Clearance...
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-hidden font-sans">
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col p-8">
          
          {/* Logo Section */}
          <div className="mb-12 flex items-center gap-4 px-2">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-emerald-200 italic">
              S
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tighter leading-none italic">
                SOCCER<span className="text-emerald-600">.</span>
              </h1>
              <p className="text-[10px] text-emerald-600 font-black tracking-[0.3em] mt-1">MANAGEMENT</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
            <NavItem icon={<LayoutDashboard size={20}/>} label="หน้าหลัก" sublabel="Overview" href="/admin" active={pathname === "/admin"} />
            <NavItem icon={<Users size={20}/>} label="จัดการสมาชิก" sublabel="Users Control" href="/admin/users" active={pathname.includes("/users")} />
            <NavItem icon={<BadgeDollarSign size={20}/>} label="สรุปการเงิน" sublabel="Finance Dept" href="/admin/finance" active={pathname.includes("/finance")} />
            <NavItem icon={<FileText size={20}/>} label="รายงานเดิมพัน" sublabel="Betting Logs" href="/admin/bets" active={pathname.includes("/bets")} />
            <NavItem icon={<Gavel size={20}/>} label="จัดการผลบอล" sublabel="Settlement" href="/admin/settlement" active={pathname.includes("/settlement")} />
            <NavItem icon={<Landmark size={20}/>} label="ตั้งค่าธนาคาร" sublabel="Bank API" href="/admin/bank-settings" active={pathname.includes("/bank-settings")} />
            <NavItem icon={<Settings size={20}/>} label="ตั้งค่าระบบ" sublabel="System Config" href="/admin/settings" active={pathname.includes("/settings")} />
          </nav>

          {/* Logout Button */}
          <button 
            onClick={handleLogout} 
            className="group w-full mt-8 p-5 text-[10px] font-black text-slate-400 hover:text-rose-600 bg-slate-50 rounded-[2rem] border border-slate-100 transition-all uppercase tracking-widest hover:border-rose-100 flex items-center justify-center gap-3"
          >
            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen relative">
        <header className="h-24 border-b border-slate-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 lg:px-12 shrink-0 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-3 bg-slate-100 rounded-xl text-slate-600">
            <Menu size={20} />
          </button>
          
          <div className="flex-1 hidden md:block">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-pulse"></div>
              </div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">
                Central Server: <span className="text-emerald-600 ml-1 font-bold">Connected</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 flex items-center justify-end gap-1">
                <ShieldCheck size={10} /> Verified Admin
              </p>
              <p className="text-sm font-black text-slate-900 italic tracking-tight uppercase">
                {adminInfo?.username || 'ADMINISTRATOR'}
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm relative group cursor-pointer overflow-hidden">
                <span className="font-black text-emerald-700 italic text-lg group-hover:scale-110 transition-transform">
                 {adminInfo?.username?.charAt(0).toUpperCase() || 'A'}
                </span>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-12 overflow-y-auto scrollbar-hide relative bg-slate-50/50">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -z-10 pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ icon, label, sublabel, href, active }: any) {
  return (
    <Link href={href} className="block w-full">
      <div className={`flex items-center gap-5 px-6 py-5 rounded-[2rem] transition-all duration-500 group ${
        active 
          ? "bg-emerald-600 text-white font-black scale-[1.02] shadow-xl shadow-emerald-200" 
          : "text-slate-400 hover:text-emerald-600 hover:bg-white hover:translate-x-1"
      }`}>
        <div className={`${active ? "text-white" : "text-slate-300 group-hover:text-emerald-500"} transition-colors`}>
          {icon}
        </div>
        <div className="text-left">
          <p className="text-xs font-black leading-none uppercase tracking-tighter italic">{label}</p>
          <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1.5 transition-colors ${
            active ? "text-emerald-100/80" : "text-slate-300 group-hover:text-slate-400"
          }`}>
            {sublabel}
          </p>
        </div>
        {active && (
          <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm"></div>
        )}
      </div>
    </Link>
  );
}