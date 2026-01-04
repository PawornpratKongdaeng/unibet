"use client";
import { useState, useEffect, cloneElement } from "react";
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
  ChevronRight,
  Database,
  Activity,
  LayoutDashboard,
  Zap,
  ArrowUpRight
} from "lucide-react"; 
import { apiFetch } from "@/lib/api"; 

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || user?.role !== "admin") {
        window.location.href = "/login";
        return;
      }

      setIsReady(true); 

      try {
        const [usersRes, betsRes, txsRes, financeRes] = await Promise.all([
          apiFetch("/admin/users"),
          apiFetch("/admin/bets"),
          apiFetch("/admin/transactions/pending"),
          apiFetch("/admin/finance/summary"),
        ]);

        if (!usersRes.ok) return;

        const [users, bets, txs, finance] = await Promise.all([
          usersRes.json(),
          betsRes.json(),
          txsRes.json(),
          financeRes.json(),
        ]);

        setStats({
          totalUsers: users?.length || 0,
          totalBets: bets?.length || 0,
          pendingTxs: txs?.length || 0,
          todayProfit: (finance?.total_deposit || 0) - (finance?.total_withdraw || 0)
        });
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    fetchStats();
  }, []);

  // ✅ 1. ปรับ Loading Screen เป็นสีขาว/เทาอ่อน
  if (!isReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[10px]">Authorizing System...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 pb-12">
      
      {/* ✅ 2. Hero Banner: ปรับให้ดูซอฟต์ลง แต่ยังพรีเมียม */}

      {/* ✅ 3. Stats Section: เปลี่ยนพื้นหลังเป็นขาว ขอบเทาอ่อน */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatItem label="Active Members" value={stats?.totalUsers || 0} icon={<Users />} />
        <StatItem label="Daily Tickets" value={stats?.totalBets || 0} icon={<FileText />} />
        <StatItem label="Pending Actions" value={stats?.pendingTxs || 0} icon={<Clock />} color="text-rose-500" />
        <StatItem label="Net Profit (24H)" value={`฿${stats?.todayProfit?.toLocaleString() || 0}`} icon={<TrendingUp />} isHighlight={true} />
      </div>

      {/* ✅ 4. Management Grid: ปรับแต่งให้คลีน สบายตา */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 italic">Management Services</h3>
           <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
             <Activity size={12} className="animate-pulse" />
             Server Operational
           </div>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionBox href="/admin/finance" title="Transactions" sub="Finance Logs" icon={<Wallet />} />
          <ActionBox href="/admin/users" title="Users Control" sub="Member List" icon={<ShieldCheck />} />
          <ActionBox href="/admin/settlement" title="Settlement" sub="Manual Payout" icon={<Trophy />} />
          <ActionBox href="/admin/bets" title="Betting Logs" sub="Audit Tickets" icon={<Activity />} />
          
          <ActionBox href="/admin/bank-settings" title="Bank API" sub="Gateway Config" icon={<Database />} />
          <ActionBox href="/admin/finance" title="Withdraw" sub="Cash Out" icon={<ArrowUpRight />} />
          <ActionBox href="/admin/settings" title="Settings" sub="System Info" icon={<Settings />} />
          <ActionBox href="/admin" title="Live Stream" sub="Match Feeds" icon={<Zap />} />
        </div>
      </div>

    </div>
  );
}

// --- ✅ Sub Components: ปรับแต่งสี Slate และ Emerald ---

function StatItem({ label, value, icon, color = "text-emerald-600", isHighlight = false }: any) {
  return (
    <div className={`border p-7 rounded-[2.5rem] flex items-center justify-between group transition-all duration-300 ${
        isHighlight 
        ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-200" 
        : "bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-emerald-200"
    }`}>
      <div>
        <p className={`text-[10px] font-black uppercase tracking-[0.1em] mb-1 ${isHighlight ? "text-emerald-100" : "text-slate-400"}`}>{label}</p>
        <h4 className={`text-3xl font-[1000] italic tracking-tighter ${isHighlight ? "text-white" : color}`}>{value}</h4>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-500 ${
        isHighlight ? "bg-white/20 text-white" : "bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600"
      }`}>
        {cloneElement(icon, { size: 28, strokeWidth: 2.5 })}
      </div>
    </div>
  );
}

function ActionBox({ href, title, sub, icon }: any) {
  return (
    <Link href={href} className="group relative bg-white border border-slate-100 rounded-[2.5rem] p-9 flex flex-col items-center justify-center text-center gap-5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 hover:border-emerald-200">
      
      {/* Icon Section */}
      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-6 transition-all duration-500">
        {cloneElement(icon, { size: 32, strokeWidth: 2 })}
      </div>
      
      <div>
        <h5 className="text-base font-black text-slate-900 uppercase italic tracking-tighter leading-none">{title}</h5>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 group-hover:text-emerald-600 transition-colors">{sub}</p>
      </div>

      {/* Subtle floating arrow */}
      <div className="absolute top-6 right-8 text-slate-100 group-hover:text-emerald-200 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all">
         <ArrowUpRight size={20} />
      </div>
    </Link>
  );
}