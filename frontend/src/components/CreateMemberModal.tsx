"use client";
import { useState } from "react";
import { showToast } from "@/lib/sweetAlert";

export default function CreateMemberModal({ isOpen, onClose, upline, onSuccess }: any) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "user",
    share_percent: 0,
    commission: 0
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    // Check share percent rule
    if (formData.share_percent > upline.share_percent && upline.role !== "admin") {
      return showToast("error", `คุณถือหุ้นได้สูงสุดแค่ ${upline.share_percent}%`);
    }

    try {
      const res = await fetch("http://localhost:8080/api/v3/agent/create-downline", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ ...formData, parent_id: upline.id }),
      });

      if (res.ok) {
        showToast("success", "สร้างสมาชิกสำเร็จ");
        onSuccess();
        onClose();
      } else {
        const data = await res.json();
        showToast("error", data.error);
      }
    } catch (err) {
      showToast("error", "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-slate-700 w-full max-w-md rounded-3xl p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-white mb-6 uppercase italic">สร้างสมาชิกใหม่</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Username</label>
            <input 
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 text-white outline-none focus:border-yellow-500"
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
            <input 
              type="password" required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 text-white outline-none focus:border-yellow-500"
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">ประเภท</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 text-white outline-none"
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="user">MEMBER</option>
                <option value="agent">AGENT</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">ถือหุ้น (%)</label>
              <input 
                type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 mt-1 text-white outline-none focus:border-yellow-500"
                placeholder={`สูงสุด ${upline.share_percent}%`}
                onChange={e => setFormData({...formData, share_percent: Number(e.target.value)})}
              />
            </div>
          </div>
          
          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl mt-6 shadow-xl shadow-yellow-500/10">
            ยืนยันการสมัคร
          </button>
          <button type="button" onClick={onClose} className="w-full text-slate-500 text-xs font-bold uppercase hover:text-white transition-colors">
            ยกเลิก
          </button>
        </form>
      </div>
    </div>
  );
}