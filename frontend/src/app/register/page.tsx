"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showToast } from "@/lib/sweetAlert";
import Swal from "sweetalert2";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

// รายชื่อธนาคาร (สามารถเพิ่มได้ตามต้องการ)
const BANK_LIST = [
  { id: "kbank", name: "กสิกรไทย", color: "#138f2d" },
  { id: "scb", name: "ไทยพาณิชย์", color: "#4e2e7f" },
  { id: "bbl", name: "กรุงเทพ", color: "#1e4598" },
  { id: "ktb", name: "กรุงไทย", color: "#00aade" },
  { id: "bay", name: "กรุงศรีฯ", color: "#fec43b" },
  { id: "ttb", name: "ทีทีบี", color: "#004893" },
  { id: "gsb", name: "ออมสิน", color: "#eb198d" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Account, 2: Bank
  const [loading, setLoading] = useState(false);

  // State สำหรับเก็บข้อมูลทั้งหมด
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    bank_name: "",
    bank_account: "",
  });

  // ฟังก์ชันอัปเดตข้อมูลใน State
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ตรวจสอบ Step 1 ก่อนไป Step 2
  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return showToast("error", "รหัสผ่านไม่ตรงกัน");
    }
    if (formData.phone.length < 10) {
      return showToast("error", "กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก");
    }
    setStep(2);
  };

  // ฟังก์ชันสมัครสมาชิก (ส่งข้อมูลไป Backend)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ 1. เพิ่มการดึงค่า API URL จาก env
      const res = await apiFetch("/api/v3/register", {
        method: "POST",
        body: JSON.stringify({
          phone: formData.phone,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          bank_name: formData.bank_name,
          bank_account: formData.bank_account,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ แสดงผลสำเร็จ พร้อม Username ที่ระบบ Gen ให้
        Swal.fire({
          title: '<span style="color: #fff">สมัครสมาชิกสำเร็จ!</span>',
          html: `
            <div style="color: #94a3b8; margin-bottom: 15px;">ชื่อผู้ใช้สำหรับเข้าเล่นของคุณคือ</div>
            <div style="background: #0f172a; padding: 25px; border-radius: 20px; border: 2px solid #eab308; box-shadow: 0 0 20px rgba(234,179,8,0.2);">
              <div style="color: #eab308; font-size: 32px; font-weight: 900; letter-spacing: 2px;">${data.username}</div>
            </div>
            <p style="color: #64748b; font-size: 11px; margin-top: 15px; font-weight: bold; text-transform: uppercase;">* กรุณาจดจำชื่อผู้ใช้เพื่อเข้าสู่ระบบ *</p>
          `,
          background: "#1e293b",
          confirmButtonText: "ไปหน้าเข้าสู่ระบบ",
          confirmButtonColor: "#eab308",
          allowOutsideClick: false,
        }).then(() => {
          router.push("/login");
        });
      } else {
        showToast("error", data.error || "สมัครสมาชิกไม่สำเร็จ");
      }
    } catch (err) {
      showToast("error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-yellow-500/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0f172a]/80 backdrop-blur-2xl border border-slate-800 p-8 sm:p-10 rounded-[3rem] shadow-2xl">
          
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-10">
             <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 1 ? 'bg-yellow-500' : 'bg-slate-800'}`}></div>
             <div className={`h-1.5 w-12 rounded-full transition-all ${step >= 2 ? 'bg-yellow-500' : 'bg-slate-800'}`}></div>
          </div>

          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-yellow-500/20 mb-4 rotate-3">
              <span className="text-black text-2xl font-black">U</span>
            </div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              {step === 1 ? "Create Account" : "Bank Information"}
            </h1>
            <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-[0.2em]">
              {step === 1 ? "Step 01: ข้อมูลความปลอดภัย" : "Step 02: ข้อมูลบัญชีธนาคาร"}
            </p>
          </div>

          {step === 1 ? (
            /* --- STEP 1: ฟอร์มข้อมูลเบื้องต้น --- */
            <form onSubmit={goNext} className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
              <InputGroup 
                label="Phone Number" 
                name="phone" 
                type="tel" 
                placeholder="เบอร์โทรศัพท์ 10 หลัก" 
                value={formData.phone} 
                onChange={handleChange} 
                maxLength={10}
                required 
              />
              <InputGroup 
                label="Password" 
                name="password" 
                type="password" 
                placeholder="รหัสผ่าน" 
                value={formData.password} 
                onChange={handleChange} 
                required 
              />
              <InputGroup 
                label="Confirm Password" 
                name="confirmPassword" 
                type="password" 
                placeholder="ยืนยันรหัสผ่าน" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
              />
              
              <button 
                type="submit"
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl mt-4 shadow-lg transition-all active:scale-95 uppercase tracking-widest"
              >
                Next Step
              </button>
            </form>
          ) : (
            /* --- STEP 2: ฟอร์มธนาคาร --- */
            <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="grid grid-cols-2 gap-4">
                <InputGroup label="First Name" name="first_name" placeholder="ชื่อจริง" value={formData.first_name} onChange={handleChange} required />
                <InputGroup label="Last Name" name="last_name" placeholder="นามสกุล" value={formData.last_name} onChange={handleChange} required />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Bank</label>
                <select
                  name="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 mt-1 text-white outline-none focus:border-yellow-500 transition-all appearance-none"
                >
                  <option value="">เลือกธนาคารของคุณ</option>
                  {BANK_LIST.map((bank) => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <InputGroup 
                label="Account Number" 
                name="bank_account" 
                type="text" 
                placeholder="เลขบัญชีธนาคาร (เฉพาะตัวเลข)" 
                value={formData.bank_account} 
                onChange={handleChange} 
                required 
              />

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl transition-all text-xs uppercase"
                >
                  Back
                </button>
                <button 
                  disabled={loading}
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-xs uppercase"
                >
                  {loading ? "Registering..." : "Finish Registration"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">
              Already have an account? <span className="text-yellow-500">Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Input Component
function InputGroup({ label, ...props }: any) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        {...props}
        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl p-4 mt-1 text-white outline-none focus:border-yellow-500 transition-all focus:ring-4 focus:ring-yellow-500/5 placeholder:text-slate-700 text-sm"
      />
    </div>
  );
}