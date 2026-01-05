"use client";
import { useState, useRef } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase"; 
import Swal from "sweetalert2";
import { Copy, Landmark, Upload, CheckCircle2, Wallet, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function DepositPage() {
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: adminBank } = useSWR("/config/bank", fetcher);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const showPremiumAlert = (icon: any, title: string, text?: string) => {
    Swal.fire({
      icon,
      title,
      text,
      background: "#013323",
      color: "#fff",
      confirmButtonColor: "#10b981", 
      customClass: {
        popup: "rounded-[2.5rem] border border-[#044630] shadow-2xl",
        title: "font-[1000] uppercase italic tracking-tighter text-2xl",
        htmlContainer: "font-bold text-emerald-400/70"
      }
    });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < 100) return showPremiumAlert('warning', 'ยอดฝากขั้นต่ำ 100 บาท');
    if (!file) return showPremiumAlert('warning', 'กรุณาแนบสลิปโอนเงิน');

    setLoading(true);
    Swal.fire({
      title: 'PROCESSING...',
      html: 'กำลังส่งข้อมูลไปที่เซิร์ฟเวอร์...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#013323",
      color: "#fff",
    });

    try {
      // 1. เตรียมข้อมูลแบบ FormData (สำคัญมากสำหรับส่งไฟล์)
      const formData = new FormData();
      formData.append("amount", amount); // ส่งยอดเงิน
      formData.append("slip", file);     // ส่งไฟล์รูป (ต้องชื่อ 'slip' ให้ตรงกับที่ Go รอรับ)

      // 2. ยิงไปที่ Backend โดยตรง (ไม่ต้องผ่าน Supabase Storage ที่หน้าบ้านแล้ว)
      const res = await apiFetch("/user/deposit", {
        method: "POST",
        // หมายเหตุ: ห้ามใส่ Content-Type: application/json 
        // เพราะ FormData จะจัดการ Boundary ของมันเองอัตโนมัติ
        body: formData, 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "API failed");
      }

      showPremiumAlert('success', 'DEPOSIT SUCCESSFUL', 'เจ้าหน้าที่กำลังตรวจสอบรายการของคุณ');
      setAmount("");
      setFile(null);
      setPreview(null);
    } catch (err: any) {
      console.error(err);
      showPremiumAlert('error', 'FAILED', err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      background: '#022c1e',
      color: '#10b981'
    });
    Toast.fire({ icon: 'success', title: 'คัดลอกเลขบัญชีสำเร็จ' });
  };

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans selection:bg-emerald-500/30">
      <Header />
      
      <div className="max-w-4xl mx-auto px-6 pt-10 space-y-10">
        
        {/* 🏆 Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-end gap-6 text-center sm:text-left">
          <div className="space-y-2">
            <div className="flex items-center justify-center sm:justify-start gap-2">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Secure Payment</p>
            </div>
            <h1 className="text-4xl sm:text-5xl font-[1000] italic tracking-tighter uppercase leading-none">
              Deposit <span className="text-emerald-500">Funds</span>
            </h1>
          </div>
          <Link href="/" className="group flex items-center gap-2 bg-white text-[#013323] px-6 py-3 rounded-2xl font-[1000] text-[10px] uppercase italic transition-all hover:bg-emerald-400 active:scale-95 shadow-xl">
             <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
             Back to Lobby
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* 🏦 1. Bank Destination (Col 2/5) */}
          <div className="lg:col-span-2 space-y-6">
             <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest ml-2">Destination Account</p>
             <div className="bg-[#022c1e] border border-[#044630] p-8 rounded-[3rem] relative overflow-hidden group shadow-2xl">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:rotate-12 duration-700">
                  <Landmark size={140} />
               </div>
               
               {adminBank ? (
                 <div className="relative z-10 space-y-8">
                   <div className="space-y-2">
                     <p className="inline-block bg-emerald-500 text-[#013323] px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter mb-2">{adminBank.bank_name}</p>
                     <h2 className="text-3xl sm:text-4xl font-mono font-[1000] tracking-tighter text-white leading-none">
                        {adminBank.account_number}
                     </h2>
                     <p className="text-emerald-400/60 text-xs font-black uppercase italic tracking-wide">{adminBank.account_name}</p>
                   </div>
                   
                   <button 
                    onClick={() => copyToClipboard(adminBank.account_number)}
                    className="w-full flex items-center justify-center gap-2 bg-white text-[#013323] py-4 rounded-2xl text-[10px] font-[1000] uppercase italic tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-xl"
                   >
                     <Copy size={14} /> Copy Account Number
                   </button>
                 </div>
               ) : (
                 <div className="py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-emerald-400/30 text-[10px] font-black uppercase italic tracking-widest">Securing Line...</p>
                 </div>
               )}
             </div>

             <div className="flex items-start gap-4 p-5 bg-[#022c1e]/50 rounded-[2rem] border border-[#044630]">
               <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shrink-0">
                  <AlertCircle size={20} />
               </div>
               <p className="text-[10px] text-emerald-400/70 font-bold leading-relaxed uppercase">
                กรุณาโอนเงินด้วยบัญชีที่ลงทะเบียนไว้เท่านั้น ระบบอัตโนมัติจะเติมเครดิตให้ภายใน 1-3 นาที
               </p>
             </div>
          </div>

          {/* 📝 2. Deposit Form (Col 3/5) */}
          <form onSubmit={handleDeposit} className="lg:col-span-3 space-y-8">
            <div className="space-y-4">
              <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest ml-2">Deposit Amount</p>
              <div className="relative group">
                <span className="absolute left-8 top-1/2 -translate-y-1/2 text-emerald-500/30 group-focus-within:text-emerald-400 font-[1000] text-3xl transition-colors italic">฿</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#022c1e] border border-[#044630] p-8 pl-16 rounded-[2.5rem] text-5xl font-[1000] italic tracking-tighter outline-none focus:border-emerald-500/50 transition-all shadow-2xl text-white placeholder:text-emerald-950"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[100, 500, 1000, 5000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="py-4 bg-[#022c1e] hover:bg-emerald-500 hover:text-[#013323] rounded-2xl text-[10px] font-black border border-[#044630] transition-all uppercase italic shadow-lg active:scale-95"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-emerald-400/50 text-[10px] font-black uppercase tracking-widest ml-2">Transfer Slip Verification</p>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-64 w-full border-2 border-dashed rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${preview ? 'border-emerald-500/50 bg-[#022c1e]' : 'border-[#044630] hover:border-emerald-500/30 bg-[#022c1e]'}`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Slip Preview" className="h-full w-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 bg-[#013323]/60 backdrop-blur-sm">
                      <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                        <CheckCircle2 className="text-[#013323]" size={32} />
                      </div>
                      <span className="bg-white text-[#013323] px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl">Change Transfer Slip</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-16 h-16 bg-[#013323] rounded-[1.5rem] flex items-center justify-center text-emerald-500 border border-[#044630] group-hover:scale-110 group-hover:border-emerald-500 transition-all duration-300">
                      <Upload size={28} />
                    </div>
                    <div className="text-center">
                        <p className="text-[11px] font-[1000] text-white uppercase tracking-widest mb-1 italic">Click to Upload Slip</p>
                        <p className="text-[9px] font-bold text-emerald-400/30 uppercase tracking-[0.2em]">JPG, PNG or PDF (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <button 
              disabled={loading}
              className={`w-full py-8 rounded-[2.5rem] font-[1000] italic uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3 ${
                loading 
                ? 'bg-[#044630] text-emerald-800 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-[#013323] shadow-emerald-500/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-[#013323] border-t-transparent rounded-full"></div>
                  Processing Transaction...
                </>
              ) : (
                <>
                  <Wallet size={18} /> Confirm Deposit
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}