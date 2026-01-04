"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/sweetAlert";
import Header from "@/components/Header";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { User, Shield, History, LogOut } from "lucide-react"; // แนะนำให้ใช้ lucide-react เพื่อความคลีน

export default function ProfilePage() {
  const router = useRouter();
  const { balance, refreshBalance } = useWallet() as any;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "ไม่ระบุ";
    const cleaned = ("" + phone).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
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

  if (!mounted || loading || !user) return (
    <div className="min-h-screen bg-[#013323] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#00b359]/20 border-t-[#00b359] rounded-full animate-spin"></div>
      <p className="text-emerald-500/50 text-xs font-black uppercase tracking-widest animate-pulse">Loading Profile...</p>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans overflow-x-hidden">
      <Header />

      <div className="max-w-2xl mx-auto px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* --- UNIBET Premium Profile Card --- */}
        <div className="bg-[#022c1e] backdrop-blur-xl border border-[#044630] rounded-[2.5rem] p-6 sm:p-10 mb-8 shadow-2xl relative overflow-hidden">
          {/* Radial Glow Effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00b359]/5 blur-[100px] rounded-full -mr-32 -mt-32"></div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            
            {/* ฝั่งซ้าย: รูปโปรไฟล์ (Avatar) */}
            <div className="relative group flex-shrink-0">
              <div className="w-32 h-32 sm:w-40 sm:h-40 bg-[#013323] border border-[#044630] rounded-[3rem] flex items-center justify-center text-emerald-500/30 shadow-inner group-hover:border-[#00b359]/50 transition-all duration-500">
                <User size={60} strokeWidth={1} />
              </div>
              {/* Online Status Dot */}
              <div className="absolute bottom-3 right-3 w-8 h-8 bg-[#013323] p-1.5 rounded-full">
                <div className="w-full h-full bg-[#00b359] rounded-full shadow-[0_0_15px_rgba(0,179,89,0.6)]"></div>
              </div>
            </div>

            {/* ฝั่งขวา: ข้อมูลผู้ใช้งาน */}
            <div className="flex-1 w-full space-y-6 text-center md:text-left">
              <div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-tight">
                  {user.username}
                </h2>
                <div className="flex justify-center md:justify-start gap-2 mt-2">
                   <span className="text-[10px] font-black text-[#00b359] uppercase tracking-[0.2em] bg-[#00b359]/10 px-3 py-1 rounded-full border border-[#00b359]/20">
                    {user.role || 'PREMIUM MEMBER'}
                  </span>
                </div>
              </div>

              {/* Grid ข้อมูล - ปรับเป็นโทนเขียวขาว */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-6 border-t border-[#044630]">
                <InfoRow label="Phone Number" value={formatPhoneNumber(user.phone)} isHighlightSecondary />
                <InfoRow label="Available Balance" value={`฿${(balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} isHighlight />
                <InfoRow label="Total Withdraw" value={`฿${Number(user.total_withdraw || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
                <InfoRow label="Account Status" value={user.status || "Active"} isStatus />
              </div>

              {/* ปุ่ม Deposit / Withdraw - ปรับให้เหมือนหน้า Dashboard */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Link href="/deposit" className="flex items-center justify-center gap-2 bg-white hover:bg-[#00b359] text-[#013323] hover:text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20">
                  Deposit
                </Link>
                <Link href="/withdraw" className="flex items-center justify-center gap-2 bg-[#034a31] hover:bg-[#046c48] text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 border border-[#044630]">
                  Withdraw
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* --- Settings Menu --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="md:col-span-2">
             <p className="text-emerald-400/30 text-[10px] font-black uppercase tracking-[0.2em] ml-4 mb-4">Account Management</p>
          </div>
          <MenuLink 
            href="/history"
            icon={<History size={22} />} 
            title="Betting History" 
            sub="Check your past wagers" 
          />
          <MenuLink 
            href="/security"
            icon={<Shield size={22} />} 
            title="Security" 
            sub="Password & Privacy" 
          />
        </div>

        {/* Logout - ปรับเป็นโทนสีแดงเข้มเหมือน Dashboard Footer */}
        <button 
          onClick={handleLogout}
          className="w-full bg-[#3b1215]/50 hover:bg-[#3b1215] border border-rose-900/30 hover:border-rose-500/50 py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all group shadow-lg"
        >
          <LogOut size={18} className="text-rose-500 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-black text-rose-500 uppercase tracking-widest">Sign Out from UNIBET System</span>
        </button>

        <p className="text-center text-emerald-900 text-[9px] font-black uppercase tracking-[0.3em] mt-10">
          UNIBET OS v1.1.0 // ENGINE 2026
        </p>
      </div>
    </main>
  );
}

// Sub-components ปรับแต่งสี
function InfoRow({ label, value, isHighlight = false, isHighlightSecondary = false, isStatus = false }: any) {
  return (
    <div className="flex justify-between items-end pb-2 border-b border-[#044630]/50 group">
      <span className="text-[9px] font-black text-emerald-400/50 uppercase tracking-widest mb-0.5">{label}</span>
      <div className={`font-mono font-bold ${
        isHighlight ? 'text-[#00b359] text-lg' : 
        isStatus ? 'text-emerald-400' : 
        isHighlightSecondary ? 'text-white' : 'text-emerald-100/70'
      } text-sm`}>
        {value}
      </div>
    </div>
  );
}

function MenuLink({ icon, title, sub, href }: any) {
  return (
    <Link href={href} className="flex items-center gap-5 bg-[#022c1e] hover:bg-[#034a31] border border-[#044630] p-5 rounded-[2.5rem] transition-all group shadow-md">
      <div className="w-12 h-12 bg-[#013323] border border-[#044630] rounded-2xl flex items-center justify-center text-emerald-500/50 group-hover:text-[#00b359] group-hover:border-[#00b359]/30 transition-all">
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-black text-white uppercase tracking-tight mb-0.5">{title}</p>
        <p className="text-[10px] text-emerald-400/30 font-bold uppercase tracking-tighter">{sub}</p>
      </div>
    </Link>
  );
}