"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Landmark, CreditCard, User, Save, AlertCircle, RefreshCcw } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

// 1. กำหนด Interface สำหรับ Props ของ InputGroup เพื่อแก้ TypeScript Error
interface InputGroupProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  isNumeric?: boolean;
  onChange: (value: string) => void;
}

export default function AdminBankSettings() {
  const { data: bankData, mutate } = useSWR("/admin/config/bank", fetcher);
  const [form, setForm] = useState({ bank_name: "", account_name: "", account_number: "" });

  useEffect(() => {
    if (bankData && !bankData.error) {
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
      title: 'CONFIRM UPDATE?',
      html: `<p class="text-xs text-slate-500 font-bold uppercase mt-1">${form.account_name} // ${form.bank_name}</p>`,
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonText: 'CONFIRM',
      confirmButtonColor: '#10b981',
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("token");
        const res = await apiFetch("/admin/config/bank", { 
          method: "PUT", 
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(form) 
        });

        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'CONFIG UPDATED', timer: 1500, showConfirmButton: false });
          mutate();
        } else if (res.status === 401) {
          Swal.fire({ icon: 'error', title: 'Unauthorized', text: 'คุณไม่มีสิทธิ์จัดการส่วนนี้ หรือ Session หมดอายุ' });
        } else {
          Swal.fire({ icon: 'error', title: 'Failed', text: 'เกิดข้อผิดพลาดจาก Server' });
        }
      } catch (err) { 
        Swal.fire({ icon: 'error', title: 'Connection Error' }); 
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12 p-4">
      {/* Header */}
      <div className="flex justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            Bank <span className="text-emerald-600">Gateway</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-2">จัดการบัญชีธนาคารสำหรับรับยอดฝาก</p>
        </div>
        <button onClick={() => mutate()} className="p-4 bg-white border border-slate-200 rounded-2xl hover:text-emerald-600 transition-all">
            <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm relative overflow-hidden">
            <div className="space-y-6 relative z-10">
                {/* 2. แก้ไขการส่ง Parameter (v) ให้ระบุ Type เป็น string */}
                <InputGroup 
                  icon={<Landmark size={18}/>} 
                  label="Bank Name" 
                  value={form.bank_name} 
                  placeholder="เช่น KASIKORN" 
                  onChange={(v: string) => setForm({...form, bank_name: v})} 
                />
                <InputGroup 
                  icon={<User size={18}/>} 
                  label="Account Name" 
                  value={form.account_name} 
                  placeholder="ชื่อเจ้าของบัญชี" 
                  onChange={(v: string) => setForm({...form, account_name: v})} 
                />
                <InputGroup 
                  icon={<CreditCard size={18}/>} 
                  label="Account Number" 
                  value={form.account_number} 
                  placeholder="000-0-00000-0" 
                  isNumeric 
                  onChange={(v: string) => setForm({...form, account_number: v})} 
                />
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-6 rounded-2xl mt-8 hover:bg-slate-900 transition-all shadow-lg shadow-emerald-100">
               SAVE CONFIGURATION
            </button>
          </div>
        </form>

        {/* Live Preview */}
        <div className="bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between text-white min-h-[350px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="flex justify-between items-start relative z-10">
             <div className="text-4xl">🏦</div>
             <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30">Active Gateway</div>
          </div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Master Deposit Account</p>
            <p className="text-5xl font-black italic tracking-tighter break-all">
              {form.account_number || "000-0-0000-0"}
            </p>
          </div>
          
          <div className="border-t border-white/5 pt-8 flex justify-between relative z-10">
            <div>
              <p className="text-[9px] text-slate-500 uppercase mb-1">Account Holder</p>
              <p className="text-xl font-black italic">{form.account_name || "FULL NAME"}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 uppercase mb-1">Provider</p>
              <p className="text-sm font-black text-emerald-400 italic">{form.bank_name || "BANK"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. ใช้ Interface ที่สร้างไว้ด้านบนมาคุม Props
function InputGroup({ icon, label, value, placeholder, isNumeric, onChange }: InputGroupProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
        {icon} {label}
      </label>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 outline-none focus:border-emerald-500 transition-all font-black italic ${
          isNumeric ? 'text-3xl text-emerald-600' : 'text-lg'
        }`}
      />
    </div>
  );
}