"use client";
import { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import Link from "next/link";
import { usePathname } from "next/navigation";

// --- Main Admin Dashboard ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // เริ่มที่หน้า Overview
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State ข้อมูลจาก Backend
  const [users, setUsers] = useState<any[]>([]);
  const [bets, setBets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]); // เพิ่ม state สำหรับฝาก-ถอน

  const initDashboard = useCallback(async () => {
    const token = localStorage.getItem("token");
    const fetchData = async (endpoint: string) => {
      const response = await fetch(`http://localhost:8080/api/v3/admin/${endpoint}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Unauthorized or Server Error");
      return response.json();
    };

    try {
      const [adminData, usersData, betsData, txData] = await Promise.all([
        fetch("http://localhost:8080/api/v3/me", {
          headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" }
        }).then(res => res.json()),
        fetchData("users"),
        fetchData("bets"),
        fetchData("transactions/pending") // ดึงข้อมูลธุรกรรมมาคำนวณยอด
      ]);
      setAdminInfo(adminData);
      setUsers(usersData);
      setBets(betsData);
      setTransactions(txData);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { initDashboard(); }, [initDashboard]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <DashboardOverview users={users} bets={bets} transactions={transactions} onNavigate={setActiveTab} />;
      case "users": 
        return <UserManagementDemo users={users} onRefresh={initDashboard} />;
      case "transactions":
        return <div className="text-white p-10 bg-zinc-900 rounded-3xl border border-zinc-800 uppercase font-black">Transaction Approval Page</div>;
      case "finance":
        return <div className="text-white p-10 bg-zinc-900 rounded-3xl border border-zinc-800 uppercase font-black">Financial Reports</div>;
      case "bank":
        return <div className="text-white p-10 bg-zinc-900 rounded-3xl border border-zinc-800 uppercase font-black">Admin Bank Settings</div>;
      case "bets": 
        return <AllBetsReportDemo bets={bets} />;
      case "settings":
        return <SettingsDemo />;
      default: 
        return <DashboardOverview users={users} bets={bets} transactions={transactions} onNavigate={setActiveTab} />;
    }
  };

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-black text-white flex relative overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-900 transform transition-all duration-500 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-black text-xl">A</div>
            <h1 className="text-xl font-black text-white tracking-tighter">SOCCER ADMIN</h1>
          </div>
          
          <nav className="flex-1 space-y-1">
  <NavItem icon="🏠" label="หน้าหลัก" sublabel="Overview" href="/admin" />
  <NavItem icon="👥" label="จัดการสมาชิก" sublabel="Users" href="/admin/add-user" />
  <NavItem icon="💸" label="รายการฝาก-ถอน" sublabel="Transactions" href="/admin/transactions" />
  <NavItem icon="📊" label="สรุปการเงิน" sublabel="Finance" href="/admin/finance" />
  <NavItem icon="📑" label="รายงานเดิมพัน" sublabel="Bets" href="/admin/bets" />
  <NavItem icon="🏦" label="ตั้งค่าธนาคาร" sublabel="Bank Settings" href="/admin/bank-settings" />
  <NavItem icon="⚙️" label="ตั้งค่าระบบ" sublabel="Settings" href="/admin/settings" />
</nav>

          <button onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }} className="w-full mt-auto p-4 text-xs font-black text-zinc-500 hover:text-white bg-zinc-900/50 rounded-2xl border border-zinc-800 transition-all uppercase tracking-widest">
            Logout System
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-zinc-900 bg-black/50 backdrop-blur-md sticky top-0 z-40 flex items-center px-8">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-white mr-4">☰</button>
          <div className="flex-1"><h2 className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">{activeTab} Mode</h2></div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-[10px] font-black text-zinc-600 uppercase">Current Admin</p>
              <p className="text-sm font-bold text-white">{adminInfo?.username}</p>
            </div>
            <div className="w-10 h-10 bg-zinc-900 rounded-full border border-zinc-800 flex items-center justify-center italic font-black">A</div>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

// --- Sub-Component: User Management ---
function UserManagementDemo({ users, onRefresh }: { users: any[], onRefresh: () => void }) {
  const [editingUser, setEditingUser] = useState<any>(null);

  const handleUpdateUser = async (updatedData: any) => {
    // ... โค้ด handleUpdateUser เดิม ...
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`http://localhost:8080/api/v3/admin/users/${updatedData.id}`, {
        method: "PATCH",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ balance: Number(updatedData.balance), role: updatedData.role })
      });
      if (response.ok) { setEditingUser(null); onRefresh(); }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-400 uppercase tracking-widest">Total Users</h3>
          <p className="text-4xl font-black text-white leading-none">{users.length}</p>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 bg-white text-black font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
          <PlusIcon /> Add User
        </button>
      </div>

      {/* --- Desktop Table View (ซ่อนในมือถือ) --- */}
      <div className="hidden md:block bg-zinc-950/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-zinc-900/50 border-b border-zinc-800">
            <tr className="text-zinc-500 text-[10px] font-black uppercase">
              <th className="px-8 py-5">Username</th>
              <th className="px-8 py-5">Role</th>
              <th className="px-8 py-5">Balance</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-sm">
{users.map((user) => (
   <tr key={user.id || user.ID || user.username} className="hover:bg-zinc-900/30 transition-colors">
                <td className="px-8 py-5 font-bold text-white text-base">{user.username}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-8 py-5 font-black text-green-400 text-base">฿{user.balance?.toLocaleString()}</td>
                <td className="px-8 py-5 text-right">
                  <button onClick={() => setEditingUser(user)} className="px-5 py-2.5 bg-zinc-900 hover:bg-white hover:text-black border border-zinc-800 rounded-xl font-bold transition-all">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- Mobile Card View (แสดงเฉพาะในมือถือ) --- */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
{users.map((user) => (
    <div key={user.id || user.ID || user.username} className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-3xl space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Username</p>
                <h4 className="text-lg font-bold text-white">{user.username}</h4>
              </div>
              <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase ${user.role === 'admin' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                {user.role}
              </span>
            </div>
            
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase mb-1">Balance</p>
              <p className="text-xl font-black text-green-400">฿{user.balance?.toLocaleString()}</p>
            </div>

            <button 
              onClick={() => setEditingUser(user)} 
              className="w-full py-3 bg-white/5 hover:bg-white hover:text-black border border-white/10 text-white font-bold rounded-2xl transition-all"
            >
              Edit User Details
            </button>
          </div>
        ))}
      </div>

      {/* Modal ปรับความกว้างให้รองรับมือถือ */}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} />}
    </div>
  );
}

