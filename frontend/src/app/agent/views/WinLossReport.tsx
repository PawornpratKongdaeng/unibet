"use client";
import { useState, useEffect } from "react";

export default function WinLossReport({ agentId }: { agentId: number }) {
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    // สมมติว่ายิง API ไปดึงข้อมูลรายงาน
    const fetchReport = async () => {
      const res = await fetch(`http://localhost:8080/api/v3/reports/winloss?agent_id=${agentId}`);
      const data = await res.json();
      setReport(data);
    };
    if (agentId) fetchReport();
  }, [agentId]);

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-2xl font-black mb-6">📊 รายงานผลได้-เสียของสายงาน</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">ยอดเทิร์นโอเวอร์รวม</p>
          <p className="text-3xl font-black text-white mt-2">฿ 1,240,500.00</p>
        </div>
        <div className="bg-[#1e293b] p-6 rounded-3xl border border-slate-800">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">กำไรที่คาดได้รับ ({report?.share_percent || 80}%)</p>
          <p className="text-3xl font-black text-green-400 mt-2">฿ 45,200.00</p>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-3xl border border-slate-800 p-6 text-center text-slate-500 italic">
        (กราฟสถิติรายวัน จะแสดงผลที่นี่ในขั้นตอนถัดไป)
      </div>
    </div>
  );
}