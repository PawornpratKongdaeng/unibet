"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert";
import { ShieldCheck, Lock, User, ChevronRight } from "lucide-react";

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
        if (data.user.role !== "admin") {
          showToast("error", "ACCESS DENIED: ADMIN ONLY");
          setLoading(false);
          return;
        }
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        showToast("success", "ACCESS GRANTED. WELCOME.");
        router.push("/admin");
      } else {
        showToast("error", data.error || "INVALID CREDENTIALS");
      }
    } catch (err) {
      showToast("error", "CONNECTION FAILED");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2"></div>

      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-zinc-900 border-2 border-zinc-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
             <ShieldCheck size={40} className="text-rose-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
            Soccer <span className="text-rose-500">HQ</span>
          </h1>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Terminal Access Required</p>
        </div>

        <div className="bg-zinc-950/50 backdrop-blur-xl rounded-[2.5rem] border border-zinc-900 p-10 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Identity</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-rose-500 transition-colors">
                  <User size={18} />
                </div>
                <input type="text" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-rose-500 focus:bg-zinc-900 transition-all placeholder:text-zinc-700" placeholder="ADMIN USERNAME" onChange={(e) => setUsername(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 px-1">Access Key</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-rose-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input type="password" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-rose-500 focus:bg-zinc-900 transition-all placeholder:text-zinc-700" placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-white hover:bg-rose-500 text-black hover:text-white font-black py-5 rounded-2xl shadow-xl transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 group overflow-hidden">
              {loading ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Establish Connection
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-10 text-center">
           <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em]">&copy; 2025 SOCCER COMMAND v3.1.0 // ENCRYPTED ACCESS</p>
        </div>
      </div>
    </div>
  );
}