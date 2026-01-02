"use client";
import { useState, useRef } from "react";
import useSWR from "swr";
import Header from "@/components/Header";
import { apiFetch } from "@/lib/api";
import { supabase } from "@/lib/supabase"; // <--- เชื่อมต่อ Supabase ตรงนี้
import Swal from "sweetalert2";
import { Copy, Landmark, Upload, CheckCircle2, Wallet, AlertCircle } from "lucide-react";

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

  const showZincAlert = (icon: any, title: string, text?: string) => {
    Swal.fire({
      icon,
      title,
      text,
      background: "#09090b",
      color: "#fff",
      confirmButtonColor: "#10b981", 
      customClass: {
        popup: "rounded-[2rem] border border-zinc-800",
        title: "font-black uppercase italic tracking-tighter",
      }
    });
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(amount) < 100) return showZincAlert('warning', 'ยอดฝากขั้นต่ำ 100 บาท');
    if (!file) return showZincAlert('warning', 'กรุณาแนบสลิปโอนเงิน');

    setLoading(true);
    Swal.fire({
      title: 'UPLOADING SLIP...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
      background: "#09090b",
      color: "#fff",
    });

    try {
      // 1. อัปโหลดรูปไปที่ Supabase Storage (Bucket: slips)
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('slips')
        .upload(fileName, file);

      if (uploadError) throw new Error("Upload failed");

      // 2. ดึง Public URL ของรูปที่อัปโหลดสำเร็จ
      const { data: { publicUrl } } = supabase.storage
        .from('slips')
        .getPublicUrl(fileName);

      // 3. ส่งข้อมูล JSON ไปที่ Backend API ของเรา
      const res = await apiFetch("/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(amount),
          slipUrl: publicUrl, // ส่ง URL รูปไปแทนตัวไฟล์
        }),
      });

      if (!res.ok) throw new Error("API failed");

      showZincAlert('success', 'DEPOSIT SUCCESSFUL', 'เจ้าหน้าที่กำลังตรวจสอบรายการของคุณ');
      setAmount("");
      setFile(null);
      setPreview(null);
    } catch (err) {
      console.error(err);
      showZincAlert('error', 'FAILED', 'เกิดข้อผิดพลาดในการอัปโหลดหรือบันทึกข้อมูล');
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
      background: '#18181b',
      color: '#fff'
    });
    Toast.fire({ icon: 'success', title: 'คัดลอกเลขบัญชีแล้ว' });
  };

  return (
    <main className="min-h-screen bg-black text-white pb-20 font-sans">
      <Header />
      
      <div className="max-w-2xl mx-auto px-6 pt-12 space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 border border-emerald-500/20 mb-2">
            <Wallet size={32} />
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Deposit <span className="text-emerald-500 text-stroke-sm">Funds</span></h1>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">ระบบแจ้งฝากเครดิตอัตโนมัติ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-4">
             <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-2">Transfer Destination</p>
             <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Landmark size={120} />
               </div>
               
               {adminBank ? (
                 <div className="relative z-10 space-y-6">
                   <div className="space-y-1">
                     <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{adminBank.bank_name}</p>
                     <h2 className="text-3xl font-mono font-black tracking-tighter text-white">{adminBank.account_number}</h2>
                     <p className="text-zinc-400 text-xs font-bold uppercase italic">{adminBank.account_name}</p>
                   </div>
                   
                   <button 
                    onClick={() => copyToClipboard(adminBank.account_number)}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-white/5"
                   >
                     <Copy size={14} /> Copy Account
                   </button>
                 </div>
               ) : (
                 <div className="py-10 text-center text-zinc-700 animate-pulse italic text-xs uppercase font-black">Connecting Secure Line...</div>
               )}
             </div>

             <div className="flex items-start gap-3 p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900">
               <AlertCircle className="text-zinc-600 shrink-0" size={18} />
               <p className="text-[10px] text-zinc-500 font-medium leading-relaxed uppercase">กรุณาโอนเงินด้วยบัญชีที่ลงทะเบียนไว้เท่านั้น เพื่อความรวดเร็วในการตรวจสอบ</p>
             </div>
          </div>

          <form onSubmit={handleDeposit} className="space-y-6">
            <div className="space-y-4">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-2">Amount to Deposit</p>
              <div className="relative group">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-emerald-500 font-black text-2xl transition-colors">฿</span>
                <input 
                  type="number" 
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 p-6 pl-14 rounded-[2rem] text-4xl font-black italic tracking-tighter outline-none focus:border-emerald-500/50 transition-all shadow-2xl"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[100, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className="py-3 bg-zinc-900/50 hover:bg-white hover:text-black rounded-xl text-[10px] font-black border border-zinc-800 transition-all uppercase italic shadow-sm"
                  >
                    +{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest ml-2">Upload Transfer Slip</p>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-56 w-full border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${preview ? 'border-emerald-500/50' : 'border-zinc-900 hover:border-zinc-700 bg-zinc-950'}`}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Slip Preview" className="h-full w-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 bg-black/40">
                      <CheckCircle2 className="text-emerald-500" size={32} />
                      <span className="bg-white text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Change Slip</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-600 group-hover:text-emerald-500 group-hover:bg-emerald-500/10 transition-all">
                      <Upload size={20} />
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tap to upload slip</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <button 
              disabled={loading}
              className={`w-full py-6 rounded-[2rem] font-black italic uppercase tracking-[0.2em] text-sm transition-all shadow-2xl active:scale-[0.98] ${
                loading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
              }`}
            >
              {loading ? 'Processing Transaction...' : 'Confirm Deposit'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}