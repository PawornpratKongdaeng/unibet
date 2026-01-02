"use client";
import { useState, useEffect,cloneElement } from "react";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Clock, 
  TrendingUp, 
  Wallet, 
  Settings, 
  Trophy, 
  ShieldCheck,
  Activity,
  ChevronRight,
  Database,
  Globe
} from "lucide-react"; // นำเข้าไอคอน Line-Outline
import { apiFetch } from "@/lib/api"; // ✅ ใช้ apiFetch ตัวเดียวจบ

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ✅ ใช้ apiFetch ซึ่งจัดการ Base URL และ Token ให้แล้ว
        const [usersRes, betsRes, txsRes, financeRes] = await Promise.all([
          apiFetch("/admin/users"),
          apiFetch("/admin/bets"),
          apiFetch("/admin/transactions/pending"),
          apiFetch("/admin/finance/summary"),
        ]);

        // แปลงเป็น JSON
        const [users, bets, txs, finance] = await Promise.all([
          usersRes.json(),
          betsRes.json(),
          txsRes.json(),
          financeRes.json(),
        ]);

        setStats({
          totalUsers: users.length || 0,
          totalBets: bets.length || 0,
          pendingTxs: txs.length || 0,
          todayProfit: (finance.total_deposit || 0) - (finance.total_withdraw || 0)
        });
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchStats();
  }, []);
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">

      {/* --- Section 1: Stats Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="สมาชิกทั้งหมด" value={stats?.totalUsers || 0} unit="Users" icon={<Users />} color="text-blue-500" bg="bg-blue-500/5" border="border-blue-500/20" />
        <StatCard title="บิลเดิมพันวันนี้" value={stats?.totalBets || 0} unit="Tickets" icon={<FileText />} color="text-purple-500" bg="bg-purple-500/5" border="border-purple-500/20" />
        <StatCard title="ยอดรออนุมัติ" value={stats?.pendingTxs || 0} unit="Requests" icon={<Clock />} color="text-rose-500" bg="bg-rose-500/5" border="border-rose-500/20" />
        <StatCard title="กำไรสุทธิวันนี้" value={`฿${stats?.todayProfit?.toLocaleString() || 0}`} unit="THB" icon={<TrendingUp />} color="text-emerald-400" bg="bg-emerald-500/5" border="border-emerald-500/20" />
      </div>

      {/* --- Section 2: Management Links --- */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-600">Quick Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLink href="/admin/transactions" title="Financial" subtitle="จัดการ ฝาก-ถอน" icon={<Wallet />} color="group-hover:text-emerald-400" />
          <QuickLink href="/admin/users" title="Users" subtitle="ปรับเครดิต/แบน" icon={<ShieldCheck />} color="group-hover:text-blue-400" />
          <QuickLink href="/admin/settlement" title="Settlement" subtitle="ตัดสินผลบอล" icon={<Trophy />} color="group-hover:text-amber-400" />
          <QuickLink href="/admin/config" title="Settings" subtitle="ตั้งค่าระบบ" icon={<Settings />} color="group-hover:text-rose-400" />
        </div>
      </div>

      {/* --- Section 3: System Status --- */}
      <div className="bg-gradient-to-r from-zinc-900/50 to-transparent border border-zinc-800 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10">
          <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <Database className="w-5 h-5 text-zinc-500" /> System Health
          </h4>
          <p className="text-zinc-500 text-sm mt-1">API Server Response: <span className="text-emerald-500 font-bold">12ms</span></p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 relative z-10">
          <StatusBadge label="API Core" active />
          <StatusBadge label="DB Node" active />
          <StatusBadge label="Socket.io" active />
          <StatusBadge label="Provider" active />
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatCard({ title, value, unit, icon, color, bg, border }: any) {
  return (
    <div className={`relative overflow-hidden ${bg} border ${border} p-8 rounded-[2.5rem] transition-all hover:-translate-y-1 duration-300 group`}>
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-[0.03] group-hover:scale-150 transition-transform`}>
        {icon}
      </div>
      <div className={`${color} mb-6`}>
        {/* Render Icon แบบกำหนดขนาด */}
        {cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
      </div>
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-white tracking-tighter">{value}</h3>
        <span className="text-[9px] font-black text-zinc-600 uppercase">{unit}</span>
      </div>
    </div>
  );
}

function QuickLink({ href, title, subtitle, icon, color }: any) {
  return (
    <Link href={href} className="group p-6 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl hover:bg-zinc-800/50 hover:border-zinc-700 transition-all flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className={`p-4 bg-black rounded-2xl text-zinc-500 ${color} transition-colors duration-300`}>
          {cloneElement(icon, { size: 24, strokeWidth: 2 })}
        </div>
        <div>
          <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">{title}</h4>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-1">{subtitle}</p>
        </div>
      </div>
      <ChevronRight className="text-zinc-800 group-hover:text-zinc-500 group-hover:translate-x-1 transition-all" size={20} />
    </Link>
  );
}

function StatusBadge({ label, active }: any) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 rounded-full border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-zinc-700'}`}></div>
      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}