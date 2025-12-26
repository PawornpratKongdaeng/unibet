"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert"; // ใช้ SweetAlert ที่คุณมี

export default function AdminLoginPage() {
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
        // 🚨 จุดสำคัญ: เช็ค Role ทันที
        if (data.user.role !== "admin") {
          showToast("error", "เข้าสู่ระบบปฏิเสธ: เฉพาะผู้ดูแลเท่านั้น");
          setLoading(false);
          return;
        }

        // บันทึกข้อมูลลง LocalStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        showToast("success", "ยินดีต้อนรับท่านผู้ดูแล!");
        router.push("/admin"); // ส่งไปหน้า Dashboard ของ Admin
      } else {
        showToast("error", data.error || "รหัสผ่านไม่ถูกต้อง");
      }
    } catch (err) {
      showToast("error", "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-2xl border border-red-500/30 p-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-yellow-500 italic">
            ADMIN PANEL
          </h1>
          <p className="text-gray-400 mt-2">กรุณายืนยันตัวตนเพื่อเข้าสู่ระบบหลังบ้าน</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#334155] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
              placeholder="ชื่อผู้ดูแล"
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#334155] border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-all"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-3 rounded-lg shadow-lg transform active:scale-95 transition-all"
          >
            {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบผู้ดูแล"}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-500">
          &copy; 2025 TideKung Admin System v2.0
        </div>
      </div>
    </div>
  );
}