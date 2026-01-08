"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  UserPlus, Search, Ban, Wallet, Loader2, Phone, Trash2, Eye,
} from "lucide-react";

const fetcher = (url: string) =>
  apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // --- 1. ฟังก์ชันเพิ่มผู้ใช้ใหม่ ---
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="font-weight:900; color:#127447;">ADD NEW MEMBER</span>',
      html: `
        <div style="text-align:left;">
          <label style="font-size:12px; font-weight:800; color:#666;">USERNAME</label>
          <input id="swal-username" class="swal2-input" style="margin-top:5px; border-radius:10px;" placeholder="Username">
          <label style="font-size:12px; font-weight:800; color:#666; margin-top:10px; display:block;">PASSWORD</label>
          <input id="swal-password" type="password" class="swal2-input" style="margin-top:5px; border-radius:10px;" placeholder="Password">
          <label style="font-size:12px; font-weight:800; color:#666; margin-top:10px; display:block;">PHONE NUMBER</label>
          <input id="swal-phone" class="swal2-input" style="margin-top:5px; border-radius:10px;" placeholder="08x-xxxxxxx">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CREATE ACCOUNT',
      confirmButtonColor: '#127447',
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        if (!username || !password) return Swal.showValidationMessage('กรุณากรอกข้อมูลให้ครบถ้วน');
        return { username, password, phone };
      }
    });

    if (formValues) {
      try {
        const res = await apiFetch("/admin/users", {
          method: "POST",
          body: JSON.stringify(formValues),
        });
        if (res.ok) {
          Swal.fire("สำเร็จ", "เพิ่มสมาชิกเรียบร้อย", "success");
          mutate();
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "ไม่สามารถเพิ่มสมาชิกได้", "error");
      }
    }
  };

  // --- 2. ฟังก์ชันดูรายละเอียด (ปรับปรุงตามรูปภาพ ADMIN INSPECTOR) ---
  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // ดึงข้อมูลพร้อมกัน
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`).catch(() => null),
        apiFetch(`/admin/users/${user.id}/bets`).catch(() => null)
      ]);

      const transactions = txRes && txRes.ok ? await txRes.json() : [];
      const bets = betRes && betRes.ok ? await betRes.json() : [];

      // ส่วน Financials (รายการเงิน)
      const txHtml = (Array.isArray(transactions) && transactions.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th style="width:20%">วันที่/เวลา</th>
                <th style="width:40%">ประเภท / รายการ</th>
                <th style="text-align:right; width:20%">จำนวน</th>
                <th style="text-align:center; width:20%">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx: any) => {
                const date = new Date(tx.created_at).toLocaleDateString('th-TH');
                const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const typeColor = tx.type.toLowerCase() === 'payout' || tx.type.toLowerCase() === 'deposit' ? '#10b981' : '#f43f5e';
                const matchInfo = tx.home_team ? `<div class="match-info">⚽ ${tx.home_team} vs ${tx.away_team}</div>` : '';
                
                return `
                <tr>
                  <td><div class="date-txt">${date}</div><div class="time-txt">${time}</div></td>
                  <td>
                    <b style="color:${typeColor}; text-transform:uppercase; font-size:11px;">${tx.type}</b>
                    ${matchInfo}
                  </td>
                  <td style="text-align:right; font-weight:800; font-size:13px;">฿${Number(tx.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="status-label">${tx.status.toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<p class="no-data">ไม่พบข้อมูลธุรกรรม</p>';

      // ส่วน Bet History (ประวัติเดิมพัน)
      const betHtml = (Array.isArray(bets) && bets.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>คู่แข่งขัน</th>
                <th style="text-align:center;">ตัวเลือก</th>
                <th style="text-align:right;">ยอดเดิมพัน</th>
                <th style="text-align:center;">ผลลัพธ์</th>
              </tr>
            </thead>
            <tbody>
              ${bets.map((bet: any) => {
                const resColor = bet.result === 'win' ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                return `
                <tr>
                  <td>
                    <div style="font-weight:800; color:#333;">${bet.home_team} vs ${bet.away_team}</div>
                    <div class="time-txt">${new Date(bet.created_at).toLocaleDateString('th-TH')}</div>
                  </td>
                  <td style="text-align:center;"><span class="pick-tag">${bet.pick || '-'}</span></td>
                  <td style="text-align:right; font-weight:800;">฿${Number(bet.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="res-tag" style="background:${resColor}">${bet.result?.toUpperCase() || 'WAITING'}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<p class="no-data">ไม่พบประวัติการเดิมพัน</p>';

      Swal.fire({
        title: `<div class="inspector-title">USER INSPECTOR</div>`,
        width: '95%',
        confirmButtonText: "CLOSE",
        confirmButtonColor: "#127447",
        html: `
          <style>
            .inspector-title { font-size:20px; font-weight:900; color:#127447; border-bottom:2px solid #eee; padding-bottom:10px; margin-bottom:10px; }
            .user-header-card { border: 2px solid #127447; border-radius:15px; padding:15px; text-align:left; margin-bottom:15px; }
            .header-label { font-size:10px; font-weight:900; color:#127447; text-transform:uppercase; margin-bottom:5px; }
            .header-value { font-size:24px; font-weight:900; color:#127447; }
            .tab-container { display:flex; gap:5px; margin-bottom:15px; border-bottom: 2px solid #f1f5f9; }
            .tab-btn { flex:1; padding:12px; font-size:12px; font-weight:900; cursor:pointer; border:none; background:none; color:#94a3b8; text-transform:uppercase; }
            .tab-btn.active { color:#127447; border-bottom: 4px solid #127447; }
            .table-container { max-height:450px; overflow-y:auto; border-radius:10px; }
            .details-table { width:100%; border-collapse:collapse; font-size:12px; }
            .details-table th { background:#f8f9fa; padding:12px; text-align:left; color:#666; position:sticky; top:0; font-size:10px; text-transform:uppercase; }
            .details-table td { padding:12px; border-bottom:1px solid #f1f5f9; vertical-align:middle; }
            .date-txt { font-weight:800; color:#333; }
            .time-txt { font-size:10px; color:#999; }
            .match-info { font-size:11px; color:#127447; font-weight:700; margin-top:3px; }
            .status-label { font-size:10px; font-weight:800; color:#64748b; background:#f1f5f9; padding:2px 8px; border-radius:4px; }
            .pick-tag { background:#f0fdf4; border:1px solid #127447; color:#127447; padding:2px 6px; border-radius:4px; font-weight:900; font-size:10px; }
            .res-tag { color:white; padding:3px 8px; border-radius:6px; font-size:9px; font-weight:900; }
            .no-data { padding:40px; text-align:center; color:#94a3b8; font-weight:bold; }
          </style>
          
          <div class="user-header-card">
            <div class="header-label">Username: ${user.username}</div>
            <div class="header-value">฿${Number(user.credit || 0).toLocaleString()}</div>
          </div>

          <div class="tab-container">
            <button id="t-fin" class="tab-btn active" onclick="switchInspectorTab('fin')">Financials</button>
            <button id="t-bet" class="tab-btn" onclick="switchInspectorTab('bet')">Bet History</button>
          </div>

          <div id="c-fin">${txHtml}</div>
          <div id="c-bet" style="display:none;">${betHtml}</div>

          <script>
            function switchInspectorTab(type) {
              const finBtn = document.getElementById('t-fin');
              const betBtn = document.getElementById('t-bet');
              const finContent = document.getElementById('c-fin');
              const betContent = document.getElementById('c-bet');
              if(type === 'fin') {
                finBtn.classList.add('active'); betBtn.classList.remove('active');
                finContent.style.display = 'block'; betContent.style.display = 'none';
              } else {
                betBtn.classList.add('active'); finBtn.classList.remove('active');
                betContent.style.display = 'block'; finContent.style.display = 'none';
              }
            }
            window.switchInspectorTab = switchInspectorTab;
          </script>
        `,
        customClass: { popup: 'rounded-[2rem]' }
      });

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้ หรือการเชื่อมต่อมีปัญหา", "error");
    }
  };

  // --- 3. ฟังก์ชันปรับเครดิต ---
  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: 'ADJUST CREDIT',
      input: 'number',
      inputLabel: `Username: ${user.username}`,
      inputPlaceholder: 'ใส่จำนวนเงิน (เช่น 100 หรือ -100)',
      showCancelButton: true,
      confirmButtonColor: '#127447',
      confirmButtonText: 'CONFIRM'
    });

    if (amount) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}/credit`, {
          method: "POST",
          body: JSON.stringify({ amount: parseFloat(amount) }),
        });
        if (res.ok) {
          Swal.fire("สำเร็จ", "ปรับเครดิตเรียบร้อย", "success");
          mutate();
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "ไม่สามารถปรับเครดิตได้", "error");
      }
    }
  };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  ) || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-10">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black italic text-[#127447] tracking-tighter uppercase">Members</h1>
          <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase mt-2">Admin Management Panel</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#127447] outline-none font-bold"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button 
            onClick={handleAddUser}
            className="bg-[#127447] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-[#127447]/20 flex items-center justify-center gap-2 hover:bg-black transition-all"
          >
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      {/* Grid of Users */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin inline text-[#127447]" size={40} />
            <p className="mt-4 font-bold text-zinc-400">LOADING DATABASE...</p>
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row items-center gap-8 group">
              <div className="flex flex-1 items-center gap-6 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f0fdf4] rounded-[2rem] flex items-center justify-center text-[#127447] font-black text-3xl shadow-inner group-hover:bg-[#127447] group-hover:text-white transition-colors">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 truncate uppercase">{user.username}</h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                    <Phone size={14} /> {user.phone || "No phone linked"}
                  </div>
                </div>
              </div>

              <div className="flex gap-10 border-y lg:border-none py-6 lg:py-0 w-full lg:w-auto justify-between md:justify-start">
                <div>
                  <div className="text-[10px] font-black text-zinc-300 uppercase mb-1">Available Credit</div>
                  <div className="text-2xl font-black text-[#127447] flex items-center gap-2">
                    ฿{Number(user.credit || 0).toLocaleString()}
                    <button onClick={() => handleCredit(user)} className="p-1.5 bg-zinc-50 rounded-lg text-zinc-400 hover:text-[#127447] transition-colors"><Wallet size={16}/></button>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-300 uppercase mb-1">Status</div>
                  <div className="flex items-center gap-2 bg-[#f0fdf4] px-4 py-1.5 rounded-full border border-[#dcfce7]">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-xs font-black text-[#127447] uppercase">{user.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 w-full lg:w-auto">
                <button onClick={() => handleViewDetails(user)} className="flex-1 lg:flex-none bg-[#f0fdf4] text-[#127447] p-5 rounded-2xl hover:bg-[#127447] hover:text-white transition-all shadow-sm">
                  <Eye size={24} />
                </button>
                <button className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                  <Trash2 size={24} />
                </button>
                <button className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
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