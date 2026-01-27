"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // ยังคงใช้สำหรับ redirect ภายในโดเมนเดียวกัน
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";
import { User, Lock, Info } from "lucide-react";

// 🎯 กำหนด URL ของระบบ (ควรย้ายไปไว้ใน .env ในอนาคต)
const BACKOFFICE_URL = "https://backoffice.thunibet.com"; // หรือ http://backoffice.thunibet.local:3000 สำหรับ localhost
const MAIN_URL = "https://thunibet.com";                 // หรือ http://thunibet.local:3000 สำหรับ localhost

export default function UnibetLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/api/v3/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ เก็บ Token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("success", `Welcome back, ${data.user.username}`);

        const userRole = data.user.role.toLowerCase();
        const currentHost = window.location.hostname;

        // ==========================================
        // 🚀 LOGIC การแยกโดเมนตาม Role
        // ==========================================
        
        // 1. กลุ่มทีมงาน (Admin, Agent, Master) -> ต้องไป Backoffice
        if (["admin", "agent", "master"].includes(userRole)) {
            // ถ้าตอนนี้ "ไม่ได้" อยู่ที่หน้า Backoffice -> ดีดข้ามโดเมน
            if (!currentHost.startsWith("backoffice")) {
                window.location.href = `${BACKOFFICE_URL}/dashboard`; 
            } else {
                // ถ้าอยู่ที่ Backoffice อยู่แล้ว -> ไปหน้า Dashboard ได้เลย (ไม่ต้องโหลดใหม่)
                router.push("/admin"); 
            }
        } 
        
        // 2. กลุ่มลูกค้า (User Member) -> ต้องไปเว็บหลัก
        else {
            // ถ้าตอนนี้ "ดันหลง" มาอยู่ที่หน้า Backoffice -> ดีดกลับเว็บหลัก
            if (currentHost.startsWith("backoffice")) {
                window.location.href = `${MAIN_URL}/member`; // หรือหน้าแรก
            } else {
                // ถ้าอยู่เว็บหลักอยู่แล้ว -> ไปหน้าเล่นเกม
                router.push("/");
            }
        }

      } else {
        showToast("error", data.error || "Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // พื้นหลังสีเขียว Unibet
    <div className="min-h-screen bg-[#127447] flex flex-col items-center justify-center p-4 font-sans">
      
      {/* ส่วนบน: Logo */}
      <div className="mb-8 flex flex-col items-center">
        <div className="flex items-center gap-1 mb-2">
            <h1 className="text-white text-5xl font-black italic tracking-tighter">UNIBET</h1>
        </div>
        {/* จุดสีเขียว 6 จุดตามโลโก้ */}
        <div className="flex gap-1.5">
            {[...Array(6)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-[#33ff66] shadow-sm"></div>
            ))}
        </div>
      </div>

      <div className="w-full max-w-[400px]">
        {/* การ์ด Login สีขาว */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          
          <div className="p-8">
            <h2 className="text-[#127447] text-xl font-bold text-center mb-6 uppercase tracking-tight">
                Secure Login
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username */}
              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 pl-10 text-gray-900 outline-none focus:border-[#127447] focus:ring-1 focus:ring-[#127447] transition-all"
                    placeholder="Username"
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3.5 pl-10 text-gray-900 outline-none focus:border-[#127447] focus:ring-1 focus:ring-[#127447] transition-all"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" id="remember" className="accent-[#127447] w-4 h-4" />
                <label htmlFor="remember" className="text-xs text-gray-500 font-medium cursor-pointer">
                    Remember my account
                </label>
              </div>

              {/* Login Button */}
              <button
                disabled={loading}
                className="w-full bg-[#127447] hover:bg-[#0e5a36] disabled:bg-gray-400 text-white font-bold py-4 rounded-lg mt-2 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-black/10"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span className="uppercase tracking-wider">Log In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
            </div>
          </div>

          {/* Footer Card */}
          <div className="bg-gray-50 border-t border-gray-100 p-4 text-center">
             <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                System Version 4.0.2
             </p>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-white/70 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                <Info size={14} />
                <span className="text-[11px] font-medium tracking-wide">
                    Need help? Contact your account manager
                </span>
            </div>
            <p className="text-[10px] text-white/40 text-center leading-relaxed">
                © 2026 UNIBET GROUP. ALL RIGHTS RESERVED.<br/>
                BY PLAYERS, FOR PLAYERS.
            </p>
        </div>
      </div>
    </div>
  );
}