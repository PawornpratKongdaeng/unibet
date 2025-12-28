"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
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
      html: `
        <div class="text-left bg-zinc-900 p-4 rounded-2xl border border-zinc-800 mt-4">
          <p class="text-zinc-500 text-[10px] font-black uppercase">เลขบัญชีใหม่</p>
          <p class="text-amber-400 text-xl font-black">${form.account_number}</p>
          <p class="text-white text-xs font-bold">${form.account_name} (${form.bank_name})</p>
        </div>
        <p class="text-[10px] text-rose-500 font-black mt-4 uppercase">ข้อมูลนี้จะเปลี่ยนที่หน้าเว็บของลูกค้าทันที</p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'CONFIRM UPDATE',
      confirmButtonColor: '#fbbf24', // Amber 400
      cancelButtonColor: '#27272a',
      background: '#09090b',
      color: '#fff',
      customClass: {
        confirmButton: '!text-black !font-black !rounded-xl px-6',
        cancelButton: '!rounded-xl px-6'
      }
    });

    if (result.isConfirmed) {
      Swal.fire({ 
        title: 'Saving...', 
        didOpen: () => Swal.showLoading(), 
        background: '#09090b', 
        color: '#fff' 
      });

      try {
        const res = await apiFetch("/admin/config/bank", {
          method: "PUT",
          body: JSON.stringify(form),
        });

        if (!res.ok) throw new Error();

        Swal.fire({
          icon: 'success',
          title: 'อัปเดตสำเร็จ!',
          text: 'ลูกค้าจะเห็นบัญชีใหม่นี้ทันที',
          timer: 2000,
          showConfirmButton: false,
          background: '#09090b',
          color: '#fff'
        });
        mutate();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#09090b', color: '#fff' });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Bank <span className="text-amber-400">Settings</span>
          </h1>
          <p className="text-zinc-500 text-sm font-bold uppercase tracking-[0.3em]">
            ตั้งค่าช่องทางการรับโอนเงิน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left Side: Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2.5rem] space-y-5">
            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block tracking-widest">
                Bank Name
              </label>
              <input 
                type="text" 
                value={form.bank_name}
                onChange={(e) => setForm({...form, bank_name: e.target.value})}
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-400 transition-all font-bold text-white"
                placeholder="เช่น กสิกรไทย, ไทยพาณิชย์"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block tracking-widest">
                Account Name
              </label>
              <input 
                type="text" 
                value={form.account_name}
                onChange={(e) => setForm({...form, account_name: e.target.value})}
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl outline-none focus:border-amber-400 transition-all font-bold text-white"
                placeholder="ระบุชื่อ-นามสกุล"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-2 block tracking-widest">
                Account Number
              </label>
              <input 
                type="text" 
                value={form.account_number}
                onChange={(e) => setForm({...form, account_number: e.target.value})}
                className="w-full bg-black border border-zinc-800 p-4 rounded-2xl text-2xl font-black outline-none focus:border-amber-400 transition-all text-amber-400 tracking-tighter"
                placeholder="000-0-00000-0"
                required
              />
            </div>
          </div>

          <button className="w-full bg-amber-400 hover:bg-amber-300 text-black font-black py-5 rounded-[2rem] shadow-xl shadow-amber-400/10 transition-all uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95">
             Update Website Config
          </button>
        </form>

        {/* Right Side: Visual Preview */}
        <div className="space-y-6">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] text-center lg:text-left">
            Customer View Preview
          </p>
          
          {/* Card Preview */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-300 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative bg-zinc-950 border border-zinc-800 p-10 rounded-[2.5rem] min-h-[250px] flex flex-col justify-between overflow-hidden">
                <div className="flex justify-between items-start">
                   <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl">🏦</div>
                   <div className="text-right">
                     <p className="text-[10px] text-zinc-600 font-black uppercase">Service Provider</p>
                     <p className="text-white font-black italic">{form.bank_name || 'BANK NAME'}</p>
                   </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Account Number</p>
                  <p className="text-3xl font-black text-white tracking-tighter leading-none break-all">
                    {form.account_number || '000-0-00000-0'}
                  </p>
                </div>

                <div className="flex justify-between items-end border-t border-zinc-900 pt-6">
                  <div>
                    <p className="text-[10px] text-zinc-600 font-black uppercase">Receiver Name</p>
                    <p className="text-sm font-bold text-zinc-300">{form.account_name || 'FULL NAME'}</p>
                  </div>
                  <div className="bg-amber-400/10 text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase">
                    Active
                  </div>
                </div>
            </div>
          </div>

          <div className="p-6 bg-rose-500/5 border border-rose-500/10 rounded-[2rem]">
            <div className="flex gap-3">
              <span className="text-rose-500">⚠️</span>
              <p className="text-[9px] text-zinc-500 font-bold uppercase leading-relaxed">
                <span className="text-rose-500">Important:</span> โปรดตรวจสอบเลขบัญชีให้ถูกต้องทุกตัวอักษร 
                หากระบุผิดพลาด ลูกค้าจะโอนเงินไม่เข้าและอาจส่งผลต่อความเชื่อมั่นของเว็บไซต์
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}