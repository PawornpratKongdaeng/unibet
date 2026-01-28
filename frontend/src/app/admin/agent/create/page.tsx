"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Lock, Phone, CreditCard, ShieldCheck, 
  Save, XCircle, Eye, EyeOff, UserPlus, PieChart, Percent, KeyRound
} from "lucide-react";
import Swal from "sweetalert2";

// Config API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v3";

// --- Reusable Input Component ---
const FormInput = ({ 
  label, name, type = "text", value, onChange, icon: Icon, placeholder, required = false, 
  isPassword = false, togglePassword, showPassword, className = "" 
}: any) => (
  <div className={`space-y-1.5 ${className}`}>
    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
        <Icon size={18} />
      </div>
      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 transition-all"
      />
      {isPassword && (
        <button
          type="button"
          onClick={togglePassword}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  </div>
);

export default function CreateAgentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: "",
    name: "", // รับชื่อจริงรวมกัน
    phone: "",
    password: "",
    password_confirmation: "",
    share: "",  // ส่วนแบ่งหุ้น (%)
    com: "",    // คอมมิชชั่น (%)
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Password
    if (formData.password !== formData.password_confirmation) {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน',
            confirmButtonColor: "#f43f5e",
            customClass: { popup: "rounded-[2.5rem]" }
        });
        return;
    }

    setIsLoading(true);

    // 2. Logic แยกชื่อ-นามสกุล
    const fullName = formData.name.trim();
    const nameParts = fullName.split(" "); 
    const firstName = nameParts[0] || ""; 
    const lastName = nameParts.slice(1).join(" ") || "";

    // 3. Prepare Payload (Convert types for Go struct)
    const payload = {
      username: formData.username,
      password: formData.password,
      role: 'agent',              // Fix role เป็น agent
      phone: formData.phone,
      first_name: firstName,
      last_name: lastName,
      fullName: fullName,
      share: Number(formData.share) || 0,
      com: Number(formData.com) || 0,
      status: 'active'
    };

    try {
      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create agent");
      }

      await Swal.fire({
        title: "Agent Created!",
        text: `Agent ${formData.username} has been successfully added.`,
        icon: "success",
        confirmButtonColor: "#10b981",
        customClass: { popup: "rounded-[2.5rem]" }
      });

      router.push("/admin/users"); // Redirect ไปหน้ารายชื่อ Agent

    } catch (error: any) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonColor: "#f43f5e",
        customClass: { popup: "rounded-[2.5rem]" }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <ShieldCheck className="text-emerald-600" size={32} />
          Create New <span className="text-emerald-600">Agent</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 ml-11">
          Add a new partner to manage members
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden p-8 md:p-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* --- Section 1: Account Info --- */}
          <div className="md:col-span-2 pb-2 border-b border-slate-50 mb-2">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <User size={16} className="text-emerald-500" /> Account Credentials
            </h3>
          </div>

          <FormInput 
            label="Username" 
            name="username" 
            value={formData.username} 
            onChange={handleChange} 
            icon={User} 
            placeholder="e.g. agent88" 
            required 
          />

           <div className="hidden md:block"></div> {/* Spacer for grid */}

          <FormInput 
            label="Password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            icon={KeyRound} 
            placeholder="Set secure password" 
            required 
            isPassword
            showPassword={showPassword}
            togglePassword={() => setShowPassword(!showPassword)}
          />

          <FormInput 
            label="Confirm Password" 
            name="password_confirmation" 
            value={formData.password_confirmation} 
            onChange={handleChange} 
            icon={Lock} 
            placeholder="Repeat password" 
            required 
            isPassword
            showPassword={showConfirmPassword}
            togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
          />

          {/* --- Section 2: Personal Info --- */}
          <div className="md:col-span-2 pb-2 border-b border-slate-50 mb-2 mt-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <UserPlus size={16} className="text-emerald-500" /> Personal Details
            </h3>
          </div>

          <FormInput 
            label="Real Name" 
            name="name" 
            value={formData.name} 
            onChange={handleChange} 
            icon={UserPlus} 
            placeholder="Agent's Full Name" 
            required 
          />

          <FormInput 
            label="Phone Number" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            icon={Phone} 
            type="tel"
            placeholder="08X-XXX-XXXX" 
            required 
          />

          {/* --- Section 3: Agent Configuration (Credit/Share/Com) --- */}
          <div className="md:col-span-2 pb-2 border-b border-slate-50 mb-2 mt-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" /> Credit & Commission
            </h3>
          </div>

          <FormInput 
            label="Initial Credit (THB)" 
            name="credit" 
            onChange={handleChange} 
            icon={CreditCard} 
            type="number"
            placeholder="0.00" 
          />

           <div className="grid grid-cols-2 gap-4">
             <FormInput 
                label="Share (%)" 
                name="share" 
                value={formData.share} 
                onChange={handleChange} 
                icon={PieChart} 
                type="number"
                placeholder="0" 
              />
             <FormInput 
                label="Commission (%)" 
                name="com" 
                value={formData.com} 
                onChange={handleChange} 
                icon={Percent} 
                type="number"
                placeholder="0" 
              />
           </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 mt-10 pt-6 border-t border-slate-50">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-bold text-xs uppercase tracking-wider hover:bg-slate-100 transition-colors"
          >
            <XCircle size={18} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {isLoading ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={18} />
                Create Agent
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}