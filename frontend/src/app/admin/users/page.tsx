"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const fetcher = (url: string) =>
  apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // ✅ ฟังก์ชันสร้างสมาชิกใหม่ (แบบพิมพ์ Username เอง)
  const handleCreateUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: `<span style="color: #127447; font-weight: 900;">CREATE NEW MEMBER</span>`,
      background: "#fff",
      html: `
      <div style="text-align: left; font-family: sans-serif; padding: 0 10px;">
        <label style="font-size: 11px; font-weight: 900; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase;">Username (ชื่อผู้ใช้)</label>
        <input id="swal-input1" class="swal2-input" placeholder="ระบุไอดีผู้ใช้" style="margin: 0 0 15px 0; width: 100%; border-radius: 12px; font-size: 14px; font-weight: bold; border: 1px solid #ddd;">
        
        <label style="font-size: 11px; font-weight: 900; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase;">Full Name (ชื่อ-นามสกุล)</label>
        <input id="swal-input2" class="swal2-input" placeholder="ระบุชื่อจริง-นามสกุล" style="margin: 0 0 15px 0; width: 100%; border-radius: 12px; font-size: 14px;">
        
        <label style="font-size: 11px; font-weight: 900; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase;">Phone Number (เบอร์โทร)</label>
        <input id="swal-input4" class="swal2-input" placeholder="08XXXXXXXX" style="margin: 0 0 15px 0; width: 100%; border-radius: 12px; font-size: 14px;">

        <label style="font-size: 11px; font-weight: 900; color: #666; display: block; margin-bottom: 5px; text-transform: uppercase;">Password</label>
        <input id="swal-input3" class="swal2-input" type="text" placeholder="กำหนดรหัสผ่าน" style="margin: 0; width: 100%; border-radius: 12px; font-size: 14px;">
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: "CREATE USER",
      confirmButtonColor: "#127447",
      preConfirm: () => {
        const username = (document.getElementById("swal-input1") as HTMLInputElement).value;
        const fullName = (document.getElementById("swal-input2") as HTMLInputElement).value;
        const phone = (document.getElementById("swal-input4") as HTMLInputElement).value;
        const password = (document.getElementById("swal-input3") as HTMLInputElement).value;

        if (!username || !fullName || !phone || !password) {
          Swal.showValidationMessage("กรุณากรอกข้อมูลให้ครบทุกช่อง");
          return false;
        }

        return { username, fullName, phone, password };
      },
    });

    if (formValues) {
      try {
        const res = await apiFetch("/api/v3/register", {
          method: "POST",
          body: JSON.stringify(formValues),
        });

        const result = await res.json();

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "สำเร็จ!",
            text: `สร้างสมาชิก ${result.username} เรียบร้อย`,
            confirmButtonColor: "#127447",
          });
          mutate(); 
        } else {
          Swal.fire("ผิดพลาด", result.error || "สมัครไม่สำเร็จ", "error");
        }
      } catch (err) {
        Swal.fire("Error", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
      }
    }
  };

  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: `ADJUST CREDIT`,
      input: "number",
      confirmButtonColor: "#127447",
      showCancelButton: true,
    });
    if (amount) {
      const res = await apiFetch(`/admin/users/${user.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (res.ok) mutate();
    }
  };

  const handleDeleteUser = async (user: any) => {
    const result = await Swal.fire({
      title: `<span style="color: #be123c; font-weight: 900;">DELETE USER?</span>`,
      html: `คุณแน่ใจหรือไม่ที่จะลบสมาชิก <b>${user.username}</b>?<br><span style="color: #ef4444; font-size: 12px;">*การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#be123c",
      cancelButtonColor: "#71717a",
      confirmButtonText: "YES, DELETE IT",
      cancelButtonText: "CANCEL",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({ title: "Deleting...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
        const res = await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });

        if (res.ok) {
          Swal.fire({ icon: "success", title: "DELETED!", text: "ลบสมาชิกเรียบร้อยแล้ว", confirmButtonColor: "#127447", timer: 1500 });
          mutate();
        } else {
          const errorData = await res.json();
          Swal.fire("ผิดพลาด", errorData.error || "ไม่สามารถลบได้", "error");
        }
      } catch (err) {
        Swal.fire("Error", "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
      }
    }
  };

  const filteredUsers =
    users?.filter(
      (u: any) =>
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.phone?.includes(search)
    ) || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-[#127447] uppercase">User Management</h1>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-1">Control member privileges & accounts</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
            <input
              type="text"
              placeholder="Search by username or phone..."
              className="bg-white border border-zinc-100 shadow-sm rounded-2xl pl-12 pr-6 py-4 text-sm font-medium w-full md:w-80 focus:ring-2 focus:ring-[#127447]/10 outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreateUser}
            className="bg-[#127447] hover:bg-[#0e5a36] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-[#127447]/20 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            Create User
          </button>
        </div>
      </div>

      {/* User List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center py-32 gap-4">
            <Loader2 className="animate-spin text-[#127447]" size={48} />
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: any) => (
            <div key={user.id} className="bg-white rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-zinc-100 flex flex-col lg:flex-row lg:items-center hover:shadow-md transition-all group">
              {/* Profile */}
              <div className="flex-1 flex items-center gap-6 mb-4 lg:mb-0">
                <div className="w-16 h-16 rounded-[1.5rem] bg-[#f0fdf4] flex items-center justify-center text-[#127447] font-black text-2xl group-hover:bg-[#127447] group-hover:text-white transition-colors">
                  {user.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{user.username}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{user.fullName || "No Name"}</p>
                    <div className="flex items-center gap-1.5 text-[#127447]">
                      <Phone size={10} strokeWidth={3} />
                      <span className="text-[11px] font-black tracking-tighter">{user.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit */}
              <div className="w-full lg:w-48 mb-4 lg:mb-0">
                <p className="text-[10px] font-black text-zinc-400 uppercase mb-1">Available Credit</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-black text-[#127447]">฿{Number(user.credit || 0).toLocaleString()}</p>
                  <button onClick={() => handleCredit(user)} className="p-1.5 bg-zinc-50 text-zinc-400 hover:text-[#127447] rounded-lg">
                    <Wallet size={14} />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="w-full lg:w-48 mb-6 lg:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${user.status === "active" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}></div>
                  <span className="text-[10px] font-black text-slate-700 uppercase">{user.status || "active"}</span>
                </div>
                <p className="text-[9px] font-medium text-zinc-400 uppercase">Last: {user.last_login ? new Date(user.last_login).toLocaleDateString() : "New Account"}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => handleDeleteUser(user)} className="p-4 rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-rose-100 hover:text-rose-600 transition-all shadow-sm">
                  <Trash2 size={20} />
                </button>
                <button className="p-4 rounded-2xl bg-zinc-50 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all">
                  <Ban size={20} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] py-32 text-center border border-dashed border-zinc-200">
            <p className="text-zinc-300 font-black italic text-xl uppercase">No matching users found</p>
          </div>
        )}
      </div>
    </div>
  );
}