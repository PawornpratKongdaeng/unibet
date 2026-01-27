"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  Users, Wallet, ArrowRight, Download, Upload, RefreshCw, Calendar
} from "lucide-react"; 
import { apiFetch } from "@/lib/api"; 

// --- Helper Functions ---
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(val).replace('฿', '฿ ');

const StatCard = ({ label, value, icon, colorClass }: any) => (
  // เอา transition-all ออก
  <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-md group">
    <div className={`p-3 w-fit rounded-2xl bg-slate-50 ${colorClass} mb-4`}>{icon}</div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className="text-2xl font-[1000] text-slate-800 tracking-tighter italic leading-none">{value}</h4>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // --- Date Range States ---
  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [dateError, setDateError] = useState("");

  const loadData = useCallback(async () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) {
      setDateError("⚠️ ช่วงวันที่เลือกต้องไม่เกิน 30 วัน");
      return;
    }
    
    setDateError("");
    setIsRefreshing(true);

    try {
      const [usersRes, financeRes, logsRes] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/admin/finance/summary"),
        apiFetch(`/admin/transactions?start=${startDate}&end=${endDate}`) 
      ]);

      const users = await usersRes.json();
      const finance = await financeRes.json();
      const logs = await logsRes.json();

      setStats({
        totalUsers: users?.length || 0,
        totalMemberUnit: users?.reduce((acc: number, u: any) => acc + Number(u.credit || 0), 0) || 0,
        activeUsers: users?.filter((u: any) => u.status !== 'locked').length || 0,
        totalDeposit: finance?.total_deposit || 0,
        totalWithdraw: finance?.total_withdraw || 0,
      });

      // ✅ Filter: เอาเฉพาะ Deposit และ Withdraw เท่านั้น
      if (Array.isArray(logs)) {
        const filteredLogs = logs.filter((tx: any) => 
          ['deposit', 'withdraw'].includes(tx.type)
        );
        setTransactions(filteredLogs);
      } else {
        setTransactions([]);
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [startDate, endDate]); 

  useEffect(() => { loadData(); }, [loadData]);

  // เอา animate-pulse ออก
  if (isLoading) return <div className="p-20 text-center font-black text-slate-400">LOADING SYSTEM...</div>;

  return (
    // เอา animate-in fade-in duration-700 ออก
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-10">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Deposit" value={formatCurrency(stats?.totalDeposit)} icon={<Download size={20}/>} colorClass="text-emerald-500" />
        <StatCard label="Total Withdraw" value={formatCurrency(stats?.totalWithdraw)} icon={<Upload size={20}/>} colorClass="text-rose-500" />
        <StatCard label="Total Members" value={stats?.totalUsers} icon={<Users size={20}/>} colorClass="text-slate-800" />
        <StatCard label="Credit in System" value={formatCurrency(stats?.totalMemberUnit)} icon={<Wallet size={20}/>} colorClass="text-sky-500" />
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div>
            <h3 className="text-xl font-[1000] text-slate-800 uppercase italic leading-none">Deposit & Withdraw Logs</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
              Range: {startDate} to {endDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {dateError && (
              // เอา animate-bounce ออก
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                {dateError}
              </span>
            )}
            
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 px-2">
                <Calendar size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={startDate}
                  max={endDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-black uppercase outline-none text-slate-600 cursor-pointer"
                />
              </div>
              <ArrowRight size={14} className="text-slate-300" />
              <div className="px-2">
                <input 
                  type="date" 
                  value={endDate}
                  min={startDate}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-black uppercase outline-none text-slate-600 cursor-pointer"
                />
              </div>
            </div>

            <button 
              onClick={loadData} 
              disabled={isRefreshing}
              // เอา transition-all ออก
              className={`p-4 rounded-2xl shadow-sm ${isRefreshing ? 'bg-slate-100' : 'bg-slate-900 hover:bg-emerald-500 text-white hover:shadow-emerald-200 shadow-xl'}`}
            >
              {/* เอา animate-spin ออก */}
              <RefreshCw size={20} className={isRefreshing ? 'text-slate-400' : ''} />
            </button>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-[1000] text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-6">Transaction Type</th>
                <th className="p-6">User / Member</th>
                <th className="p-6 text-right">Amount</th>
                <th className="p-6 text-right">Balance After</th>
                <th className="p-6 text-right">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.length > 0 ? (
                transactions.map((tx: any, idx: number) => {
                  const isDeposit = tx.type === 'deposit';
                  
                  // กำหนด Style ตามประเภท
                  const badgeStyle = isDeposit 
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-rose-100 text-rose-700 ring-1 ring-rose-200";

                  const amountColor = isDeposit ? 'text-emerald-600' : 'text-rose-600';
                  const sign = isDeposit ? '+' : '-';

                  return (
                    // เอา transition-colors ออก
                    <tr key={idx} className="hover:bg-slate-50/50 group">
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter ${badgeStyle}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-6 font-bold text-xs text-slate-700">
                        {tx.to_user || tx.username}
                      </td>
                      <td className="p-6 text-right font-black italic">
                        <span className={amountColor}>
                          {sign} ฿{Number(tx.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-6 text-right font-black text-slate-900 tabular-nums">
                        ฿{Number(tx.balance_after).toLocaleString()}
                      </td>
                      <td className="p-6 text-right">
                        <div className="text-[10px] font-black text-slate-400">
                          {new Date(tx.created_at).toLocaleString('th-TH')}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">
                    No deposit/withdraw records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}