"use client";
import { useState } from "react";
import { useRouter } from "next/navigation"; // นำเข้า useRouter
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminUsersPage() {
  const router = useRouter();
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);
  const [search, setSearch] = useState("");

  // ฟังก์ชันปรับปรุงเครดิต
  const handleCredit = async (user: any) => {
    if (!user.id || user.id === 0) return; // ดักฝั่งหน้าบ้านด้วย

    const { value: amount } = await Swal.fire({
      title: `จัดการเครดิต: ${user.username}`,
      input: 'number',
      inputLabel: 'ระบุจำนวนเงิน (ใส่ค่าลบเพื่อตัดออก)',
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      background: '#09090b',
      color: '#fff',
    });

    if (amount) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}/credit`, {
          method: 'POST',
          body: JSON.stringify({ amount: parseFloat(amount) })
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'สำเร็จ', timer: 1000, showConfirmButton: false, background: '#09090b', color: '#fff' });
          mutate(); // อัปเดต UI ทันที
        }
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', background: '#09090b', color: '#fff' });
      }
    }
  };

  // ฟังก์ชันแบน/ปลดแบน
  const toggleBan = async (user: any) => {
    if (!user.id || user.id === 0) return;

    const isBanned = user.status === 'banned';
    const result = await Swal.fire({
      title: isBanned ? 'ปลดระงับ?' : 'ระงับการใช้งาน?',
      text: `User: ${user.username}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: isBanned ? 'UNBAN' : 'BAN',
      confirmButtonColor: isBanned ? '#10b981' : '#ef4444',
      background: '#09090b',
      color: '#fff',
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/users/${user.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: isBanned ? 'active' : 'banned' })
      });
      if (res.ok) {
        mutate();
      }
    }
  };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* ... ส่วน Header และ Search (คงเดิม) ... */}
      
      <div className="bg-zinc-950/50 border border-zinc-900 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            {/* ... ส่วน thead (คงเดิม) ... */}
            <tbody className="divide-y divide-zinc-900">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-zinc-600 animate-pulse font-black">LOADING...</td></tr>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <tr key={user.id} className="hover:bg-zinc-900/30 transition-colors group">
                    {/* ... ส่วนแสดง User Profile และ Status (คงเดิม) ... */}
                    
                    <td className="px-8 py-6">
                      <p className="text-xl font-black tracking-tighter text-white">฿{user.credit?.toLocaleString()}</p>
                      <button 
                        onClick={() => handleCredit(user)}
                        className="text-[10px] text-zinc-500 hover:text-amber-400 font-black uppercase transition-colors"
                      >
                        [ Adjust Credit ]
                      </button>
                    </td>

                    <td className="px-8 py-6">
                       <p className="text-[10px] text-zinc-500 font-bold uppercase">
                         {user.last_login ? new Date(user.last_login).toLocaleString('th-TH') : 'Never'}
                       </p>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleBan(user)}
                          className={`p-3 rounded-xl border transition-all ${user.status === 'banned' ? 'border-emerald-500/50 text-emerald-500 hover:bg-emerald-500 hover:text-black' : 'border-rose-500/50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                        >
                          {user.status === 'banned' ? '🔓' : '🚫'}
                        </button>
                        
                        {/* ปุ่ม View Info ใช้งานได้จริงแล้ว */}
                        <button 
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="px-6 py-3 bg-white text-black hover:bg-amber-400 rounded-xl font-black transition-all text-[10px] uppercase tracking-widest"
                        >
                          View Info
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="py-20 text-center text-zinc-800 font-black italic">NO USERS FOUND</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}