// --- Sub-Component: Edit Modal ---
function EditUserModal({ user, onClose, onSave }: any) {
  const [balance, setBalance] = useState(user.balance);
  const [role, setRole] = useState(user.role);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h4 className="text-xl font-black text-white uppercase mb-6">Edit User: {user.username}</h4>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Update Balance</label>
            <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-black text-zinc-500 uppercase block mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-white transition-colors appearance-none">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button onClick={onClose} className="flex-1 px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-all">Cancel</button>
            <button onClick={() => onSave({ id: user.ID, balance, role })} className="flex-1 px-6 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-all">Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component: Stats & Others (ย่อ) ---
function AllBetsReportDemo({ bets }: { bets: any[] }) {
  const totalWagered = bets.reduce((sum, b) => sum + (b.amount || 0), 0);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Bets" value={bets.length.toString()} icon={<DiceIcon />} />
        <StatCard title="Total Wagered" value={`฿${totalWagered.toLocaleString()}`} icon={<DollarIcon />} />
        <StatCard title="Win/Loss" value="฿0" icon={<TrendingIcon />} />
      </div>
      {/* ตารางบิลเดิมพันเหมือนเดิม... */}
    </div>
  );
}

function SettingsDemo() {
  return (
    <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
      <h3 className="text-xl font-bold text-white mb-6">System Settings</h3>
      <SettingItem label="Maintenance Mode" description="ปิดปรับปรุงระบบ" />
    </div>
  );
}

