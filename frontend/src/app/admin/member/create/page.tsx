"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  User, Lock, Phone, Save, XCircle, Eye, EyeOff, UserPlus, Users, KeyRound
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
        className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-300 transition-all"
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

export default function CreateMemberPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    username: "",
    name: "", // รับค่าเป็นชื่อเต็ม แล้วเดี๋ยวไปแยกส่งให้ Backend
    phone: "",
    password: "",
    password_confirmation: "",
    role: "user", // Default Role ตาม Model
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. ตรวจสอบว่า Password ตรงกันหรือไม่
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

    // ✅ Logic แยกชื่อ-นามสกุล (เพื่อให้ตรงกับ Backend struct: FirstName, LastName)
    const fullName = formData.name.trim();
    const nameParts = fullName.split(" "); 
    const firstName = nameParts[0] || ""; 
    const lastName = nameParts.slice(1).join(" ") || ""; // เอาส่วนที่เหลือมาต่อกันเป็นนามสกุล

    // 2. Prepare Payload (Mapping ให้ตรงกับ struct User ของ Go)
    const payload = {
       username: formData.username,
       password: formData.password,
       role: formData.role,        // json:"role"
       phone: formData.phone,      // json:"phone"
       first_name: firstName,      // json:"first_name"
       last_name: lastName,        // json:"last_name"
       fullName: fullName,         // json:"fullName" (ส่งไปด้วยเผื่อ Backend ใช้แสดงผลเลย)
       status: 'active'            // json:"status"
       // parent_id: Backend ควรจะดึงจาก User ที่ Login อยู่ (Context) อัตโนมัติ
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
        // จัดการ Error ที่ Backend อาจส่งมา เช่น "username already exists"
        throw new Error(data.error || data.message || "Something went wrong");
      }

      await Swal.fire({
        title: "Success!",
        text: `สร้างบัญชีผู้ใช้ ${formData.username} สำเร็จ`,
        icon: "success",
        confirmButtonColor: "#10b981",
        customClass: { popup: "rounded-[2.5rem]" }
      });

      router.push("/admin/users"); 

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
    <div className="max-w-3xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
          <Users className="text-emerald-600" size={32} />
          Create New <span className="text-emerald-600">User</span>
        </h1>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 ml-11">
          Creating new normal account
        </p>
      </div>

      {/* Main Form Card */}
      <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden p-8 md:p-10">
        
        <div className="grid grid-cols-1 gap-6">
          
          {/* --- Account Info --- */}
          <div className="pb-2 border-b border-slate-50">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <User size={16} className="text-emerald-500" /> Basic Information
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput 
              label="User Name" 
              name="username" 
              value={formData.username} 
              onChange={handleChange} 
              icon={User} 
              placeholder="e.g. user123" 
              required 
            />

            {/* User กรอกช่องเดียว แต่เราจะ Split ส่งไป backend */}
            <FormInput 
              label="Real Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              icon={UserPlus} 
              placeholder="Firstname Lastname" 
              required 
            />
          </div>

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

          {/* --- Security --- */}
          <div className="pb-2 border-b border-slate-50 mt-4">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Lock size={16} className="text-emerald-500" /> Security
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput 
              label="Password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              icon={KeyRound} 
              placeholder="••••••••" 
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
              placeholder="••••••••" 
              required 
              isPassword
              showPassword={showConfirmPassword}
              togglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
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
                Create Account
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}