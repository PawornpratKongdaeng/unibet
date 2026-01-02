"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/sweetAlert";
import Header from "@/components/Header";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const { balance, refreshBalance } = useWallet() as any;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // ฟังก์ชันจัดรูปแบบเบอร์โทร: 0812345678 -> 081-234-5678
  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "ไม่ระบุ";
    const cleaned = ("" + phone).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    return phone;
  };

  useEffect(() => {
    setMounted(true);
    const initProfile = async () => {
      const userStore = localStorage.getItem("user");
      if (!userStore) {
        router.push("/login");
        return;
      }

      try {
        const res = await apiFetch("/me");
        if (res.ok) {
          const freshData = await res.json();
          setUser(freshData);
          localStorage.setItem("user", JSON.stringify(freshData));
        } else {
          // ถ้า Token หมดอายุ หรือมีปัญหา ให้ดึงจาก Store ไปก่อนแต่เตือนให้ Login ใหม่
          setUser(JSON.parse(userStore));
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
        setUser(JSON.parse(userStore));
      } finally {
        setLoading(false);
        refreshBalance();
      }
    };

    initProfile();
  }, [router, refreshBalance]);

  const handleLogout = () => {
    localStorage.clear();
    showToast("success", "ออกจากระบบเรียบร้อย");
    router.push("/login");
  };

  // ป้องกันการ Render ก่อนที่ Client จะพร้อม
  if (!mounted || loading || !user) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin"></div>
      <p className="text-slate-500 text-xs font-black uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-24 font-sans selection:bg-yellow-500/30">
      <Header />

      <div className="max-w-2xl mx-auto px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- UNIBET Premium Profile Card --- */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            
            {/* ฝั่งซ้าย: รูปโปรไฟล์ */}
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-900 border border-slate-800 rounded-[3rem] flex items-center justify-center text-slate-500 shadow-inner group-hover:border-yellow-500/30 transition-all duration-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-[#020617] p-1.5 rounded-full">
                <div className="w-full h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
              </div>
            </div>

            {/* ฝั่งขวา: ข้อมูลผู้ใช้งาน */}
            <div className="flex-1 w-full space-y-6 text-center md:text-left">
              <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-tight">
                  {user.username}
                </h2>
                <div className="flex justify-center md:justify-start gap-2 mt-2">
                   <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em] bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                    {user.role || 'MEMBER'}
                  </span>
                </div>
              </div>

              {/* Grid ข้อมูล */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-slate-800/50">
                <InfoRow label="Phone Number" value={formatPhoneNumber(user.phone)} isHighlightSecondary />
                <InfoRow label="Available Balance" value={`฿${(balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} isHighlight />
                <InfoRow label="Total Withdraw" value={`฿${Number(user.total_withdraw || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                <InfoRow label="Status" value={user.status || "Active"} />
              </div>

              {/* ปุ่ม Deposit / Withdraw */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link href="/deposit" className="flex items-center justify-center gap-2 bg-yellow-500 hover:bg-white text-black py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-yellow-500/10">
                  Deposit
                </Link>
                <Link href="/withdraw" className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border border-slate-700">
                  Withdraw
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- Settings Menu --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="md:col-span-2">
             <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] ml-4 mb-4">Account Management</p>
          </div>
          <MenuLink 
            href="/history"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
            title="Betting History" 
            sub="Check your past wagers" 
          />
          <MenuLink 
            href="/security"
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>} 
            title="Security" 
            sub="Password & Privacy" 
          />
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-900/30 hover:bg-red-500/5 border border-slate-800 hover:border-red-500/20 py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all group"
        >
          <span className="text-xs font-black text-slate-500 group-hover:text-red-500 uppercase tracking-widest">Sign Out from UNIBET System</span>
        </button>

        <p className="text-center text-slate-800 text-[9px] font-black uppercase tracking-[0.3em] mt-10">
          UNIBET OS v1.1.0 // ENGINE 2025
        </p>
      </div>
    </main>
  );
}

function InfoRow({ label, value, isHighlight = false, isHighlightSecondary = false }: { label: string, value: string, isHighlight?: boolean, isHighlightSecondary?: boolean }) {
  return (
    <div className="flex justify-between items-end pb-2 border-b border-slate-800/30 group">
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">{label}</span>
      <div className={`font-mono font-bold ${isHighlight ? 'text-yellow-500 text-lg' : isHighlightSecondary ? 'text-white' : 'text-slate-400'} text-sm`}>
        {value}
      </div>
    </div>
  );
}

function MenuLink({ icon, title, sub, href }: { icon: React.ReactNode, title: string, sub: string, href: string }) {
  return (
    <Link href={href} className="flex items-center gap-5 bg-slate-900/30 hover:bg-slate-900/80 border border-slate-800/50 p-5 rounded-[2rem] transition-all group">
      <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-yellow-500 transition-all">
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-black text-white uppercase tracking-tight mb-0.5">{title}</p>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter opacity-70">{sub}</p>
      </div>
    </Link>
  );
}