// --- Reusable UI Elements ---
function NavItem({ icon, label, sublabel, href }: { icon: any, label: string, sublabel: string, href: string }) {
  const pathname = usePathname();
  // เช็คว่า pathname ปัจจุบันตรงกับ href หรือไม่
  const isActive = pathname === href;

  return (
    <Link href={href} className="block w-full">
      <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
        isActive 
          ? "bg-white text-black font-black scale-[1.02] shadow-xl shadow-white/5" 
          : "text-zinc-500 hover:text-white hover:bg-zinc-900"
      }`}>
        <span className="text-xl">{icon}</span>
        <div className="text-left">
          <p className="text-sm font-bold leading-none">{label}</p>
          <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
            isActive ? "text-zinc-400" : "text-zinc-600"
          }`}>
            {sublabel}
          </p>
        </div>
      </div>
    </Link>
  );
}
function StatCard({ title, value, icon }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl shadow-xl">
      <div className="flex justify-between items-center mb-4"><div className="text-white">{icon}</div></div>
      <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function SettingItem({ label, description }: any) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      <div><p className="font-bold text-white">{label}</p><p className="text-sm text-zinc-500">{description}</p></div>
      <button onClick={() => setEnabled(!enabled)} className={`relative w-14 h-8 rounded-full transition-colors ${enabled ? 'bg-white' : 'bg-zinc-800'}`}>
        <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all ${enabled ? 'translate-x-6 bg-black' : 'bg-zinc-600'}`}></div>
      </button>
    </div>
  );
}

// Icons (Copy from previous responses...)
const UsersIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ChartIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const MenuIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const UserIcon = () => <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const DiceIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>;
const DollarIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const TrendingIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;

function DashboardOverview({ users, bets, transactions, onNavigate }: any) {
  // คำนวณยอด (ในงานจริงควรให้ Backend ส่งยอดสรุปมาให้เลยจะเร็วขึ้น)
  const totalStake = bets.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const onlineUsers = users.filter((u: any) => u.is_online).length; // สมมติว่ามี field is_online
  
  // ตัวอย่างข้อมูลยอดฝาก-ถอน (กรองจาก transactions ถ้ามีข้อมูลสถานะ success)
  const totalDeposit = transactions.filter((t: any) => t.type === 'deposit' && t.status === 'success').reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalWithdraw = transactions.filter((t: any) => t.type === 'withdraw' && t.status === 'success').reduce((sum: number, t: any) => sum + t.amount, 0);

  const stats = [
    { label: "สมาชิกทั้งหมด", value: users.length, unit: "คน", icon: "👥", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "กำลังออนไลน์", value: onlineUsers || 1, unit: "คน", icon: "🟢", color: "text-green-500", bg: "bg-green-500/10" },
    { label: "ยอดฝากวันนี้", value: `฿${totalDeposit.toLocaleString()}`, unit: "Total", icon: "💰", color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "ยอดถอนวันนี้", value: `฿${totalWithdraw.toLocaleString()}`, unit: "Total", icon: "💸", color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: "ยอดเล่นสะสม (Turnover)", value: `฿${totalStake.toLocaleString()}`, unit: "Volume", icon: "⚽", color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "บิลเดิมพันวันนี้", value: bets.length, unit: "Tickets", icon: "📝", color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] hover:border-zinc-700 transition-all group">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
            <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
              <span className="text-[10px] font-black text-zinc-600 uppercase">{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={() => onNavigate('transactions')} className="p-8 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[2.5rem] cursor-pointer hover:border-white/20 transition-all flex justify-between items-center group">
          <div>
            <h4 className="text-xl font-black text-white uppercase italic">Financial Pending</h4>
            <p className="text-zinc-500 text-sm">มีรายการรออนุมัติ {transactions.length} รายการ</p>
          </div>
          <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">→</div>
        </div>
        <div onClick={() => onNavigate('users')} className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] cursor-pointer hover:border-white/20 transition-all flex justify-between items-center group">
          <div>
            <h4 className="text-xl font-black text-white uppercase italic">User Control</h4>
            <p className="text-zinc-500 text-sm">จัดการข้อมูลและเครดิตสมาชิก</p>
          </div>
          <div className="w-12 h-12 rounded-full border border-zinc-800 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">→</div>
        </div>
      </div>
    </div>
  );
}

// --- Icons เพิ่มเติมเพื่อให้ครบทุกหน้า ---
const TrophyIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9" /></svg>;
const AgentIcon = () => <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const ArrowIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>;