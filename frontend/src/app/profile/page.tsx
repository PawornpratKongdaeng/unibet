"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { showToast } from "@/lib/sweetAlert";
import Header from "@/components/Header";

export default function ProfilePage() {
  const router = useRouter();
  const { balance, refreshBalance } = useWallet();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ดึงข้อมูล User จาก LocalStorage
    const userStore = localStorage.getItem("user");
    if (!userStore) {
      router.push("/auth");
    } else {
      setUser(JSON.parse(userStore));
      refreshBalance(); // อัปเดตเงินล่าสุดเมื่อเข้าหน้านี้
    }
  }, [router, refreshBalance]);

  const handleLogout = () => {
    localStorage.clear();
    showToast("success", "ออกจากระบบเรียบร้อย");
    router.push("/auth");
  };

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20 font-sans">
      <Header />

      <div className="max-w-md mx-auto px-6 pt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border border-slate-700">
              👤
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-[#020617] rounded-full"></div>
          </div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">{user.username}</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">
            Status: <span className="text-yellow-500">{user.role || 'Member'}</span>
          </p>
        </div>

        {/* Wallet Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 mb-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
          
          <div className="relative z-10">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white italic">฿{balance.toLocaleString()}</span>
              <span className="text-slate-600 font-bold text-sm">THB</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button className="bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                Deposit
              </button>
              <button className="bg-slate-800 hover:bg-slate-700 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
                Withdraw
              </button>
            </div>
          </div>
        </div>

        {/* Settings Menu */}
        <div className="space-y-3 mb-10">
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] ml-4 mb-4">Account Settings</p>
          
          <MenuLink icon="📜" title="Betting History" sub="รายการที่เดิมพันทั้งหมด" />
          <MenuLink icon="🔒" title="Security" sub="เปลี่ยนรหัสผ่าน" />
          <MenuLink icon="📢" title="Promotions" sub="กิจกรรมและโบนัส" />
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-slate-900 hover:bg-red-500/10 border border-slate-800 hover:border-red-500/20 py-5 rounded-[1.8rem] flex items-center justify-center gap-3 transition-all group active:scale-[0.98]"
        >
          <span className="text-xl group-hover:scale-110 transition-transform">🚪</span>
          <span className="text-sm font-black text-slate-400 group-hover:text-red-500 uppercase tracking-widest">Logout from System</span>
        </button>

        <p className="text-center text-slate-700 text-[9px] font-bold uppercase tracking-widest mt-10 opacity-50">
          Version 1.1.0-build.2025
        </p>
      </div>
    </main>
  );
}

// Component ย่อยสำหรับเมนู
function MenuLink({ icon, title, sub }: { icon: string, title: string, sub: string }) {
  return (
    <button className="w-full flex items-center gap-4 bg-[#0f172a]/50 hover:bg-[#0f172a] border border-slate-800/50 p-5 rounded-[1.8rem] transition-all group">
      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-xl group-hover:bg-slate-700 transition-colors">
        {icon}
      </div>
      <div className="text-left flex-1">
        <p className="text-sm font-black text-white uppercase tracking-tight leading-none mb-1">{title}</p>
        <p className="text-[10px] text-slate-500 font-bold">{sub}</p>
      </div>
      <span className="text-slate-700 group-hover:text-slate-400 transition-colors">❯</span>
    </button>
  );
}