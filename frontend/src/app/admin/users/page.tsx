"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  UserPlus, Search, Ban, Wallet, Loader2, Phone, Trash2, Eye, X
} from "lucide-react";

const fetcher = (url: string) =>
  apiFetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // --- 1. ฟังก์ชันเพิ่มผู้ใช้งานใหม่ ---
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="font-family: inherit; font-weight: 900;">เพิ่มสมาชิกใหม่</span>',
      html: `
        <div style="text-align: left; font-family: sans-serif;">
          <label style="font-size: 12px; font-weight: bold; color: #666;">USERNAME</label>
          <input id="swal-username" class="swal2-input" placeholder="ชื่อผู้ใช้งาน" style="margin-top: 5px; border-radius: 12px;">
          <label style="font-size: 12px; font-weight: bold; color: #666; margin-top: 10px; display: block;">PASSWORD</label>
          <input id="swal-password" type="password" class="swal2-input" placeholder="รหัสผ่าน" style="margin-top: 5px; border-radius: 12px;">
          <label style="font-size: 12px; font-weight: bold; color: #666; margin-top: 10px; display: block;">PHONE (Optional)</label>
          <input id="swal-phone" class="swal2-input" placeholder="เบอร์โทรศัพท์" style="margin-top: 5px; border-radius: 12px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'สร้างสมาชิก',
      confirmButtonColor: '#127447',
      cancelButtonText: 'ยกเลิก',
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        if (!username || !password) {
          Swal.showValidationMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        }
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
          Swal.fire("สำเร็จ", "เพิ่มสมาชิกใหม่เรียบร้อยแล้ว", "success");
          mutate();
        } else {
          const error = await res.json();
          Swal.fire("ผิดพลาด", error.message || "ไม่สามารถเพิ่มสมาชิกได้", "error");
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
      }
    }
  };

  // --- 2. ฟังก์ชันดูรายละเอียด (Transactions & Bets) ---
  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`).catch(() => null),
        apiFetch(`/admin/users/${user.id}/bets`).catch(() => null)
      ]);

      const transactions = txRes && txRes.ok ? await txRes.json() : [];
      const bets = betRes && betRes.ok ? await betRes.json() : [];

      // กรองธุรกรรมเฉพาะที่เป็นการเดิมพัน (มีข้อมูลทีม)
      const matchTransactions = transactions.filter((tx: any) => tx.home_team && tx.away_team);

      const txHtml = (matchTransactions.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>วัน/เวลา</th>
                <th>รายละเอียด</th>
                <th style="text-align:right;">ยอดเงิน</th>
                <th style="text-align:center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${matchTransactions.map((tx: any) => {
                const date = new Date(tx.created_at).toLocaleDateString('th-TH');
                const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const isWin = tx.type.toLowerCase() === 'payout';
                return `
                <tr>
                  <td><div style="font-weight:700;">${date}</div><div style="font-size:10px; color:#999;">${time}</div></td>
                  <td>
                    <b style="color:${isWin ? '#10b981' : '#f43f5e'}; text-transform:uppercase; font-size:10px;">${tx.type}</b>
                    <div style="font-size:11px; color:#334155; font-weight:700; margin-top:2px;">⚽ ${tx.home_team} vs ${tx.away_team}</div>
                  </td>
                  <td style="text-align:right; font-weight:800; color:${isWin ? '#10b981' : '#1e293b'}">฿${Number(tx.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="status-badge">${tx.status.toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="no-data">ไม่พบประวัติธุรกรรม</div>';

      const betHtml = (bets.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>คู่แข่งขัน</th>
                <th style="text-align:center;">ตัวเลือก</th>
                <th style="text-align:right;">เดิมพัน</th>
                <th style="text-align:center;">ผล</th>
              </tr>
            </thead>
            <tbody>
              ${bets.map((bet: any) => {
                const date = new Date(bet.created_at).toLocaleDateString('th-TH');
                const isParlay = bet.items && bet.items.length > 0;
                const resColor = bet.result === 'win' ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                
                let matchContent = isParlay 
                  ? `<div style="color:#1e40af; font-weight:900; font-size:10px; margin-bottom:4px;">MIX PARLAY (${bet.items.length})</div>` +
                    bet.items.map((item: any) => `<div style="font-size:10px; border-left:2px solid #127447; padding-left:5px; margin-bottom:2px;"><b>${item.home_team} - ${item.away_team}</b></div>`).join('')
                  : `<div style="font-weight:800;">${bet.home_team} vs ${bet.away_team}</div>`;

                return `
                <tr>
                  <td>${matchContent}<div style="font-size:10px; color:#999; margin-top:2px;">${date}</div></td>
                  <td style="text-align:center;"><span class="pick-badge">${bet.pick || bet.selection || '-'}</span></td>
                  <td style="text-align:right; font-weight:800;">฿${Number(bet.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="res-badge" style="background:${resColor}">${bet.status || bet.result}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="no-data">ไม่มีประวัติการเดิมพัน</div>';

      Swal.fire({
        title: `<div style="font-size:18px; font-weight:900; color:#127447; letter-spacing:-0.5px;">USER INSPECTOR</div>`,
        width: '900px',
        showConfirmButton: false,
        showCloseButton: true,
        html: `
          <style>
            .table-container { max-height:450px; overflow:auto; border:1px solid #f1f5f9; border-radius:12px; margin-top:10px; }
            .details-table { width:100%; border-collapse:collapse; font-size:12px; }
            .details-table th { background:#f8f9fa; padding:12px; position:sticky; top:0; z-index:10; text-align:left; color:#64748b; font-size:10px; text-transform:uppercase; border-bottom:2px solid #f1f5f9; }
            .details-table td { padding:12px; border-bottom:1px solid #f8fafc; text-align:left; vertical-align: top; }
            .user-info-card { background:#127447; padding:20px; border-radius:16px; margin-bottom:15px; text-align:left; color: white; display:flex; justify-content:space-between; align-items:center; }
            .nav-tabs { display:flex; gap:10px; margin-bottom:15px; background:#f1f5f9; padding:5px; border-radius:12px; }
            .tab-btn { flex:1; padding:10px; font-size:12px; font-weight:800; cursor:pointer; border:none; background:transparent; color:#64748b; border-radius:8px; transition:0.2s; }
            .tab-btn.active { background:white; color:#127447; shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .status-badge { font-size:9px; font-weight:800; color:#64748b; background:#f1f5f9; padding:2px 6px; border-radius:4px; }
            .pick-badge { background:#f0fdf4; border:1px solid #dcfce7; color:#127447; padding:2px 6px; border-radius:4px; font-weight:800; font-size:10px; }
            .res-badge { color:white; padding:3px 8px; border-radius:6px; font-size:9px; font-weight:900; text-transform:uppercase; }
            .no-data { padding:60px; text-align:center; color:#94a3b8; font-weight:bold; font-size:14px; }
          </style>
          
          <div class="user-info-card">
            <div>
               <div style="font-size:10px; opacity:0.8; font-weight:800; text-transform:uppercase; margin-bottom:2px;">Member Username</div>
               <div style="font-size:20px; font-weight:900;">${user.username}</div>
            </div>
            <div style="text-align:right;">
               <div style="font-size:10px; opacity:0.8; font-weight:800; text-transform:uppercase; margin-bottom:2px;">Current Balance</div>
               <div style="font-size:24px; font-weight:900;">฿${Number(user.credit || 0).toLocaleString()}</div>
            </div>
          </div>

          <div class="nav-tabs">
            <button id="tab-tx-btn" class="tab-btn active" onclick="window.switchTab('tx')">ธุรกรรมฟุตบอล</button>
            <button id="tab-bet-btn" class="tab-btn" onclick="window.switchTab('bet')">ประวัติการวางเดิมพัน</button>
          </div>

          <div id="tab-tx-content">${txHtml}</div>
          <div id="tab-bet-content" style="display:none;">${betHtml}</div>

          <script>
            window.switchTab = function(type) {
              const txBtn = document.getElementById('tab-tx-btn');
              const betBtn = document.getElementById('tab-bet-btn');
              const txContent = document.getElementById('tab-tx-content');
              const betContent = document.getElementById('tab-bet-content');
              if(type === 'tx') {
                txBtn.classList.add('active'); betBtn.classList.remove('active');
                txContent.style.display = 'block'; betContent.style.display = 'none';
              } else {
                betBtn.classList.add('active'); txBtn.classList.remove('active');
                betContent.style.display = 'block'; txContent.style.display = 'none';
              }
            }
          </script>
        `,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (err) {
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
    }
  };

  // --- 3. ฟังก์ชันปรับเครดิต ---
  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: 'ปรับปรุงเครดิต',
      text: `Username: ${user.username}`,
      input: 'number',
      inputPlaceholder: 'ใส่จำนวนเงิน (เช่น 100 หรือ -100)',
      showCancelButton: true,
      confirmButtonColor: '#127447',
      confirmButtonText: 'อัปเดตเครดิต',
      cancelButtonText: 'ยกเลิก'
    });

    if (amount) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}/credit`, {
          method: "POST",
          body: JSON.stringify({ amount: parseFloat(amount) }),
        });
        if (res.ok) {
          Swal.fire("สำเร็จ", "ปรับเครดิตเรียบร้อยแล้ว", "success");
          mutate();
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "ไม่สามารถปรับเครดิตได้", "error");
      }
    }
  };

  // --- 4. ฟังก์ชันลบผู้ใช้ ---
  const handleDeleteUser = async (user: any) => {
    const confirm = await Swal.fire({
      title: 'ลบผู้ใช้งาน?',
      text: `คุณกำลังจะลบ ${user.username} ข้อมูลทั้งหมดของสมาชิกรายนี้จะหายไป`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'ยืนยันการลบ',
      cancelButtonText: 'ยกเลิก'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("สำเร็จ", "ลบผู้ใช้งานออกจากระบบแล้ว", "success");
          mutate();
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "ไม่สามารถลบผู้ใช้งานได้", "error");
      }
    }
  };

  const filteredUsers = users?.filter((u: any) => 
    u.username.toLowerCase().includes(search.toLowerCase()) || u.phone?.includes(search)
  ) || [];

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-10">
      {/* Header & Search */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black italic text-[#127447] tracking-tighter uppercase">Members</h1>
          <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase mt-2">Member Management System</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#127447] outline-none font-bold"
              placeholder="ค้นหาชื่อหรือเบอร์โทร..."
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

      {/* User Cards */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin inline text-[#127447]" size={40} />
            <p className="mt-4 font-bold text-zinc-400">LOADING DATABASE...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] text-center border border-dashed border-zinc-200">
             <p className="text-zinc-400 font-black uppercase tracking-widest">No Members Found</p>
          </div>
        ) : (
          filteredUsers.map((user: any) => (
            <div key={user.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all flex flex-col lg:flex-row items-center gap-8 group">
              <div className="flex flex-1 items-center gap-6 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#f0fdf4] rounded-[2rem] flex items-center justify-center text-[#127447] font-black text-3xl shadow-inner group-hover:bg-[#127447] group-hover:text-white transition-colors">
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl md:text-2xl font-black text-zinc-900 truncate uppercase tracking-tight">{user.username}</h3>
                  <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
                    <Phone size={14} className="text-[#127447]" /> {user.phone || "---"}
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
                  <div className="text-[10px] font-black text-zinc-300 uppercase mb-1">Account Status</div>
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
                <button onClick={() => handleDeleteUser(user)} className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
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