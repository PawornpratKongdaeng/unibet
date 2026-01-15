"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR, { useSWRConfig } from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Loader2, Search, UserPlus, Shield, Users, UserCog } from "lucide-react"; // เพิ่ม Icon
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

  // --- 1. เพิ่ม User ใหม่ (UI Upgrade + Role Selection) ---
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left px-2">
                <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Management</p>
                <p class="text-2xl font-[1000] text-zinc-800 uppercase italic tracking-tighter">Create Account</p>
              </div>`,
      html: `
        <div class="px-2 text-left space-y-4 font-sans mt-2">
          
          <div class="bg-zinc-50 p-3 rounded-2xl border border-zinc-100 space-y-3">
             <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-black text-zinc-400 uppercase tracking-wider">Login Access</span>
                <div class="h-px bg-zinc-200 flex-1"></div>
             </div>
             
             <div class="grid grid-cols-2 gap-3">
               <div>
                 <label class="text-[10px] font-bold text-zinc-500 uppercase ml-1">Username <span class="text-rose-500">*</span></label>
                 <input id="add-username" type="text" class="w-full mt-1 p-2.5 bg-white border-2 border-zinc-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="user01">
               </div>
               <div>
                 <label class="text-[10px] font-bold text-zinc-500 uppercase ml-1">Password <span class="text-rose-500">*</span></label>
                 <input id="add-password" type="password" class="w-full mt-1 p-2.5 bg-white border-2 border-zinc-200 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all" placeholder="******">
               </div>
             </div>
  
             <div>
                <label class="text-[10px] font-bold text-zinc-500 uppercase ml-1">Account Role <span class="text-rose-500">*</span></label>
                <div class="relative mt-1">
                  <select id="add-role" class="w-full p-2.5 bg-emerald-50/50 border-2 border-emerald-100 text-emerald-800 rounded-xl font-bold text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all cursor-pointer">
                    <option value="user">Member (General User)</option>
                    <option value="agent">Agent (Master / Partner)</option>
                    <option value="admin">Admin (System Owner)</option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
             </div>
          </div>
  
          <div class="space-y-3 pt-1">
             <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-black text-zinc-400 uppercase tracking-wider">Personal Info</span>
                <div class="h-px bg-zinc-200 flex-1"></div>
             </div>
  
             <div>
               <label class="text-[10px] font-bold text-zinc-500 uppercase ml-1">Full Name</label>
               <input id="add-fullname" type="text" class="w-full mt-1 p-2.5 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-colors" placeholder="John Doe">
             </div>
  
             <div>
               <label class="text-[10px] font-bold text-zinc-500 uppercase ml-1">Phone Number</label>
               <input id="add-phone" type="text" class="w-full mt-1 p-2.5 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-emerald-400 transition-colors">
             </div>
          </div>
          
          <details class="group">
            <summary class="flex items-center gap-2 cursor-pointer list-none text-zinc-400 hover:text-emerald-600 transition-colors py-2">
                <span class="text-[10px] font-black uppercase tracking-wider">Add Bank Details (Optional)</span>
                <div class="h-px bg-zinc-200 flex-1 group-open:bg-emerald-200"></div>
                <svg class="w-4 h-4 transform group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div class="grid grid-cols-2 gap-3 pt-2 animate-in slide-in-from-top-2 fade-in duration-200">
               <div>
                 <input id="add-bank-name" type="text" class="w-full p-2.5 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-emerald-400" placeholder="Bank Name">
               </div>
               <div>
                 <input id="add-bank-acc" type="text" class="w-full p-2.5 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-emerald-400" placeholder="Account No.">
               </div>
            </div>
          </details>
  
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CREATE USER',
      confirmButtonColor: '#10b981',
      cancelButtonText: 'CANCEL',
      cancelButtonColor: '#f4f4f5',
      buttonsStyling: false,
      customClass: { 
        popup: 'rounded-[2rem] p-0 overflow-hidden',
        confirmButton: 'bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 transform active:scale-95 transition-all ml-2',
        cancelButton: 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transform active:scale-95 transition-all'
      },
      preConfirm: () => {
        const username = (document.getElementById('add-username') as HTMLInputElement).value;
        const password = (document.getElementById('add-password') as HTMLInputElement).value;
        const role = (document.getElementById('add-role') as HTMLSelectElement).value;
        const fullName = (document.getElementById('add-fullname') as HTMLInputElement).value;
        
        if (!username || !password) {
          Swal.showValidationMessage('Please enter Username and Password');
          return false;
        }
  
        // ✅ Logic ตัดคำ First/Last name ยังคงอยู่
        const nameParts = fullName.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '-';
  
        return {
          username: username,
          password: password,
          role: role,
          first_name: firstName,
          last_name: lastName,
          phone: (document.getElementById('add-phone') as HTMLInputElement).value,
          bank_name: (document.getElementById('add-bank-name') as HTMLInputElement).value,
          bank_account: (document.getElementById('add-bank-acc') as HTMLInputElement).value,
          status: 'active'
        };
      }
    });

    if (formValues) {
      try {
        const res = await apiFetch(`/admin/users`, { // ต้องแน่ใจว่า Backend Route นี้รองรับ Role
          method: "POST",
          body: JSON.stringify(formValues),
        });

        if (res.ok) {
          mutate();
          Swal.fire({ 
            icon: 'success', 
            title: 'User Created', 
            text: `Created ${formValues.role} successfully`,
            timer: 1500, 
            showConfirmButton: false,
            customClass: { popup: 'rounded-[2rem]' }
          });
        } else {
          const errorData = await res.json().catch(() => ({}));
          Swal.fire({
             icon: 'error',
             title: 'Error',
             text: errorData.error || "ไม่สามารถสร้าง User ได้",
             customClass: { popup: 'rounded-[2rem]' }
          });
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  // --- 2. จัดการเครดิต (UI เดิมแต่ปรับ styling) ---
  const handleCreditAction = async (user: any, type: "deposit" | "withdraw") => {
    const isDeposit = type === "deposit";
    const themeColor = isDeposit ? "#10b981" : "#f43f5e";

    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left"><p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Credit Operation</p><p class="text-xl font-[1000] text-zinc-800 uppercase italic">${isDeposit ? 'Deposit' : 'Withdraw'}</p></div>`,
      html: `
        <div class="p-2 text-left space-y-4">
          <div class="relative">
             <span class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-zinc-300 text-lg">฿</span>
             <input id="swal-amount" type="number" class="w-full pl-10 p-5 bg-zinc-50 border-2 border-zinc-100 rounded-2xl font-black text-3xl outline-none focus:border-zinc-300 transition-colors" placeholder="0.00">
          </div>
          <input id="swal-note" type="text" class="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-zinc-300" placeholder="Remark (Optional)">
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
        Swal.fire({ icon: 'success', title: 'SUCCESS', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
      }
    }
  };

  // --- 3. Toggle Lock ---
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
        const res = await apiFetch(`/admin/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: isLocking ? "locked" : "active" }),
        });

        if (res.ok) {
          mutate();
          Swal.fire({ icon: 'success', title: 'Updated', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
        } else {
          Swal.fire("Error", "ไม่สามารถอัปเดตสถานะได้", "error");
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  // --- 4. Edit User ---
  const handleEditUser = async (user: any) => {
    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left"><p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Account Settings</p><p class="text-xl font-[1000] text-zinc-800 uppercase italic">Edit Profile</p></div>`,
      html: `
        <div class="p-2 text-left space-y-4 font-sans">
          <div>
            <label class="text-[10px] font-black text-zinc-400 uppercase ml-1">Full Name</label>
            <input id="edit-name" type="text" class="w-full mt-1 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" value="${user.name || ''}">
          </div>
          <div>
            <label class="text-[10px] font-black text-zinc-400 uppercase ml-1">Phone Number</label>
            <input id="edit-phone" type="text" class="w-full mt-1 p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none focus:border-indigo-400" value="${user.phone || ''}">
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
        Swal.fire({ icon: 'success', title: 'Saved', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
      }
    }
  };

  // --- 5. รายละเอียด / ลบ ---
  const handleDetail = (user: any) => router.push(`/admin/users/${user.id}`);
  
  const handleDelete = async (user: any) => {
    const result = await Swal.fire({
      title: `<span class="italic font-black text-xl uppercase">Delete User?</span>`,
      text: `ยืนยันการลบ ${user.username} (ไม่สามารถกู้คืนได้)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#f4f4f5',
      confirmButtonText: 'DELETE',
      cancelButtonText: 'CANCEL',
      customClass: { 
        popup: 'rounded-[2.5rem]',
        cancelButton: 'text-zinc-500 hover:bg-zinc-100 font-bold'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
        if (res.ok) {
          mutate();
          Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false, customClass: { popup: 'rounded-[2rem]' } });
        } else {
          Swal.fire("Error", "ไม่สามารถลบผู้ใช้ได้", "error");
        }
      } catch (e) {
        Swal.fire("Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            Accounts <span className="text-emerald-600">Management</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm tracking-wide mt-2">
            Total {users?.length || 0} members available
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              autoComplete="off"
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all placeholder:text-slate-400"
              placeholder="Search username, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-200 hover:-translate-y-0.5 transition-all whitespace-nowrap"
            >
              <UserPlus size={18} />
              <span>Create User</span>
            </button>

             {/* ปุ่ม Filter Role (ตัวอย่าง UI ยังไม่มี Logic) */}
             <div className="h-full w-px bg-slate-200 mx-1 hidden md:block"></div>

             <button className="flex items-center gap-2 px-5 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap">
               <Shield size={16} /> Admins
             </button>
             <button className="flex items-center gap-2 px-5 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap">
               <Users size={16} /> Members
             </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-[1000] text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="p-5 pl-8">Member Info</th>
                <th className="p-5">Username / Role</th>
                <th className="p-5 text-right">Credit Balance</th>
                <th className="p-5 text-center">Manage</th>
                <th className="p-5 text-right pr-8">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && !users ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-500" size={40} />
                      <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Syncing Data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-24 text-center">
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest opacity-50">No Data Found</p>
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