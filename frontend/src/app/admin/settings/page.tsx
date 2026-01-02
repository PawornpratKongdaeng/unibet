"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { 
  Settings, Globe, ShieldAlert, BadgeDollarSign, 
  MessageSquare, Search, Save, Power, HardHat, Loader2 
} from "lucide-react";
// ✅ ต้อง Import apiFetch มาใช้เพื่อให้ส่ง Token ไปยัง Backend ได้
import { apiFetch } from "@/lib/api"; 

interface SystemSettings {
  site_name: string;
  maintenance_mode: boolean;
  min_bet: number;
  max_bet: number;
  max_payout: number;
  line_id: string;
  telegram_link: string;
  meta_description: string;
  announcement_text: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [form, setForm] = useState<SystemSettings>({
    site_name: "",
    maintenance_mode: false,
    min_bet: 50,
    max_bet: 50000,
    max_payout: 200000,
    line_id: "",
    telegram_link: "",
    meta_description: "",
    announcement_text: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  // 1. ดึงข้อมูลจาก Go Backend (/api/admin/settings)
  const fetchSettings = async () => {
    try {
      setLoading(true);
      // ✅ ใช้ apiFetch เพื่อให้ใส่ Authorization Header อัตโนมัติ
      const response = await apiFetch("/admin/settings"); 
      
      if (!response.ok) {
        throw new Error("ระบบไม่สามารถเข้าถึงข้อมูลตั้งค่าได้");
      }
      
      const data = await response.json();
      setForm(data);
    } catch (error: any) {
      console.error("Fetch Error:", error);
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: error.message || 'ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้',
        background: '#09090b', color: '#fff'
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. บันทึกข้อมูลไปยัง Backend (PUT /api/admin/settings)
  const handleSave = async () => {
    const result = await Swal.fire({
      title: 'CONFIRM CHANGES?',
      text: "การบันทึกจะเปลี่ยนค่าระบบของเว็บไซต์ทันที",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'DEPLOY NOW',
      cancelButtonText: 'CANCEL',
      confirmButtonColor: '#10b981',
      background: '#09090b', color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        setSaving(true);
        // ✅ ใช้ apiFetch และระบุ Method เป็น PUT
        const response = await apiFetch("/admin/settings", {
          method: "PUT",
          body: JSON.stringify(form),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Update failed");
        }

        await Swal.fire({
          icon: 'success',
          title: 'SETTINGS UPDATED',
          text: 'ข้อมูลถูกซิงค์ไปยังฐานข้อมูลเรียบร้อยแล้ว',
          timer: 1500,
          showConfirmButton: false,
          background: '#09090b', color: '#fff'
        });
      } catch (error: any) {
        Swal.fire({ 
          icon: 'error', 
          title: 'Update Failed', 
          text: error.message,
          background: '#09090b', 
          color: '#fff' 
        });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="animate-spin text-amber-500" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Synchronizing Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-white">
            <Settings className={`${saving ? 'animate-spin' : ''} text-amber-400`} /> 
            System <span className="text-zinc-500">Config</span>
          </h1>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1">Real-time Backend Integration</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-white text-black disabled:bg-zinc-800 disabled:text-zinc-500 px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 shadow-xl shadow-white/5 active:scale-95"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
          {saving ? 'Processing...' : 'Deploy Changes'}
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {[
          { id: "general", label: "General", icon: <Globe size={16} /> },
          { id: "betting", label: "Betting Limits", icon: <BadgeDollarSign size={16} /> },
          { id: "social", label: "Support", icon: <MessageSquare size={16} /> },
          { id: "seo", label: "SEO / Google", icon: <Search size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === tab.id 
              ? "bg-zinc-900 border-amber-400 text-amber-400" 
              : "bg-transparent border-zinc-900 text-zinc-600 hover:border-zinc-700"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] space-y-8">
            {activeTab === "general" && (
              <div className="space-y-6">
                <InputGroup label="Website Title" value={form.site_name} onChange={(v: string) => setForm({...form, site_name: v})} />
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Announcement Bar (HTML allowed)</label>
                  <textarea 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-300 text-sm outline-none focus:border-amber-400 transition-all font-mono"
                    rows={4}
                    value={form.announcement_text}
                    onChange={(e) => setForm({...form, announcement_text: e.target.value})}
                  />
                </div>
              </div>
            )}

            {activeTab === "betting" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Min Stake (฿)" type="number" value={form.min_bet} onChange={(v: number) => setForm({...form, min_bet: Number(v)})} />
                <InputGroup label="Max Stake (฿)" type="number" value={form.max_bet} onChange={(v: number) => setForm({...form, max_bet: Number(v)})} />
                <div className="md:col-span-2">
                  <InputGroup label="Max Payout per Ticket (฿)" type="number" value={form.max_payout} onChange={(v: number) => setForm({...form, max_payout: Number(v)})} />
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Official Line ID" value={form.line_id} onChange={(v: string) => setForm({...form, line_id: v})} />
                <InputGroup label="Telegram URL" value={form.telegram_link} onChange={(v: string) => setForm({...form, telegram_link: v})} />
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Search Description (Meta Description)</label>
                  <textarea 
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-zinc-300 text-sm outline-none focus:border-indigo-400 transition-all"
                    rows={4}
                    value={form.meta_description}
                    onChange={(e) => setForm({...form, meta_description: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
          <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${form.maintenance_mode ? 'bg-rose-500/10 border-rose-500/20 shadow-lg shadow-rose-500/5' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
            <div className="flex justify-between items-center mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${form.maintenance_mode ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-black'}`}>
                  {form.maintenance_mode ? <HardHat size={24} /> : <Power size={24} />}
                </div>
                <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${form.maintenance_mode ? 'text-rose-500' : 'text-emerald-500'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${form.maintenance_mode ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {form.maintenance_mode ? 'Maintenance Active' : 'System Live'}
                </div>
            </div>
            <h4 className="text-white font-black uppercase italic tracking-tighter text-xl mb-4">Site Status Control</h4>
            <button 
                onClick={() => setForm({...form, maintenance_mode: !form.maintenance_mode})}
                className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all ${
                    form.maintenance_mode 
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400' 
                    : 'bg-rose-500 text-white hover:bg-rose-600'
                }`}
            >
                {form.maintenance_mode ? 'Wake Up System' : 'Shutdown System'}
            </button>
          </div>

          <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[3rem] space-y-4">
             <div className="flex items-center gap-2 text-zinc-500 mb-2">
                <ShieldAlert size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest">Admin Note</span>
             </div>
             <p className="text-[10px] text-zinc-600 font-bold leading-relaxed uppercase italic">
                การแก้ไขใดๆ จะส่งผลทันทีต่อผู้เข้าใช้งานที่กำลัง Active อยู่ในระบบ โปรดตรวจสอบความถูกต้องก่อนกด Deploy
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-black italic outline-none focus:border-amber-400/50 transition-all"
      />
    </div>
  );
}