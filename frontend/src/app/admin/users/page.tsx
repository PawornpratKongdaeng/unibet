"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  UserPlus,
  Search,
  Ban,
  Wallet,
  Loader2,
  Phone,
  Trash2,
  Eye,
} from "lucide-react";

const fetcher = (url: string) =>
  apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // ✅ 1. ดูรายละเอียดและประวัติ (Responsive Modal)
  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await apiFetch(`/admin/users/${user.id}/transactions`);
      const transactions = await res.json();

      const txHtml = transactions.length > 0 
        ? `
          <div style="max-height: 350px; overflow-x: auto; -webkit-overflow-scrolling: touch; margin-top: 15px; border: 1px solid #eee; border-radius: 16px;">
            <table style="width: 100%; min-width: 480px; font-size: 11px; border-collapse: collapse; text-align: left;">
              <thead style="background: #f8f9fa; position: sticky; top: 0; z-index: 10;">
                <tr>
                  <th style="padding: 12px; color: #666; font-weight: 800;">วันที่ / เวลา</th>
                  <th style="padding: 12px; color: #666; font-weight: 800;">ประเภท</th>
                  <th style="padding: 12px; color: #666; font-weight: 800; text-align: right;">จำนวน</th>
                  <th style="padding: 12px; color: #666; font-weight: 800; text-align: center;">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                ${transactions.map((tx: any) => {
                  const dateObj = new Date(tx.created_at);
                  const d = dateObj.toLocaleDateString('th-TH');
                  const t = dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

                  return `
                  <tr style="border-bottom: 1px solid #f8f8f8;">
                    <td style="padding: 12px 10px;">
                      <div style="font-weight: 700;">${d}</div>
                      <div style="font-size: 10px; color: #999;">${t} น.</div>
                    </td>
                    <td style="padding: 12px 10px;">
                      <span style="color: ${tx.type === 'deposit' ? '#127447' : '#be123c'}; font-weight: 900;">
                        ${tx.type.toUpperCase()}
                      </span>
                    </td>
                    <td style="padding: 12px 10px; text-align: right; font-weight: 900;">
                      ฿${Number(tx.amount).toLocaleString()}
                    </td>
                    <td style="padding: 12px 10px; text-align: center;">
                      <span style="font-size: 9px; padding: 4px 8px; border-radius: 20px; font-weight: 800; 
                        background: ${tx.status === 'approved' ? '#dcfce7' : '#fee2e2'}; 
                        color: ${tx.status === 'approved' ? '#166534' : '#991b1b'};">
                        ${tx.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
        `
        : `<div style="padding: 30px; text-align: center; color: #999;">ไม่พบประวัติการทำรายการ</div>`;

      Swal.fire({
        title: `<span style="color: #127447; font-weight: 900; font-size: 18px;">MEMBER PROFILE</span>`,
        width: '95%',
        padding: '1.25rem',
        customClass: { 
          popup: 'rounded-[2.5rem]',
          confirmButton: 'rounded-2xl px-8 py-4 font-black text-xs uppercase tracking-widest shadow-lg shadow-[#127447]/20'
        },
        html: `
          <div style="text-align: left; font-family: sans-serif;">
            <div style="background: #f0fdf4; padding: 15px; border-radius: 20px; margin-bottom: 15px; border: 1px dashed #127447;">
               <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                 <span style="color: #666; font-size: 12px;">Username:</span>
                 <span style="font-weight: 900;">${user.username}</span>
               </div>
               <div style="display: flex; justify-content: space-between;">
                 <span style="color: #127447; font-weight: 900;">CREDIT:</span>
                 <span style="color: #127447; font-weight: 900; font-size: 18px;">฿${Number(user.credit || 0).toLocaleString()}</span>
               </div>
            </div>
            <h4 style="font-weight: 900; font-size: 11px; color: #aaa; text-transform: uppercase; margin-bottom: 10px;">Transaction History</h4>
            ${txHtml}
          </div>
        `,
        confirmButtonText: "CLOSE WINDOW",
        confirmButtonColor: "#127447",
      });
    } catch (err) {
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลได้", "error");
    }
  };

  // ✅ 2. ปรับยอดเงิน
  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: 'ADJUST CREDIT',
      input: "number",
      inputLabel: `Username: ${user.username}`,
      showCancelButton: true,
      confirmButtonColor: "#127447",
      customClass: { popup: 'rounded-[2rem]', input: 'rounded-xl' }
    });
    if (amount) {
      const res = await apiFetch(`/admin/users/${user.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (res.ok) {
        Swal.fire({ icon: 'success', title: 'ปรับยอดสำเร็จ', timer: 1500, showConfirmButton: false });
        mutate();
      }
    }
  };

  // ✅ 3. ลบสมาชิก
  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `คุณต้องการลบผู้ใช้ ${user.username} หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#be123c',
      customClass: { popup: 'rounded-[2rem]' }
    });
    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
      if (res.ok) {
        mutate();
        Swal.fire('Deleted!', 'ลบเรียบร้อย', 'success');
      }
    }
  };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  ) || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-10">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-[#127447] uppercase leading-none">
            User Management
          </h1>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.4em] mt-3">
            Control member privileges & accounts
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
            <input
              type="text"
              placeholder="ค้นหา..."
              className="bg-white border-none shadow-sm rounded-2xl pl-14 pr-6 py-4 text-sm font-bold w-full outline-none focus:ring-2 focus:ring-[#127447]/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="w-full md:w-auto bg-[#127447] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-[#127447]/20 active:scale-95 transition-all">
            <UserPlus size={18} />
            Create User
          </button>
        </div>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <div className="flex justify-center py-40">
            <Loader2 className="animate-spin text-[#127447]" size={40} />
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.id} className="bg-white rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 shadow-sm border border-zinc-100 flex flex-col lg:flex-row lg:items-center group gap-6">
              
              <div className="flex flex-1 items-center gap-5">
                <div className="w-16 h-16 rounded-[1.8rem] bg-[#f0fdf4] flex items-center justify-center text-[#127447] font-black text-2xl group-hover:bg-[#127447] group-hover:text-white transition-all shadow-sm">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                    {user.username}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[#127447]">
                    <Phone size={12} strokeWidth={3} />
                    <span className="text-xs font-black">{user.phone || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:flex gap-6 border-y lg:border-none py-4 lg:py-0 border-zinc-50">
                <div>
                  <p className="text-[10px] font-black text-zinc-300 uppercase mb-1">Credit</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-black text-[#127447]">฿{Number(user.credit || 0).toLocaleString()}</p>
                    <button onClick={() => handleCredit(user)} className="p-1.5 bg-zinc-50 text-zinc-400 hover:text-[#127447] rounded-lg">
                      <Wallet size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-300 uppercase mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-xs font-black text-slate-700 uppercase">{user.status || "active"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 lg:flex items-center gap-2">
                <button 
                  onClick={() => handleViewDetails(user)}
                  className="flex flex-col lg:flex-row items-center justify-center gap-2 p-4 rounded-2xl bg-[#f0fdf4] text-[#127447] hover:bg-[#127447] hover:text-white transition-all shadow-sm"
                >
                  <Eye size={20} />
                  <span className="text-[9px] font-black uppercase lg:hidden">View</span>
                </button>
                
                <button 
                  onClick={() => handleDeleteUser(user)}
                  className="flex flex-col lg:flex-row items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                >
                  <Trash2 size={20} />
                  <span className="text-[9px] font-black uppercase lg:hidden">Delete</span>
                </button>

                <button className="flex flex-col lg:flex-row items-center justify-center gap-2 p-4 rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-black hover:text-white transition-all shadow-sm">
                  <Ban size={20} />
                  <span className="text-[9px] font-black uppercase lg:hidden">Ban</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}