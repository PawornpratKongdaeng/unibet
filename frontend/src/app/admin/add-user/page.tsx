"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api"; // ฟังก์ชันดึง API ที่คุณมีอยู่

export default function AddUserPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    role: "agent", // ค่าเริ่มต้น
    share: 0,
    com: 0,
    credit: 0
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch("/admin/create-user", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      alert("สร้างผู้ใช้งานสำเร็จ!");
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">เพิ่มสมาชิกใหม่ (โดย Admin)</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Username</label>
          <input 
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input 
            type="password"
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-medium">ระดับ (Role)</label>
          <select 
            className="w-full p-2 border rounded"
            onChange={(e) => setFormData({...formData, role: e.target.value})}
          >
            <option value="master">Master</option>
            <option value="agent">Agent</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">หุ้น (%)</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              onChange={(e) => setFormData({...formData, share: Number(e.target.value)})} 
            />
          </div>
          <div>
            <label className="block text-sm font-medium">คอม (%)</label>
            <input 
              type="number" 
              step="0.01" 
              className="w-full p-2 border rounded"
              onChange={(e) => setFormData({...formData, com: Number(e.target.value)})} 
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          สร้างสมาชิก
        </button>
      </form>
    </div>
  );
}