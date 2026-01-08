"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  UserPlus, Search, Ban, Wallet, Loader2, Phone, Trash2, Eye, 
  Trophy, ArrowUpDown, Clock, CheckCircle2, XCircle
} from "lucide-react";

const fetcher = (url: string) =>
  apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // ✅ ฟังก์ชันหลัก: ดูรายละเอียด (รองรับ Tabs: ประวัติเงิน / ประวัติเดิมพัน)
  // ✅ 1. ดูรายละเอียด (ดึงข้อมูล Transaction และ Bet History)
  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      didOpen: () => Swal.showLoading(),
    });

    try {
      // ดึงข้อมูลธุรกรรม และ ข้อมูลการเดิมพันพร้อมกัน
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`),
        apiFetch(`/admin/users/${user.id}/bets`) // สมมติว่านี่คือ Endpoint สำหรับประวัติการแทง
      ]);

      const transactions = await txRes.json();
      const bets = await betRes.json();

      // 💰 ส่วนของ HTML ตารางธุรกรรม (ฝาก/ถอน)
      const txHtml = transactions.length > 0 ? `
        <div class="table-scroll-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>ประเภท</th>
                <th style="text-align: right;">จำนวน</th>
                <th style="text-align: center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx: any) => `
                <tr>
                  <td>${new Date(tx.created_at).toLocaleDateString('th-TH')}</td>
                  <td style="color: ${tx.type === 'deposit' ? '#10b981' : '#f43f5e'}; font-weight: 700;">
                    ${tx.type.toUpperCase()}
                  </td>
                  <td style="text-align: right; font-weight: 800;">฿${Number(tx.amount).toLocaleString()}</td>
                  <td style="text-align: center; font-size: 10px;">${tx.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>` : `<p class="no-data">ไม่พบรายการธุรกรรม</p>`;

      // 🏆 ส่วนของ HTML ประวัติการเดิมพัน (แพ้/ชนะ)
      const betHtml = bets.length > 0 ? `
        <div class="table-scroll-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>คู่เดิมพัน</th>
                <th style="text-align: center;">เลือก</th>
                <th style="text-align: right;">เดิมพัน</th>
                <th style="text-align: center;">ผลลัพธ์</th>
              </tr>
            </thead>
            <tbody>
              ${bets.map((bet: any) => {
                const isWin = bet.result === 'win';
                const statusColor = isWin ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                return `
                <tr>
                  <td>
                    <div style="font-weight: 800;">${bet.match_name}</div>
                    <div style="font-size: 10px; color: #999;">${new Date(bet.created_at).toLocaleString('th-TH')}</div>
                  </td>
                  <td style="text-align: center;">${bet.selection}</td>
                  <td style="text-align: right; font-weight: 800;">฿${Number(bet.amount).toLocaleString()}</td>
                  <td style="text-align: center;">
                    <span style="background: ${statusColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 900;">
                      ${bet.result.toUpperCase()}
                    </span>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : `<p class="no-data">ไม่พบประวัติการเดิมพัน</p>`;

      // แสดงผลใน SweetAlert
      Swal.fire({
        title: `<span style="font-weight: 900; color: #127447;">USER ACTIVITY LOG</span>`,
        width: '95%',
        confirmButtonColor: "#127447",
        html: `
          <style>
            .table-scroll-container { max-height: 250px; overflow-y: auto; border: 1px solid #eee; border-radius: 12px; margin-bottom: 15px; }
            .details-table { width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; }
            .details-table th { background: #f8f9fa; padding: 10px; position: sticky; top: 0; z-index: 1; }
            .details-table td { padding: 10px; border-bottom: 1px solid #f8f8f8; }
            .section-title { font-size: 11px; font-weight: 900; color: #aaa; text-transform: uppercase; margin-bottom: 8px; text-align: left; display: flex; align-items: center; gap: 5px; }
            .no-data { padding: 20px; text-align: center; color: #ccc; font-size: 12px; }
          </style>

          <div style="text-align: left;">
            <div style="background: #f0fdf4; padding: 15px; border-radius: 15px; border: 1px dashed #127447; margin-bottom: 20px;">
              <span style="font-size: 12px; color: #666;">Username:</span> <b style="font-size: 16px;">${user.username}</b><br/>
              <span style="font-size: 12px; color: #666;">ยอดเงินปัจจุบัน:</span> <b style="font-size: 18px; color: #127447;">฿${Number(user.credit || 0).toLocaleString()}</b>
            </div>

            <div class="section-title">🏆 ประวัติการเดิมพัน (Win/Loss)</div>
            ${betHtml}

            <div class="section-title">💰 ประวัติการเงิน (Transactions)</div>
            ${txHtml}
          </div>
        `,
      });
    } catch (err) {
      Swal.fire("Error", "ไม่สามารถดึงข้อมูลกิจกรรมผู้ใช้ได้", "error");
    }
  };

  // ✅ ฟังก์ชันปรับยอดเงิน และ ลบสมาชิก (เหมือนเดิม)
  const handleCredit = async (user: any) => { /* ... โค้ดเดิม ... */ };
  const handleDeleteUser = async (user: any) => { /* ... โค้ดเดิม ... */ };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  ) || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-10">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black italic text-[#127447] tracking-tighter uppercase">Members</h1>
          <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase mt-2">Database Management System</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#127447] outline-none font-bold"
              placeholder="ค้นหา..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-[#127447] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-[#127447]/20 flex items-center justify-center gap-2">
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Grid: รายการสมาชิก (Responsive) */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin inline text-[#127447]" size={40} /></div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row items-center gap-8 group">
              
              {/* Profile */}
              <div className="flex flex-1 items-center gap-6 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f0fdf4] rounded-[2rem] flex items-center justify-center text-[#127447] font-black text-3xl shadow-inner group-hover:bg-[#127447] group-hover:text-white transition-colors">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 truncate uppercase">{user.username}</h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                    <Phone size={14} /> {user.phone || "---"}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-10 border-y lg:border-none py-6 lg:py-0 w-full lg:w-auto justify-between md:justify-start">
                <div>
                  <div className="text-[10px] font-black text-zinc-300 uppercase mb-1">Available Credit</div>
                  <div className="text-2xl font-black text-[#127447] flex items-center gap-2">
                    ฿{Number(user.credit || 0).toLocaleString()}
                    <button onClick={() => handleCredit(user)} className="p-1.5 bg-zinc-50 rounded-lg text-zinc-400 hover:text-[#127447] transition-colors"><Wallet size={16}/></button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-300 uppercase mb-1">Account Status</div>
                  <div className="flex items-center gap-2 bg-[#f0fdf4] px-4 py-1.5 rounded-full border border-[#dcfce7]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black text-[#127447] uppercase">{user.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => handleViewDetails(user)} className="flex-1 lg:flex-none bg-[#f0fdf4] text-[#127447] p-5 rounded-2xl hover:bg-[#127447] hover:text-white transition-all">
                  <Eye size={24} />
                </button>
                <button onClick={() => handleDeleteUser(user)} className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                  <Trash2 size={24} />
                </button>
                <button className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all">
                  <Ban size={24} />
                </button>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}