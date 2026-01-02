"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { UserPlus, Shield, PieChart, Wallet, Key, ChevronRight } from "lucide-react";

export default function AddUserPage() {
  const [formData, setFormData] = useState({ 
    username: "", 
    password: "", 
    role: "agent", 
    share: 0, 
    com: 0, 
    credit: 0 
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    Swal.fire({ 
      title: 'CREATING USER...', 
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(), 
      background: '#09090b', 
      color: '#fff' 
    });

    try {
      const res = await apiFetch("/admin/create-user", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData) 
      });

      if (res.ok) {
        Swal.fire({ 
          icon: 'success', 
          title: 'USER CREATED', 
          text: `Identity: ${formData.username} is now active.`, 
          background: '#09090b', 
          color: '#fff',
          confirmButtonColor: '#e11d48' // rose-600
        });
        // ล้างข้อมูลหลังสมัครสำเร็จ (Optional)
        setFormData({ username: "", password: "", role: "agent", share: 0, com: 0, credit: 0 });
      } else {
        throw new Error("Failed to create user");
      }
    } catch (err) { 
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: 'เกิดข้อผิดพลาดในการสร้างยูสเซอร์',
        background: '#09090b',
        color: '#fff'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-in fade-in duration-700 px-6">
      <div className="flex items-center gap-6 mb-12">
        <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] border border-zinc-800 flex items-center justify-center text-rose-500 shadow-2xl">
           <UserPlus size={40} />
        </div>
        <div>
           <h1 className="text-5xl font-black uppercase italic tracking-tighter">New <span className="text-zinc-600">Member</span></h1>
           <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 px-1">ระบบเพิ่มสมาชิกและตัวแทนเข้าสู่เครือข่าย</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Identity Section */}
        <div className="space-y-6 bg-zinc-950 p-10 rounded-[3rem] border border-zinc-900 shadow-xl">
            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
                <Shield size={14} /> Security Identity
            </h3>
            <div className="space-y-6">
                <FormInput 
                  label="Username" 
                  icon={<UserPlus size={16}/>} 
                  value={formData.username}
                  onChange={(v: string) => setFormData({...formData, username: v})} 
                  required 
                />
                <FormInput 
                  label="Secure Password" 
                  icon={<Key size={16}/>} 
                  type="password" 
                  value={formData.password}
                  onChange={(v: string) => setFormData({...formData, password: v})} 
                  required 
                />
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-zinc-600 uppercase px-2">Access Level</label>
                    <div className="relative">
                      <select 
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-black italic outline-none focus:border-rose-500 appearance-none transition-all"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      >
                          <option value="agent">AGENT LEVEL</option>
                          <option value="master">MASTER LEVEL</option>
                          <option value="admin">ADMIN LEVEL</option>
                      </select>
                      <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none text-zinc-500">
                        <ChevronRight size={16} className="rotate-90" />
                      </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right: Financial Section */}
        <div className="space-y-6 bg-zinc-950 p-10 rounded-[3rem] border border-zinc-900 shadow-xl">
            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-4 flex items-center gap-2">
                <PieChart size={14} /> Profit Distribution
            </h3>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                      label="Share (%)" 
                      type="number" 
                      value={formData.share}
                      onChange={(v: string) => setFormData({...formData, share: Number(v)})} 
                    />
                    <FormInput 
                      label="Comm (%)" 
                      type="number" 
                      step="0.01" 
                      value={formData.com}
                      onChange={(v: string) => setFormData({...formData, com: Number(v)})} 
                    />
                </div>
                <FormInput 
                  label="Initial Credit (THB)" 
                  icon={<Wallet size={16}/>} 
                  type="number" 
                  value={formData.credit}
                  onChange={(v: string) => setFormData({...formData, credit: Number(v)})} 
                />
                
                <div className="pt-4">
                    <button 
                      type="submit"
                      className="w-full h-20 bg-white text-black hover:bg-rose-500 hover:text-white font-black rounded-3xl transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 group shadow-lg active:scale-95"
                    >
                        Confirm Provisioning <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
      </form>
    </div>
  );
}

// --- Sub-Component: FormInput ---

interface FormInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  icon?: React.ReactNode;
  onChange?: (value: string) => void;
}

function FormInput({ label, icon, type = "text", onChange, ...props }: FormInputProps) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-600 uppercase px-2 tracking-widest">
              {label}
            </label>
            <div className="relative">
                {icon && (
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center text-zinc-700">
                    {icon}
                  </div>
                )}
                <input 
                    {...props}
                    type={type}
                    onChange={(e) => onChange?.(e.target.value)} 
                    className={`w-full bg-zinc-900 border border-zinc-800 rounded-2xl ${
                      icon ? 'pl-14' : 'px-6'
                    } py-4 text-white font-black italic outline-none focus:border-rose-500 transition-all placeholder:text-zinc-800 shadow-inner`}
                />
            </div>
        </div>
    );
}