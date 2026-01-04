"use client";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { 
  Settings, Globe, ShieldAlert, BadgeDollarSign, 
  MessageSquare, Search, Save, Power, HardHat, Loader2, RefreshCw 
} from "lucide-react";
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

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/admin/settings"); 
      if (!response.ok) throw new Error("ระบบไม่สามารถเข้าถึงข้อมูลตั้งค่าได้");
      const data = await response.json();
      setForm(data);
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: error.message,
        background: '#ffffff', color: '#0f172a'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const result = await Swal.fire({
      title: 'CONFIRM CHANGES?',
      text: "การบันทึกจะเปลี่ยนค่าระบบของเว็บไซต์ทันที",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'DEPLOY NOW',
      confirmButtonColor: '#10b981', // Emerald 600
      background: '#ffffff', color: '#0f172a',
      customClass: {
        confirmButton: '!rounded-2xl !font-black !px-8 !py-4 !text-xs',
        cancelButton: '!rounded-2xl !font-black !px-8 !py-4 !text-xs'
      }
    });

    if (result.isConfirmed) {
      try {
        setSaving(true);
        const response = await apiFetch("/admin/settings", {
          method: "PUT",
          body: JSON.stringify(form),
        });
        if (!response.ok) throw new Error("Update failed");

        await Swal.fire({
          icon: 'success',
          title: 'SETTINGS UPDATED',
          timer: 1500,
          showConfirmButton: false,
          background: '#ffffff', color: '#0f172a'
        });
      } catch (error: any) {
        Swal.fire({ icon: 'error', title: 'Update Failed', background: '#ffffff', color: '#0f172a' });
      } finally {
        setSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synchronizing Config...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700 pb-12">
      
      {/* ✅ 1. Header Area: Clean & High Contrast */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-10 px-2">
        <div>
          <div className="flex items-center gap-2 mb-2 text-emerald-600">
             <Settings size={14} className={saving ? 'animate-spin' : ''} />
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">Global Parameters</p>
          </div>
          <h1 className="text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            System <span className="text-emerald-600">Console</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-wide">จัดการโครงสร้างพื้นฐานและข้อกำหนดของเว็บไซต์</p>
        </div>
        <div className="flex gap-3">
            <button onClick={fetchSettings} className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all">
               <RefreshCw size={20} />
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-slate-900 text-white disabled:bg-slate-200 px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-600 transition-all flex items-center gap-3 shadow-xl active:scale-95"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {saving ? 'Processing...' : 'Deploy Changes'}
            </button>
        </div>
      </div>

      {/* ✅ 2. Tab Navigation: Minimalist Style */}
      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
        {[
          { id: "general", label: "General", icon: <Globe size={16} /> },
          { id: "betting", label: "Betting Limits", icon: <BadgeDollarSign size={16} /> },
          { id: "social", label: "Support & Social", icon: <MessageSquare size={16} /> },
          { id: "seo", label: "SEO Config", icon: <Search size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-2 ${
              activeTab === tab.id 
              ? "bg-emerald-50 border-emerald-600 text-emerald-700 shadow-sm" 
              : "bg-white border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        
        {/* ✅ 3. Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 p-10 rounded-[3rem] shadow-sm">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                <InputGroup label="Website Display Name" value={form.site_name} onChange={(v: string) => setForm({...form, site_name: v})} />
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Announcement Bar (Supports HTML)</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-slate-700 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all font-mono shadow-inner min-h-[160px]"
                    value={form.announcement_text}
                    onChange={(e) => setForm({...form, announcement_text: e.target.value})}
                  />
                </div>
              </div>
            )}

            {activeTab === "betting" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4">
                <InputGroup label="Min Stake (฿)" type="number" value={form.min_bet} onChange={(v: number) => setForm({...form, min_bet: Number(v)})} isNumeric />
                <InputGroup label="Max Stake (฿)" type="number" value={form.max_bet} onChange={(v: number) => setForm({...form, max_bet: Number(v)})} isNumeric />
                <div className="md:col-span-2 pt-4">
                  <InputGroup label="Maximum Payout per Ticket (฿)" type="number" value={form.max_payout} onChange={(v: number) => setForm({...form, max_payout: Number(v)})} isNumeric highlight />
                </div>
              </div>
            )}

            {activeTab === "social" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-left-4">
                <InputGroup icon={<MessageSquare size={14}/>} label="Official Line ID" value={form.line_id} onChange={(v: string) => setForm({...form, line_id: v})} />
                <InputGroup icon={<Globe size={14}/>} label="Telegram URL" value={form.telegram_link} onChange={(v: string) => setForm({...form, telegram_link: v})} />
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Google Meta Description (SEO)</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[2rem] p-6 text-slate-600 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner min-h-[140px]"
                    value={form.meta_description}
                    onChange={(e) => setForm({...form, meta_description: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ 4. Sidebar: Status & Security Controls */}
        <div className="space-y-8 px-2">
          {/* Site Status Card */}
          <div className={`p-10 rounded-[3rem] border transition-all duration-500 ${
              form.maintenance_mode 
              ? 'bg-rose-50 border-rose-100 shadow-lg shadow-rose-100/50' 
              : 'bg-emerald-50 border-emerald-100 shadow-lg shadow-emerald-100/50'
          }`}>
            <div className="flex justify-between items-center mb-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                    form.maintenance_mode ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {form.maintenance_mode ? <HardHat size={28} /> : <Power size={28} />}
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                    form.maintenance_mode ? 'bg-rose-100/50 border-rose-200 text-rose-600' : 'bg-emerald-100/50 border-emerald-200 text-emerald-600'
                }`}>
                  {form.maintenance_mode ? 'Maintenance' : 'System Live'}
                </div>
            </div>
            <h4 className="text-slate-900 font-[1000] uppercase italic tracking-tighter text-2xl mb-2">Service Status</h4>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wide mb-8">เปิด/ปิด การเข้าใช้งานเว็บไซต์ทั้งหมด</p>
            
            <button 
                onClick={() => setForm({...form, maintenance_mode: !form.maintenance_mode})}
                className={`w-full py-5 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-md active:scale-95 ${
                    form.maintenance_mode 
                    ? 'bg-emerald-600 text-white hover:bg-slate-900 shadow-emerald-200' 
                    : 'bg-rose-600 text-white hover:bg-slate-900 shadow-rose-200'
                }`}
            >
                {form.maintenance_mode ? 'Wake Up System' : 'Shutdown System'}
            </button>
          </div>

          {/* Admin Security Note */}
          <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] space-y-4 shadow-sm">
             <div className="flex items-center gap-2 text-slate-400 mb-2">
                <ShieldAlert size={16} className="text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest">Administrator Note</span>
             </div>
             <p className="text-[11px] text-slate-500 font-bold leading-relaxed uppercase italic">
                ระวัง: การบันทึกค่าในหน้านี้จะรีเซ็ตการเชื่อมต่อของเซสชันผู้เล่นปัจจุบันทั้งหมดเพื่อบังคับใช้ค่าคอนฟิกใหม่
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- ✅ Sub-Component: Clean Input Group ---

function InputGroup({ label, value, onChange, type = "text", isNumeric = false, highlight = false, icon }: any) {
  return (
    <div className="space-y-3 group">
      <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 group-focus-within:text-emerald-600 transition-colors">
        {icon} {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-8 py-5 outline-none focus:bg-white focus:border-emerald-500 transition-all font-[1000] italic tracking-tight shadow-inner ${
          highlight ? 'text-emerald-600 border-emerald-100 text-2xl bg-emerald-50/30' : 'text-slate-800 text-lg'
        } ${isNumeric ? 'tracking-tighter' : ''}`}
      />
    </div>
  );
}