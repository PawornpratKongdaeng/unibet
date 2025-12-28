"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem("token");
      const headers = { "Authorization": `Bearer ${token}` };
      
      try {
        const [users, bets, txs, finance] = await Promise.all([
          fetch("http://localhost:8080/api/v3/admin/users", { headers }).then(res => res.json()),
          fetch("http://localhost:8080/api/v3/admin/bets", { headers }).then(res => res.json()),
          fetch("http://localhost:8080/api/v3/admin/transactions/pending", { headers }).then(res => res.json()),
          // เพิ่มการดึงสรุปยอดเงินวันนี้
          fetch("http://localhost:8080/api/v3/admin/finance/summary", { headers }).then(res => res.json()),
        ]);

        setStats({
          totalUsers: users.length,
          totalBets: bets.length,
          pendingTxs: txs.length,
          totalTurnover: bets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
          todayProfit: (finance.total_deposit || 0) - (finance.total_withdraw || 0)
        });
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* --- Section 1: Top Stats --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="สมาชิกทั้งหมด" value={stats?.totalUsers || 0} unit="คน" icon="👥" color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="บิลเดิมพันวันนี้" value={stats?.totalBets || 0} unit="บิล" icon="📝" color="text-purple-500" bg="bg-purple-500/10" />
        <StatCard title="ยอดรออนุมัติ" value={stats?.pendingTxs || 0} unit="รายการ" icon="⏳" color="text-rose-500" bg="bg-rose-500/10" />
        <StatCard title="กำไรสุทธิวันนี้" value={`฿${stats?.todayProfit?.toLocaleString() || 0}`} unit="บาท" icon="📈" color={stats?.todayProfit >= 0 ? "text-emerald-400" : "text-rose-400"} bg="bg-emerald-500/10" />
      </div>

      {/* --- Section 2: Quick Action Links --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* จัดการธุรกรรม */}
        <QuickLink href="/admin/transactions" title="Financial" subtitle="จัดการ ฝาก-ถอน" icon="💸" accent="from-emerald-500/20" />
        
        {/* จัดการสมาชิก */}
        <QuickLink href="/admin/users" title="Users" subtitle="ปรับเครดิต/แบน" icon="⚙️" accent="from-blue-500/20" />
        
        {/* เคลียร์บิลบอล (เพิ่มใหม่) */}
        <QuickLink href="/admin/settlement" title="Settlement" subtitle="ตัดสินผลแพ้-ชนะ" icon="⚽" accent="from-amber-500/20" />
        
        {/* ตั้งค่าธนาคาร (เพิ่มใหม่) */}
        <QuickLink href="/admin/config" title="Settings" subtitle="เปลี่ยนบัญชี/ระบบ" icon="🏦" accent="from-zinc-500/20" />
      </div>

      {/* --- Section 3: Summary Area --- */}
      <div className="bg-zinc-900/20 border border-zinc-800/50 p-8 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-xl font-black text-white uppercase italic tracking-tighter">System Health</h4>
          <p className="text-zinc-500 text-sm">ตรวจสอบสถานะการเชื่อมต่อ API และ Database</p>
        </div>
        <div className="flex gap-4">
          <StatusBadge label="API Server" active />
          <StatusBadge label="HtayAPI" active />
          <StatusBadge label="Bank Sync" active />
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function QuickLink({ href, title, subtitle, icon, accent }: any) {
  return (
    <Link href={href} className={`p-6 bg-zinc-900/40 border border-zinc-800 rounded-[2rem] hover:border-white/20 transition-all group relative overflow-hidden`}>
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${accent} to-transparent opacity-0 group-hover:opacity-100 transition-all`}></div>
      <div className="text-3xl mb-4">{icon}</div>
      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter">{title}</h4>
      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{subtitle}</p>
    </Link>
  );
}

function StatCard({ title, value, unit, icon, color, bg }: any) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-700 transition-all group">
      <div className={`w-14 h-14 ${bg} ${color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
        <span className="text-[10px] font-black text-zinc-600 uppercase">{unit}</span>
      </div>
    </div>
  );
}

function StatusBadge({ label, active }: any) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-zinc-800">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-700'}`}></div>
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}