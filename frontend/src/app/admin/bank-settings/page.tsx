"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Landmark, CreditCard, User, Save, AlertCircle, ChevronRight } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminBankSettings() {
  const { data: bankData, mutate } = useSWR("/admin/config/bank", fetcher);
  const [form, setForm] = useState({ bank_name: "", account_name: "", account_number: "" });

  useEffect(() => {
    if (bankData) setForm({ 
      bank_name: bankData.bank_name || "", 
      account_name: bankData.account_name || "", 
      account_number: bankData.account_number || "" 
    });
  }, [bankData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await Swal.fire({
      title: 'UPDATE BANK CONFIG?',
      html: `<div class="p-6 bg-zinc-950 rounded-3xl border border-zinc-900 mt-4 text-left">
                <p class="text-[10px] font-black text-amber-500 uppercase mb-2">Target Account</p>
                <p class="text-2xl font-black text-white italic tracking-tighter">${form.account_number}</p>
                <p class="text-xs text-zinc-500 font-bold uppercase">${form.account_name} // ${form.bank_name}</p>
             </div>`,
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'CONFIRM UPDATE', 
      confirmButtonColor: '#f43f5e', 
      background: '#09090b', 
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch("/admin/config/bank", { 
          method: "PUT", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form) 
        });
        if (res.ok) {
          Swal.fire({ 
            icon: 'success', 
            title: 'CONFIG UPDATED', 
            timer: 1500, 
            showConfirmButton: false,
            background: '#09090b',
            color: '#fff'
          });
          mutate();
        }
      } catch (err) { 
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'ไม่สามารถบันทึกข้อมูลได้',
          background: '#09090b',
          color: '#fff'
        }); 
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 px-6 py-10">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter">Bank <span className="text-amber-400 text-stroke-sm">Gateway</span></h1>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-2 px-1">ตั้งค่าบัญชีรับโอนเงินผ่านหน้าเว็บไซต์</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 p-10 rounded-[3.5rem] space-y-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-zinc-500"><Landmark size={80}/></div>
            
            <InputGroup 
              icon={<Landmark size={18}/>} 
              label="Provider Name" 
              value={form.bank_name} 
              placeholder="KASIKORNBANK / SCB" 
              onChange={(v: string) => setForm({...form, bank_name: v})} 
            />
            
            <InputGroup 
              icon={<User size={18}/>} 
              label="Legal Account Name" 
              value={form.account_name} 
              placeholder="MR. ADMIN ACCOUNT" 
              onChange={(v: string) => setForm({...form, account_name: v})} 
            />
            
            <InputGroup 
              icon={<CreditCard size={18}/>} 
              label="Account Serial Number" 
              value={form.account_number} 
              placeholder="000-0-00000-0" 
              isNumeric 
              onChange={(v: string) => setForm({...form, account_number: v})} 
            />

            <button type="submit" className="w-full bg-white text-black hover:bg-amber-400 font-black py-6 rounded-2xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl">
               <Save size={16} /> Deploy Configuration
            </button>
          </div>
        </form>

        {/* Live Preview Section */}
        <div className="space-y-8 lg:sticky lg:top-10">
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.4em] text-center">Live Customer Preview</p>
            <div className="relative group">
                <div className="absolute -inset-4 bg-amber-500/10 blur-[50px] rounded-full group-hover:bg-amber-500/20 transition-all"></div>
                <div className="relative bg-black border border-zinc-800 p-12 rounded-[4rem] min-h-[320px] flex flex-col justify-between shadow-2xl overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-zinc-800">🏦</div>
                        <div className="text-right">
                            <span className="bg-amber-400/10 text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-400/20 shadow-sm">Verified Gateway</span>
                        </div>
                    </div>
                    
                    <div className="space-y-2 relative z-10">
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Master Account</p>
                        <p className="text-4xl font-black text-white italic tracking-tighter leading-none break-all">
                          {form.account_number || "000-0-0000-0"}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-zinc-900 pt-8 relative z-10">
                        <div>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Beneficiary Name</p>
                            <p className="text-lg font-black text-zinc-200 italic uppercase">{form.account_name || "FULL NAME"}</p>
                        </div>
                        <p className="text-xs font-black text-zinc-500 italic uppercase">{form.bank_name || "BANK"}</p>
                    </div>
                    
                    {/* Decorative background text */}
                    <div className="absolute -bottom-10 -right-10 text-white/[0.02] font-black italic text-9xl pointer-events-none select-none">BANK</div>
                </div>
            </div>
            
            <div className="flex items-start gap-4 p-6 bg-rose-500/5 rounded-3xl border border-rose-500/10">
                <AlertCircle size={20} className="text-rose-500 shrink-0" />
                <p className="text-[9px] font-bold text-zinc-500 uppercase leading-relaxed">การเปลี่ยนแปลงข้อมูลนี้จะส่งผลต่อการฝากเงินของลูกค้าทั้งหมด โปรดตรวจสอบความถูกต้องก่อนกดบันทึก</p>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Component with Proper Typing ---

interface InputGroupProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder: string;
  isNumeric?: boolean;
  onChange: (value: string) => void;
}

function InputGroup({ icon, label, value, placeholder, isNumeric, onChange }: InputGroupProps) {
    return (
        <div className="space-y-3 group">
            <label className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 group-focus-within:text-amber-500 transition-colors">
                {icon} {label}
            </label>
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl px-6 py-5 text-white outline-none focus:border-amber-400 focus:bg-zinc-900 transition-all font-black italic tracking-tighter shadow-inner ${
                  isNumeric ? 'text-2xl text-amber-400' : 'text-lg'
                }`}
            />
        </div>
    );
}