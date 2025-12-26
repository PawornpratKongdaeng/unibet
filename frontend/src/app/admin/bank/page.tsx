"use client";
import { useState, useEffect } from "react";

export default function BankManagement() {
  const [banks, setBanks] = useState([]);
  const [newBank, setNewBank] = useState({ bank_name: "", account_name: "", account_number: "" });

  const addBank = async () => {
    // โค้ดส่ง fetch POST ไปที่ /api/v3/admin/banks
    alert("เพิ่มธนาคารสำเร็จ!");
  };

  return (
    <div className="p-6 bg-[#0f172a] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6 text-yellow-500">🏦 จัดการบัญชีธนาคารรับฝาก</h1>
      
      {/* Form เพิ่มธนาคาร */}
      <div className="bg-[#1e293b] p-6 rounded-xl border border-gray-700 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input className="bg-slate-700 p-2 rounded" placeholder="ชื่อธนาคาร" onChange={e => setNewBank({...newBank, bank_name: e.target.value})} />
          <input className="bg-slate-700 p-2 rounded" placeholder="ชื่อบัญชี" onChange={e => setNewBank({...newBank, account_name: e.target.value})} />
          <input className="bg-slate-700 p-2 rounded" placeholder="เลขบัญชี" onChange={e => setNewBank({...newBank, account_number: e.target.value})} />
        </div>
        <button onClick={addBank} className="mt-4 bg-green-600 px-6 py-2 rounded-lg hover:bg-green-500">เพิ่มบัญชี</button>
      </div>

      {/* ตารางแสดงธนาคาร */}
      <table className="w-full bg-[#1e293b] rounded-xl overflow-hidden">
        <thead className="bg-slate-800">
          <tr>
            <th className="p-4 text-left">ธนาคาร</th>
            <th className="p-4 text-left">ชื่อบัญชี</th>
            <th className="p-4 text-left">เลขบัญชี</th>
            <th className="p-4">สถานะ</th>
          </tr>
        </thead>
        <tbody>
          {/* Map ข้อมูลจาก API ตรงนี้ */}
        </tbody>
      </table>
    </div>
  );
}