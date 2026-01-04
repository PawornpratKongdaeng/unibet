"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Landmark, CreditCard, User, Save, AlertCircle, RefreshCcw } from "lucide-react";

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
      html: `
        <div class="p-6 bg-slate-50 rounded-3xl border border-slate-100 mt-4 text-left">
            <p class="text-[10px] font-black text-emerald-600 uppercase mb-2">Target Account</p>
            <p class="text-3xl font-black text-slate-900 italic tracking-tighter">${form.account_number}</p>
            <p class="text-xs text-slate-500 font-bold uppercase mt-1">${form.account_name} // ${form.bank_name}</p>
        </div>
      `,
      icon: 'question', 
      showCancelButton: true, 
      confirmButtonText: 'CONFIRM UPDATE', 
      confirmButtonColor: '#10b981', // Emerald 600
      cancelButtonText: 'CANCEL',
      background: '#ffffff', 
      color: '#0f172a',
      customClass: {
        confirmButton: '!rounded-2xl !font-black !px-8 !py-4 !text-xs',
        cancelButton: '!rounded-2xl !font-black !px-8 !py-4 !text-xs'
      }
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
            background: '#ffffff',
            color: '#0f172a'
          });
          mutate();
        }
      } catch (err) { 
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#ffffff', color: '#0f172a' }); 
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12">
      
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Landmark size={14} className="text-emerald-600" />
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Infrastructure</p>
          </div>
          <h1 className="text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            Bank <span className="text-emerald-600">Gateway</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold mt-2">จัดการบัญชีธนาคารสำหรับรับยอดฝากอัตโนมัติ</p>
        </div>
        <button onClick={() => mutate()} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-200 transition-all shadow-sm">
            <RefreshCcw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* ✅ Form Section: White Card Style */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-100 p-10 rounded-[3rem] space-y-8 relative overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-emerald-900 pointer-events-none">
                <Landmark size={120}/>
            </div>
            
            <div className="space-y-6 relative z-10">
                <InputGroup 
                  icon={<Landmark size={18}/>} 
                  label="Provider Name" 
                  value={form.bank_name} 
                  placeholder="เช่น KASIKORNBANK, SCB" 
                  onChange={(v: string) => setForm({...form, bank_name: v})} 
                />
                
                <InputGroup 
                  icon={<User size={18}/>} 
                  label="Legal Account Name" 
                  value={form.account_name} 
                  placeholder="ชื่อ-นามสกุล เจ้าของบัญชี" 
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
            </div>

            <button type="submit" className="w-full bg-emerald-600 text-white hover:bg-slate-900 font-black py-6 rounded-2xl transition-all uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg shadow-emerald-100">
               <Save size={18} /> Deploy Configuration
            </button>
          </div>
        </form>

        {/* ✅ Live Preview Section: High Contrast Premium Card */}
        <div className="space-y-8 lg:sticky lg:top-10 px-2">
            <div className="flex items-center gap-3 justify-center">
                <div className="h-[1px] flex-1 bg-slate-200"></div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Live Customer Preview</p>
                <div className="h-[1px] flex-1 bg-slate-200"></div>
            </div>

            <div className="relative group">
                {/* Subtle Glow Behind Card */}
                <div className="absolute -inset-6 bg-emerald-500/5 blur-[60px] rounded-full"></div>
                
                <div className="relative bg-slate-900 border border-slate-800 p-12 rounded-[3.5rem] min-h-[340px] flex flex-col justify-between shadow-2xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                            🏦
                        </div>
                        <div className="text-right">
                            <span className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-500/30">
                                Verified Gateway
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 relative z-10">
                        <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.3em]">Master Deposit Account</p>
                        <p className="text-5xl font-black text-white italic tracking-tighter leading-none break-all">
                          {form.account_number || "000-0-0000-0"}
                        </p>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-white/5 pt-8 relative z-10">
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Beneficiary Name</p>
                            <p className="text-xl font-black text-slate-200 italic uppercase tracking-tight">{form.account_name || "FULL NAME"}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Provider</p>
                             <p className="text-sm font-black text-emerald-400 italic uppercase">{form.bank_name || "BANK"}</p>
                        </div>
                    </div>
                    
                    {/* Decorative Watermark */}
                    <div className="absolute -bottom-10 -right-10 text-white/[0.03] font-black italic text-9xl pointer-events-none select-none uppercase">BANK</div>
                </div>
            </div>
            
            <div className="flex items-start gap-4 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100">
                <AlertCircle size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Security Notice</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">
                        การอัปเดตบัญชีนี้จะมีผลทันทีต่อหน้าแจ้งฝากของลูกค้า โปรดตรวจสอบตัวเลขบัญชีให้ถูกต้องเพื่อป้องกันความผิดพลาดในการโอนเงิน
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- ✅ Input Sub-Component: Clean White Style ---

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
            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 group-focus-within:text-emerald-600 transition-colors">
                {icon} {label}
            </label>
            <input 
                type="text" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition-all font-black italic tracking-tighter shadow-inner placeholder:text-slate-300 ${
                  isNumeric ? 'text-3xl text-emerald-600' : 'text-lg'
                }`}
            />
        </div>
    );
}