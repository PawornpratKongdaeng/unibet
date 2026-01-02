"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const endpoint = isLogin ? "/api/v3/login" : "/api/v3/register";
    const payload = { username, password };

    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
  if (isLogin) {
    // 🔴 ตรวจสอบตรงนี้: data.user มีค่าจริงๆ ใช่ไหม? 
    // ถ้า Backend ส่งมาว่า data.data.user ต้องแก้ให้ตรงกัน
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user)); 
    
    showToast("success", "เข้าสู่ระบบสำเร็จ!");
    router.push("/"); // กลั บไปหน้าแรก
        } else {
          showToast("success", "สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
          setIsLogin(true); // สลับไปหน้า Login
        }
      } else {
        showToast("error", data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      showToast("error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setIsLoading(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-[#1A202C] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-[#2D3748] rounded-2xl shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Welcome Back" : "Join Us"}
          </h1>
          <p className="text-gray-400">
            {isLogin ? "เข้าสู่ระบบเพื่อเริ่มเดิมพัน" : "สมัครสมาชิกเพื่อรับเครดิตฟรี"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#1A202C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="กรอกชื่อผู้ใช้"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#1A202C] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              placeholder="กรอกรหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-[#1A202C] font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isLoading ? "กำลังดำเนินการ..." : isLogin ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-yellow-500 hover:underline text-sm"
          >
            {isLogin ? "ยังไม่มีบัญชี? สมัครสมาชิกที่นี่" : "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
}