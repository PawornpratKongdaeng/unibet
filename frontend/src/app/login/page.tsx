"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert";
import Link from "next/link"; // ✅ เพิ่มการนำเข้า Link

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8080/api/v3/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("success", `ยินดีต้อนรับคุณ ${data.user.username}`);

        if (data.user.role === "admin") {
          router.push("/admin");
        } else if (data.user.role === "agent" || data.user.role === "master") {
          router.push("/agent");
        } else {
          router.push("/");
        }
      } else {
        showToast("error", data.error || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      showToast("error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-yellow-500/20 mb-4 rotate-3">
              <span className="text-black text-3xl font-black">-T-</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
              Member Login
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              เข้าสู่ระบบเพื่อจัดการสายงานของคุณ
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Username
              </label>
              <input
                type="text"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 mt-1 text-white outline-none focus:border-yellow-500 transition-all"
                placeholder="unibetXXXXX" // ✅ ปรับ Placeholder ให้รู้ว่าต้องกรอก Username ที่ระบบ Gen ให้
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 mt-1 text-white outline-none focus:border-yellow-500 transition-all focus:ring-4 focus:ring-yellow-500/5"
                placeholder="รหัสผ่าน"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:bg-slate-700 text-black font-black py-4 rounded-2xl mt-4 shadow-lg shadow-yellow-500/10 transition-all active:scale-95 flex items-center justify-center"
            >
              {loading ? "กำลังตรวจสอบข้อมูล..." : "LOGIN NOW"}
            </button>
          </form>

          {/* 🚀 ปุ่มสำหรับไปหน้า Register */}
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-3">
              Don't have an account?
            </p>
            <Link href="/register">
              <button className="w-full bg-slate-800 hover:bg-slate-700 text-yellow-500 font-black py-4 rounded-2xl transition-all active:scale-95 border border-slate-700">
                CREATE NEW ACCOUNT
              </button>
            </Link>
          </div>

          <p className="text-center text-slate-600 text-[10px] mt-8 font-bold uppercase tracking-[0.2em]">
            Security Protected System v3.0
          </p>
        </div>
      </div>
    </div>
  );
}
