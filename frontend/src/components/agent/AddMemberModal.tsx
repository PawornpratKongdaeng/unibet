// components/modals/AddMemberModal.tsx
import { useState } from "react";
import axios from "axios";
import { showToast } from "@/lib/sweetAlert";

// 1. กำหนด Interface สำหรับข้อมูลของตัวเราเอง (ผู้สร้าง)
interface MyInfo {
  role: "admin" | "master" | "agent" | string;
  share: number;
  com: number;
}

// 2. กำหนด Interface สำหรับ Props ของ Modal
interface AddMemberModalProps {
  myInfo: MyInfo;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddMemberModal({ myInfo, onClose, onSuccess }: AddMemberModalProps) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "user",
    share: 0,
    com: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/v3/agent/create", form);
      showToast("success", "สร้างสมาชิกสำเร็จ");
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast("error", err.response?.data?.error || "เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-[#0f172a] border border-slate-800 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-800/50 to-transparent">
          <h3 className="text-xl font-black text-white">➕ เพิ่มสมาชิกใหม่ในสายงาน</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Username" 
              placeholder="4-12 ตัวอักษร" 
              onChange={(v: string) => setForm({...form, username: v})} 
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="6 ตัวขึ้นไป" 
              onChange={(v: string) => setForm({...form, password: v})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 uppercase">ระดับสมาชิก</label>
              <select 
                className="bg-[#020617] border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition"
                value={form.role}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, role: e.target.value})}
              >
                {myInfo.role === "admin" && <option value="master">MASTER</option>}
                {(myInfo.role === "admin" || myInfo.role === "master") && <option value="agent">AGENT</option>}
                <option value="user">USER</option>
              </select>
            </div>
            <Input 
              label="เบอร์โทรศัพท์" 
              onChange={(v: string) => setForm({...form, phone: v})} 
            />
          </div>

          <div className="grid grid-cols-2 gap-6 p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
            <div className="space-y-2">
              <label className="text-xs font-bold text-yellow-500 uppercase italic">ค่าสู้หุ้น (%) - สูงสุด {myInfo.share}%</label>
              <input 
                type="number" 
                max={myInfo.share}
                className="w-full bg-[#020617] border border-slate-800 p-3 rounded-xl text-yellow-500 font-black text-xl outline-none"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, share: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-yellow-500 uppercase italic">ค่าคอม (%) - สูงสุด {myInfo.com}%</label>
              <input 
                type="number" 
                max={myInfo.com} 
                step="0.1"
                className="w-full bg-[#020617] border border-slate-800 p-3 rounded-xl text-yellow-500 font-black text-xl outline-none"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, com: Number(e.target.value)})}
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl transition-all shadow-lg shadow-yellow-500/20 active:scale-[0.98]">
            ยืนยันการเพิ่มสมาชิก
          </button>
        </form>
      </div>
    </div>
  );
}

// 3. กำหนด Interface สำหรับ Input Sub-component
interface InputProps {
  label: string;
  type?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function Input({ label, type = "text", placeholder, onChange }: InputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-slate-500 uppercase">{label}</label>
      <input 
        type={type} 
        placeholder={placeholder}
        className="bg-[#020617] border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-yellow-500 transition"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </div>
  );
}