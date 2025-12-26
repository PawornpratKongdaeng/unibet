"use client";
import { useState, useEffect } from "react";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api"; // ✅ เพิ่ม Import
import CreditModal from "@/components/CreditModal";
import CreateMemberModal from "@/components/CreateMemberModal";

interface Props {
  myInfo: any;
}

export default function TeamManager({ myInfo }: Props) {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const fetchTeam = async () => {
    if (!myInfo?.id) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/agent/team`); 
      const data = await res.json();
      
      if (res.ok) {
        setTeam(Array.isArray(data) ? data : []);
      } else {
        showToast("error", data.error || "ดึงข้อมูลล้มเหลว");
      }
    } catch (err) {
      showToast("error", "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [myInfo?.id]); // ✅ ใช้ id เป็น dependency จะแม่นยำกว่า

  const totalTeamBalance = team.reduce((acc: number, curr: any) => acc + (curr.balance || 0), 0);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">จัดการสายงาน</h2>
          <p className="text-slate-500 text-sm">ดูแลสมาชิกและบริหารจัดการเครดิตทั้งหมดในทีมของคุณ</p>
        </div>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-2xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span> สร้างสมาชิกใหม่
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-br from-yellow-500 to-amber-600 p-8 rounded-[2.5rem] shadow-xl shadow-yellow-500/10 text-black relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[11px] font-black opacity-70 uppercase tracking-widest">เครดิตส่วนตัวของคุณ</p>
            <h3 className="text-4xl font-black mt-2 tracking-tighter">฿ {(myInfo?.balance || 0).toLocaleString()}</h3>
            <div className="mt-4 flex gap-2">
              <span className="bg-black/10 px-3 py-1 rounded-full text-[10px] font-bold border border-black/5">หุ้น: {myInfo?.share_percent || 0}%</span>
              <span className="bg-black/10 px-3 py-1 rounded-full text-[10px] font-bold border border-black/5">คอม: {myInfo?.commission || 0}%</span>
            </div>
          </div>
          <span className="absolute -right-6 -bottom-8 text-black/10 text-9xl font-black italic group-hover:scale-110 transition-transform duration-700">💰</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 p-8 rounded-[2.5rem] relative overflow-hidden group">
          <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest">ยอดเครดิตรวมลูกทีม</p>
          <h3 className="text-4xl font-black mt-2 text-white tracking-tighter">฿ {totalTeamBalance.toLocaleString()}</h3>
          <p className="text-[11px] text-slate-400 mt-4 font-bold uppercase">จำนวนสมาชิก: <span className="text-blue-400">{team.length}</span> รายการ</p>
          <span className="absolute -right-6 -bottom-8 text-slate-800/20 text-9xl font-black italic group-hover:rotate-12 transition-transform duration-700">📊</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 bg-[#1e293b]/20 flex items-center gap-3">
           <div className="w-2 h-6 bg-yellow-500 rounded-full"></div>
           <h3 className="text-lg font-bold text-white tracking-tight">รายชื่อสมาชิก</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900/40 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                <th className="px-8 py-5">ข้อมูลผู้ใช้</th>
                <th className="px-6 py-5">ระดับ</th>
                <th className="px-6 py-5">เครดิตคงเหลือ</th>
                <th className="px-8 py-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-500 animate-pulse">กำลังโหลดข้อมูล...</td></tr>
              ) : team.length > 0 ? (
                team.map((member: any) => (
                  <tr key={member.id || member.ID} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-800 rounded-xl flex items-center justify-center text-xs group-hover:bg-yellow-500 group-hover:text-black transition-all font-bold">
                          {(member.username || "??").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-bold tracking-tight">{member.username}</p>
                          <p className="text-[10px] text-slate-500 font-medium tracking-tighter uppercase italic">
                            ID: #{String(member.id || 0).padStart(4, '0')} {/* ✅ แก้ไขป้องกัน Error */}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border shadow-sm ${
                        member.role === 'agent' 
                        ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/20' 
                        : 'bg-slate-800/50 text-slate-400 border-slate-700'
                      }`}>
                        {(member.role || 'user').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-green-400 font-mono font-bold text-lg leading-none">฿ {(member.balance || 0).toLocaleString()}</p>
                      <p className="text-[9px] text-slate-600 mt-1 font-bold uppercase">Status: Active</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => { setSelectedUser(member); setIsCreditModalOpen(true); }}
                          className="bg-yellow-500 hover:bg-yellow-400 text-black text-[11px] font-black px-5 py-2.5 rounded-xl shadow-lg shadow-yellow-500/10 transition-all hover:-translate-y-0.5"
                        >
                          ฝาก/ถอน
                        </button>
                        <button className="bg-slate-800/50 hover:bg-red-500/20 hover:text-red-500 text-slate-500 p-2.5 rounded-xl border border-slate-700 transition-all">
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center opacity-20 grayscale">
                      <span className="text-7xl mb-4">🛸</span>
                      <p className="font-black text-xs uppercase tracking-[0.3em]">No Member Found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {isCreditModalOpen && selectedUser && (
        <CreditModal 
          isOpen={isCreditModalOpen}
          onClose={() => { setIsCreditModalOpen(false); setSelectedUser(null); }}
          targetUser={selectedUser}
          agentInfo={myInfo}
          onSuccess={fetchTeam}
        />
      )}

      {isCreateModalOpen && (
        <CreateMemberModal 
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          upline={myInfo}
          onSuccess={fetchTeam}
        />
      )}
    </div>
  );
}