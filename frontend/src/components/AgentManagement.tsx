"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { showToast } from "@/lib/sweetAlert";

export default function AgentManagement() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // ข้อมูลสำหรับสร้างสมาชิกใหม่
  const [newMember, setNewMember] = useState({
    username: "",
    password: "",
    role: "user",
    share: 0,
    com: 0
  });

  // ข้อมูลโอนเงิน
  const [transferAmount, setTransferAmount] = useState(0);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await apiFetch("/agent/team");
      const data = await res.json();
      setTeam(data.team || []);
    } catch (err) {
      showToast("error", "โหลดข้อมูลสายงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/agent/create-downline", {
        method: "POST",
        body: JSON.stringify(newMember),
      });
      if (res.ok) {
        showToast("success", "สร้างสมาชิกใหม่สำเร็จ");
        setShowAddModal(false);
        fetchTeam();
      } else {
        const data = await res.json();
        showToast("error", data.error);
      }
    } catch (err) {
      showToast("error", "เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const handleTransfer = async () => {
    if (!selectedUser || transferAmount <= 0) return;
    try {
      const res = await apiFetch("/agent/transfer", {
        method: "POST",
        body: JSON.stringify({
          to_user_id: selectedUser.id,
          amount: transferAmount
        }),
      });
      if (res.ok) {
        showToast("success", `โอนเครดิตให้ ${selectedUser.username} สำเร็จ`);
        setShowTransferModal(false);
        setTransferAmount(0);
        fetchTeam();
      } else {
        const data = await res.json();
        showToast("error", data.error);
      }
    } catch (err) {
      showToast("error", "โอนเงินไม่สำเร็จ");
    }
  };

  return (
    <div className="p-6 space-y-6 text-white animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">Team Management</h2>
          <p className="text-zinc-500 text-sm">จัดการสมาชิกและเครดิตในสายงานของคุณ</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-white text-black font-bold px-6 py-3 rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-2"
        >
          <PlusIcon /> เพิ่มสมาชิกใหม่
        </button>
      </div>

      {/* Team Table */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-800/50 text-zinc-400 text-[10px] uppercase tracking-[0.2em]">
              <th className="p-6 font-black">Username</th>
              <th className="p-6 font-black">Role</th>
              <th className="p-6 font-black">Credit</th>
              <th className="p-6 font-black">Share/Com</th>
              <th className="p-6 font-black text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {team.map((member: any) => (
              <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-6">
                  <span className="font-bold text-lg">{member.username}</span>
                </td>
                <td className="p-6">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    member.role === 'user' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {member.role}
                  </span>
                </td>
                <td className="p-6">
                  <span className="text-xl font-mono text-green-500">฿{member.credit.toLocaleString()}</span>
                </td>
                <td className="p-6 text-zinc-400 text-sm">
                  {member.share}% / {member.com}%
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => { setSelectedUser(member); setShowTransferModal(true); }}
                    className="bg-zinc-800 group-hover:bg-white group-hover:text-black p-3 rounded-xl transition-all"
                  >
                    <WalletIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Transfer Credit */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 p-8 rounded-[2.5rem] max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black mb-1">โอนเครดิต</h3>
            <p className="text-zinc-500 text-sm mb-6">โอนให้: <span className="text-white font-bold">{selectedUser?.username}</span></p>
            
            <input 
              type="number" 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-6 outline-none focus:border-white transition-all text-2xl font-mono text-center"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(Number(e.target.value))}
            />

            <div className="flex gap-3">
              <button onClick={() => setShowTransferModal(false)} className="flex-1 py-4 font-bold text-zinc-500 hover:text-white transition-all">ยกเลิก</button>
              <button onClick={handleTransfer} className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">ยืนยันการโอน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icons
const PlusIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const WalletIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;