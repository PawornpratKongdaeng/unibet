"use client";
import React from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  ArrowDownCircle, RefreshCcw, ImageIcon, User as UserIcon, 
  CheckCircle, XCircle, Info, ShieldCheck
} from "lucide-react";
import { 
  FinanceCard, EmptyState, 
  viewSlip, getFullImageUrl, Toast 
} from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function DepositManagement() {
  // ดึงรายการที่ค้างตรวจสอบ
  const { data: pending, mutate, error, isLoading } = useSWR("/admin/transactions/pending", fetcher);

  // ดักจับว่า pending เป็น Array หรือไม่ ถ้าไม่ใช่ให้เป็นอาเรย์ว่าง
  const list = React.useMemo(() => {
    if (!pending || !Array.isArray(pending)) return [];
    return pending.filter((tx: any) => tx.type === "deposit");
  }, [pending]);

  const handleVerifySlip = async (tx: any) => {
    const result = await Swal.fire({
      title: `<p class="text-lg font-black italic">ยืนยันความถูกต้องของสลิป?</p>`,
      html: `
        <div class="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase">ยอดเงินแจ้งฝาก</span>
            <span class="text-xl font-black text-emerald-600 italic">฿${tx.amount.toLocaleString()}</span>
          </div>
          <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 mt-2">
            <Info size={16} className="text-amber-500 shrink-0" />
            <p class="text-[10px] font-bold text-amber-700 leading-relaxed">
              การกดปุ่มนี้จะเป็นการ <span class="underline">ยืนยันว่าสลิปถูกต้อง</span> เท่านั้น 
              ระบบจะยังไม่เพิ่มเงินให้ลูกค้า คุณต้องไปกด "เติมเงิน" ให้ลูกค้าด้วยตนเอง
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'สลิปถูกต้อง ยืนยันรายการ',
      cancelButtonText: 'ยกเลิก',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/approve-only/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'ยืนยันสลิปสำเร็จ',
            text: 'ตรวจสอบยอดเงินและเติมเงินให้ลูกค้าที่หน้า "จัดการสมาชิก"',
            confirmButtonColor: '#0f172a',
            customClass: { popup: 'rounded-[2.5rem]' }
          });
          mutate();
        } else {
          const err = await res.json();
          Swal.fire('เกิดข้อผิดพลาด', err.error || 'ไม่สามารถทำรายการได้', 'error');
        }
      } catch (error) {
        Swal.fire('System Error', 'การเชื่อมต่อเซิร์ฟเวอร์ล้มเหลว', 'error');
      }
    }
  };

  const handleReject = async (tx: any) => {
    const result = await Swal.fire({
      title: 'ปฏิเสธรายการฝาก?',
      text: "รายการนี้จะถูกยกเลิก",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'ยืนยันการปฏิเสธ'
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/transactions/reject/${tx.id}`, { method: 'POST' });
      if (res.ok) {
        Toast.fire({ icon: 'success', title: 'ปฏิเสธรายการแล้ว' });
        mutate();
      }
    }
  };

  if (error) return <div className="p-10 text-center font-black text-rose-500 uppercase">Error loading data...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex justify-between items-center px-2">
        <div>
          <h1 className="text-4xl font-[1000] italic text-slate-900 uppercase tracking-tighter">
            Deposit <span className="text-emerald-600">Verification</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
            ตรวจสอบความถูกต้องของสลิป <span className="text-emerald-500">(เงินไม่เพิ่มอัตโนมัติ)</span>
          </p>
        </div>
        <button 
          onClick={() => mutate()} 
          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:text-emerald-600 active:scale-90 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
          <span className="text-[10px] font-black uppercase">Sync Data</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceCard title="Waiting for Verification" value={list.reduce((acc:any, curr:any) => acc + curr.amount, 0)} icon={<ArrowDownCircle />} variant="emerald" />
        <FinanceCard title="Pending Requests" value={list.length} icon={<UserIcon />} variant="highlight" unit="รายการ" />
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-6">User Details</th>
                <th className="px-8 py-6 text-center">Amount</th>
                <th className="px-8 py-6 text-center">Slip</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.map((tx: any) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                        <UserIcon size={20}/>
                      </div>
                      <div>
                        <p className="text-slate-900 font-black text-lg tracking-tight italic uppercase">@{tx.User?.username || 'unknown'}</p>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">REF ID: #{tx.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-emerald-600 font-[1000] text-3xl italic tracking-tighter">฿{tx.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => viewSlip(tx.slip_url)} 
                      className="w-14 h-14 rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-emerald-500 transition-all mx-auto bg-slate-50 flex items-center justify-center"
                    >
                      {tx.slip_url ? (
                         <img src={getFullImageUrl(tx.slip_url)!} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={20} className="text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => handleReject(tx)} className="p-3.5 text-slate-300 hover:text-rose-500 transition-all"><XCircle size={24}/></button>
                      <button 
                        onClick={() => handleVerifySlip(tx)} 
                        className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-xl flex items-center gap-2 transition-all active:scale-95"
                      >
                        <ShieldCheck size={16} /> ยืนยันสลิปถูกต้อง
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && list.length === 0 && <EmptyState />}
      </div>
    </div>
  );
}