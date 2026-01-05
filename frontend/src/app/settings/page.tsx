"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  Languages, 
  ChevronLeft, 
  User, 
  Save, 
  CheckCircle2, 
  Globe,
  Eye,
  EyeOff
} from "lucide-react";

import Header from "@/components/Header";
import { showToast } from "@/lib/sweetAlert";
import { apiFetch } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();
  
  // State สำหรับเปลี่ยนรหัสผ่าน
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);

  // State สำหรับภาษา
  const [language, setLanguage] = useState("TH"); // TH, EN

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('error', 'รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    try {
      const res = await apiFetch("/user/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: passwordForm.oldPassword,
          new_password: passwordForm.newPassword
        }),
      });
      
      if (res.ok) {
        showToast('success', 'เปลี่ยนรหัสผ่านสำเร็จ');
        setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        const error = await res.json();
        showToast('error', error.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      showToast('error', 'เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว');
    }
  };

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans font-bold">
      <Header />

      <div className="max-w-xl mx-auto px-4 pt-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-emerald-400 hover:text-white transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm tracking-widest uppercase">Back</span>
          </button>
          <h1 className="text-xl font-extrabold tracking-tighter uppercase">Settings</h1>
        </div>

        {/* Section 1: Change Language */}
        <div className="bg-[#022c1e] rounded-3xl p-6 mb-6 border border-[#044630] shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Languages className="w-5 h-5 text-[#00b359]" />
            </div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase">Language / ภาษา</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { code: "", label: "Coming soon", flag: "" },
              { code: "EN", label: "English", flag: "🇺🇸" }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-center space-x-3 p-4 rounded-2xl border-2 transition-all ${
                  language === lang.code 
                  ? "border-[#00b359] bg-[#00b359]/10 text-white" 
                  : "border-[#044630] bg-[#013323] text-zinc-500 hover:border-emerald-700"
                }`}
              >
                <span className="text-2xl">{lang.flag}</span>
                <span className="text-xs font-extrabold tracking-widest uppercase">{lang.label}</span>
                {language === lang.code && <CheckCircle2 className="w-4 h-4 text-[#00b359]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Change Password */}
        <div className="bg-[#022c1e] rounded-3xl p-6 border border-[#044630] shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <Lock className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-sm font-black tracking-[0.2em] uppercase">Change Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Old Password */}
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest ml-1 mb-2 block">Current Password</label>
              <div className="relative">
                <input 
                  type={showPass ? "text" : "password"}
                  className="w-full bg-[#013323] border border-[#044630] rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-[#00b359] transition-all placeholder:text-zinc-700"
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-emerald-500"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <hr className="border-[#044630] my-2" />

            {/* New Password */}
            <div>
              <label className="text-[10px] text-emerald-500/70 uppercase tracking-widest ml-1 mb-2 block">New Password</label>
              <input 
                type={showPass ? "text" : "password"}
                className="w-full bg-[#013323] border border-[#044630] rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-[#00b359] transition-all"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-[10px] text-emerald-500/70 uppercase tracking-widest ml-1 mb-2 block">Confirm New Password</label>
              <input 
                type={showPass ? "text" : "password"}
                className="w-full bg-[#013323] border border-[#044630] rounded-xl py-4 px-4 text-sm focus:outline-none focus:border-[#00b359] transition-all"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              className="w-full bg-[#00b359] hover:bg-[#00cc66] text-[#013323] py-4 rounded-xl flex items-center justify-center space-x-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20 mt-6"
            >
              <Save className="w-5 h-5" />
              <span className="font-black tracking-[0.2em] uppercase text-sm">Update Password</span>
            </button>
          </form>
        </div>

        {/* Info Text */}
        <p className="mt-8 text-center text-[9px] text-zinc-600 uppercase tracking-[0.3em] leading-relaxed px-10">
          For security reasons, do not share your password with anyone. 
          The system will log you out after password change.
        </p>
      </div>
    </main>
  );
}