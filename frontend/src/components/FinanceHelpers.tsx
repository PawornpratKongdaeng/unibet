import React, { cloneElement } from "react";
import Swal from "sweetalert2";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
  background: '#0f172a',
  color: '#fff'
});

export const getFullImageUrl = (path: string) => path ? (path.startsWith('http') ? path : `${API_BASE_URL}${path}`) : null;

export const viewSlip = (path: string) => {
  const imageUrl = getFullImageUrl(path);
  if (!imageUrl) return Swal.fire({ icon: 'error', title: 'ไม่พบสลิป' });
  Swal.fire({
    title: 'Check Slip',
    imageUrl: imageUrl,
    imageWidth: 400,
    confirmButtonColor: '#0f172a',
    customClass: { popup: 'rounded-[3rem]' }
  });
};

export function FinanceCard({ title, value, icon, variant, unit = "฿" }: any) {
  const styles: any = {
    emerald: "text-emerald-600 bg-white",
    rose: "text-rose-500 bg-white",
    highlight: "text-white bg-slate-900 border-none"
  };
  return (
    <div className={`p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg ${styles[variant]}`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${variant === 'highlight' ? 'bg-white/10' : 'bg-slate-50'}`}>
        {cloneElement(icon, { size: 24 })}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-1">{title}</p>
      <h2 className="text-4xl font-[1000] italic tracking-tighter">{unit === '฿' ? '฿' : ''}{value.toLocaleString()} <span className="text-xs font-bold not-italic">{unit !== '฿' ? unit : ''}</span></h2>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="py-20 text-center">
      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">All systems clear. No pending actions.</p>
    </div>
  );
}