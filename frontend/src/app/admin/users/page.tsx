"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Loader2, Search, UserPlus } from "lucide-react";
import { UserTableRow } from "@/components/admin/UserTableRow";

const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const { mutate: globalMutate } = useSWRConfig();
  
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  });

  const filteredUsers = useMemo(() => {
    const list = Array.isArray(users) ? users : [];
    if (!search.trim()) return list;
    const term = search.toLowerCase();
    return list.filter((u: any) =>
      u.username?.toLowerCase().includes(term) ||
      (u.name && u.name.toLowerCase().includes(term))
    );
  }, [users, search]);

  // --- 1. จัดการเครดิต ---
  const handleCreditAction = async (user: any, type: "deposit" | "withdraw") => {
    const isDeposit = type === "deposit";
    const themeColor = isDeposit ? "#10b981" : "#f43f5e";

    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left"><p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Credit Operation</p><p class="text-xl font-[1000] text-zinc-800 uppercase italic">${isDeposit ? 'Deposit' : 'Withdraw'}</p></div>`,
      html: `
        <div class="p-2 text-left space-y-4">
          <input id="swal-amount" type="number" class="w-full p-5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-2xl outline-none" placeholder="0.00">
          <input id="swal-note" type="text" class="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none" placeholder="Remark...">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CONFIRM',
      confirmButtonColor: themeColor,
      customClass: { popup: 'rounded-[2.5rem]' },
      preConfirm: () => {
        const amount = (document.getElementById('swal-amount') as HTMLInputElement).value;
        const note = (document.getElementById('swal-note') as HTMLInputElement).value;
        if (!amount || parseFloat(amount) <= 0) return Swal.showValidationMessage('กรุณาระบุจำนวนเงิน');
        return { amount: parseFloat(amount), note };
      }
    });

    if (formValues) {
      const res = await apiFetch(`/admin/users/${user.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ ...formValues, type }),
      });
      if (res.ok) {
        mutate();
        globalMutate("/me");
        Swal.fire({ icon: 'success', title: 'SUCCESS', timer: 1000, showConfirmButton: false });
      }
    }
  };

  // --- 2. แก้ปัญหา 404: จัดการล็อคบัญชี ---
  const handleToggleLock = async (user: any) => {
    const isLocking = user.status !== "locked";
    
    const result = await Swal.fire({
      title: `<span class="italic font-black text-xl uppercase">${isLocking ? 'Lock User?' : 'Unlock User?'}</span>`,
      text: `ยืนยันการเปลี่ยนสถานะของ ${user.username}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isLocking ? '#18181b' : '#10b981',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      try {
        // แก้ไข: ส่งไปที่ /admin/users/${user.id} แทน /status ถ้า API หลักไม่รองรับ sub-path
        const res = await apiFetch(`/admin/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: isLocking ? "locked" : "active" }),
        });

        if (res.ok) {
          mutate();
          Swal.fire({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire("Error", "ไม่สามารถอัปเดตสถานะได้ (404/500)", "error");
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  // --- 3. แก้ไขข้อมูลสมาชิก (Edit) ---
  const handleEditUser = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left"><p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Account Settings</p><p class="text-xl font-[1000] text-zinc-800 uppercase italic">Edit Profile</p></div>`,
      html: `
        <div class="p-2 text-left space-y-4 font-sans">
          <div>
            <label class="text-[10px] font-black text-zinc-400 uppercase ml-1">Full Name</label>
            <input id="edit-name" type="text" class="w-full mt-1 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold" value="${user.name || ''}">
          </div>
          <div>
            <label class="text-[10px] font-black text-zinc-400 uppercase ml-1">Phone Number</label>
            <input id="edit-phone" type="text" class="w-full mt-1 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold" value="${user.phone || ''}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'SAVE CHANGES',
      confirmButtonColor: '#4f46e5',
      customClass: { popup: 'rounded-[2.5rem]' },
      preConfirm: () => {
        return {
          name: (document.getElementById('edit-name') as HTMLInputElement).value,
          phone: (document.getElementById('edit-phone') as HTMLInputElement).value,
        };
      }
    });

    if (formValues) {
      const res = await apiFetch(`/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(formValues),
      });
      if (res.ok) {
        mutate();
        Swal.fire({ icon: 'success', title: 'Saved', timer: 1000, showConfirmButton: false });
      }
    }
  };

  // --- 4. ดูรายละเอียด ---
  const handleDetail = (user: any) => {
    router.push(`/admin/users/${user.id}`);
  };

  // --- 5. ลบผู้ใช้ ---
  const handleDelete = async (user: any) => {
    const result = await Swal.fire({
      title: `<span class="italic font-black text-xl uppercase">Delete User?</span>`,
      text: `ยืนยันการลบ ${user.username} (ไม่สามารถกู้คืนได้)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'DELETE',
      cancelButtonText: 'CANCEL',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          mutate();
          Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire("Error", "ไม่สามารถลบผู้ใช้ได้", "error");
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            Accounts <span className="text-emerald-600">Management</span>
          </h1>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              autoComplete="off"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search size={16} /> Search
          </button>
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-rose-600 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <UserPlus size={16} /> Add New
          </button>
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-600 transition-all shadow-sm whitespace-nowrap"
          >
            Normal Users
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-[1000] text-slate-600 uppercase tracking-widest border-b border-slate-200">
                <th className="p-4 sm:p-6 px-4 sm:px-8">NAME</th>
                <th className="p-4 sm:p-6">USER NAME</th>
                <th className="p-4 sm:p-6 text-right">CURRENT AMOUNT</th>
                <th className="p-4 sm:p-6 text-center">ACTION</th>
                <th className="p-4 sm:p-6 text-right px-4 sm:px-8">PHONE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && !users ? (
                <tr>
                  <td colSpan={5} className="p-16 sm:p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={48} />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                        Loading Members...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 sm:p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">
                        {search ? "No users found" : "No users available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u: any) => (
                  <UserTableRow 
                    key={u.id} 
                    user={u} 
                    onDetail={handleDetail} 
                    onCredit={handleCreditAction} 
                    onToggleLock={handleToggleLock}
                    onEdit={handleEditUser}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}