"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import Header from "@/components/Header"; // หรือ AdminHeader ถ้าคุณมี
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminBankSettings() {
  const { data: bankData, mutate } = useSWR("/admin/config/bank", fetcher);
  
  const [form, setForm] = useState({
    bank_name: "",
    account_name: "",
    account_number: ""
  });

  // เมื่อโหลดข้อมูลมาได้ ให้เซ็ตค่าเข้าฟอร์ม
  useEffect(() => {
    if (bankData) {
      setForm({
        bank_name: bankData.bank_name || "",
        account_name: bankData.account_name || "",
        account_number: bankData.account_number || ""
      });
    }
  }, [bankData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await Swal.fire({
      title: 'ยืนยันการเปลี่ยนบัญชี?',
      text: "เลขบัญชีนี้จะไปปรากฏที่หน้าฝากเงินของลูกค้าทุกคนทันที",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#334155',
      confirmButtonText: 'ใช่, อัปเดตเลย!',
      background: '#0f172a',
      color: '#fff'
    });

    if (result.isConfirmed) {
      Swal.fire({ title: 'กำลังบันทึก...', didOpen: () => Swal.showLoading(), background: '#0f172a', color: '#fff' });

      try {
        const res = await apiFetch("/admin/config/bank", {
          method: "PUT",
          body: JSON.stringify(form),
        });

        if (!res.ok) throw new Error();

        Swal.fire({
          icon: 'success',
          title: 'อัปเดตสำเร็จ!',
          text: 'ข้อมูลบัญชีธนาคารหน้าเว็บถูกเปลี่ยนแล้ว',
          background: '#0f172a',
          color: '#fff'
        });
        mutate(); // รีเฟรชข้อมูล
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'ล้มเหลว', text: 'ไม่สามารถอัปเดตข้อมูลได้', background: '#0f172a', color: '#fff' });
      }
    }
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white pb-20">
      <Header />
      <div className="max-w-xl mx-auto px-6 pt-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center text-yellow-500">
             ⚙️
          </div>
          <h1 className="text-3xl font-black italic uppercase">Bank <span className="text-yellow-500">Settings</span></h1>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-10">ตั้งค่าบัญชีธนาคารสำหรับรับโอน (หน้าฝากเงิน)</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
            
            <div className="space-y-5">
              {/* ชื่อธนาคาร */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">ชื่อธนาคาร (เช่น กสิกรไทย, SCB)</label>
                <input 
                  type="text" 
                  value={form.bank_name}
                  onChange={(e) => setForm({...form, bank_name: e.target.value})}
                  className="w-full bg-[#020617] border border-slate-800 p-4 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold"
                  placeholder="ระบุชื่อธนาคาร"
                  required
                />
              </div>

              {/* ชื่อบัญชี */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">ชื่อบัญชีเจ้าของ</label>
                <input 
                  type="text" 
                  value={form.account_name}
                  onChange={(e) => setForm({...form, account_name: e.target.value})}
                  className="w-full bg-[#020617] border border-slate-800 p-4 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold"
                  placeholder="ระบุชื่อ-นามสกุล"
                  required
                />
              </div>

              {/* เลขบัญชี */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 mb-2 block">เลขที่บัญชี</label>
                <input 
                  type="text" 
                  value={form.account_number}
                  onChange={(e) => setForm({...form, account_number: e.target.value})}
                  className="w-full bg-[#020617] border border-slate-800 p-4 rounded-2xl text-xl font-mono outline-none focus:border-yellow-500 transition-all font-black text-yellow-500"
                  placeholder="000-0-00000-0"
                  required
                />
              </div>
            </div>

          </div>

          <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-5 rounded-2xl shadow-lg shadow-yellow-500/10 transition-all uppercase text-sm flex items-center justify-center gap-2">
            บันทึกข้อมูลและอัปเดตหน้าเว็บ
          </button>
        </form>

        <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
           <p className="text-[9px] text-yellow-500/60 font-bold uppercase leading-relaxed text-center">
             คำเตือน: โปรดตรวจสอบเลขบัญชีให้ถูกต้องทุกครั้งก่อนบันทึก <br/>
             หากระบุผิด ลูกค้าจะโอนเงินไปผิดบัญชีและระบบจะไม่รับผิดชอบ
           </p>
        </div>
      </div>
    </main>
  );
}