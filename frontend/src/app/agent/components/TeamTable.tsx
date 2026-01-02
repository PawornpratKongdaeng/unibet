// components/TeamTable.tsx
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { UserPlus, ArrowRightLeft, Shield, Search } from "lucide-react";
import CreditModal from "@/components/CreditModal"; // มั่นใจว่ามีไฟล์นี้
import CreateMemberModal from "@/components/CreateMemberModal";

export default function TeamTable({ myInfo, refreshMyInfo }: any) {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreditOpen, setIsCreditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [target, setTarget] = useState(null);

  const fetchTeam = async () => {
    setLoading(true);
    const res = await apiFetch("/agent/team");
    if (res.ok) setTeam(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchTeam(); }, []);

  const totalBalance = team.reduce((a, b) => a + (Number(b.balance) || 0), 0);

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">My Credit</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black italic tracking-tighter text-emerald-400">฿{(myInfo?.balance || 0).toLocaleString()}</span>
            <span className="text-zinc-700 text-[10px] font-black mb-2 uppercase italic">Available</span>
          </div>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2.5rem]">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">Team Total Balance</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black italic tracking-tighter text-white">฿{totalBalance.toLocaleString()}</span>
            <span className="text-zinc-700 text-[10px] font-black mb-2 uppercase italic">{team.length} Members</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-[2rem] border border-zinc-900">
         <div className="flex items-center gap-4 ml-4">
            <div className="w-2 h-6 bg-blue-600 rounded-full" />
            <h3 className="font-black uppercase italic tracking-tighter">Member List</h3>
         </div>
         <button 
           onClick={() => setIsCreateOpen(true)}
           className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-3.5 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
         >
           <UserPlus size={18} /> New Member
         </button>
      </div>

      {/* Table */}
      <div className="bg-zinc-900/20 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-zinc-900/50 text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
              <th className="px-8 py-6">Member Identity</th>
              <th className="px-6 py-6">Credit</th>
              <th className="px-8 py-6 text-right">Operation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {team.map((m) => (
              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-xs group-hover:bg-white group-hover:text-black transition-all">
                      {m.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black italic text-white tracking-tighter">{m.username}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase italic tracking-widest">{m.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-6">
                  <span className="text-xl font-black italic text-emerald-400">฿{m.balance.toLocaleString()}</span>
                </td>
                <td className="px-8 py-6 text-right">
                   <button 
                    onClick={() => { setTarget(m); setIsCreditOpen(true); }}
                    className="bg-zinc-900 hover:bg-white hover:text-black text-zinc-500 px-6 py-2.5 rounded-xl border border-zinc-800 transition-all font-black text-[10px] uppercase italic"
                   >
                     Transfer
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isCreditOpen && (
        <CreditModal 
          isOpen={isCreditOpen} 
          onClose={() => setIsCreditOpen(false)} 
          targetUser={target} 
          agentInfo={myInfo}
          onSuccess={() => { fetchTeam(); refreshMyInfo(); }} 
        />
      )}
      {isCreateOpen && (
        <CreateMemberModal 
          isOpen={isCreateOpen} 
          onClose={() => setIsCreateOpen(false)} 
          upline={myInfo} 
          onSuccess={fetchTeam} 
        />
      )}
    </div>
  );
}