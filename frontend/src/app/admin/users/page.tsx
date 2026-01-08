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

  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // ดึงข้อมูล Transactions และ Bet History พร้อมกัน
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`).catch(() => null),
        apiFetch(`/admin/users/${user.id}/bets`).catch(() => null)
      ]);

      const transactions = txRes && txRes.ok ? await txRes.json() : [];
      const bets = betRes && betRes.ok ? await betRes.json() : [];

      // --- 1. กรองเฉพาะรายการ "ธุรกรรม" ที่มีคู่บอล (Match Only) ---
      const matchTransactions = transactions.filter((tx: any) => tx.home_team && tx.away_team);

      const txHtml = (Array.isArray(matchTransactions) && matchTransactions.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>วันที่/เวลา</th>
                <th>ประเภท / คู่แข่งขัน</th>
                <th style="text-align:right;">จำนวน</th>
                <th style="text-align:center;">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              ${matchTransactions.map((tx: any) => {
                const date = new Date(tx.created_at).toLocaleDateString('th-TH');
                const time = new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const typeColor = tx.type.toLowerCase() === 'payout' ? '#10b981' : '#f43f5e';
                
                return `
                <tr>
                  <td><div style="font-weight:700;">${date}</div><div style="font-size:10px; color:#999;">${time} น.</div></td>
                  <td>
                    <b style="color:${typeColor}; text-transform:uppercase;">${tx.type}</b>
                    <div style="font-size:11px; color:#127447; font-weight:700; margin-top:2px;">⚽ ${tx.home_team} vs ${tx.away_team}</div>
                  </td>
                  <td style="text-align:right; font-weight:800;">฿${Number(tx.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span style="font-size:10px; font-weight:700; color:#64748b;">${tx.status.toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<p class="no-data">ไม่พบรายการธุรกรรมที่เป็นการเดิมพัน</p>';

      // --- 2. จัดการ HTML สำหรับแถบ Bet History (รองรับบอลสเต็ป/Mix Play) ---
      const betHtml = (Array.isArray(bets) && bets.length > 0) ? `
        <div class="table-container">
          <table class="details-table">
            <thead>
              <tr>
                <th>คู่แข่งขัน / เวลา</th>
                <th style="text-align:center;">ตัวเลือก</th>
                <th style="text-align:right;">ยอดเดิมพัน</th>
                <th style="text-align:center;">ผลลัพธ์</th>
              </tr>
            </thead>
            <tbody>
              ${bets.map((bet: any) => {
                const date = new Date(bet.created_at).toLocaleDateString('th-TH');
                const isParlay = bet.items && bet.items.length > 0;
                const resColor = bet.result === 'win' ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                
                let matchContent = "";
                if (isParlay) {
                    matchContent = `<div style="color:#1e40af; font-weight:900; margin-bottom:4px;">MIX PARLAY (${bet.items.length} คู่)</div>` +
                    bet.items.map((item: any) => `
                        <div style="font-size:11px; border-left:2px solid #127447; padding-left:5px; margin-bottom:3px;">
                            <b>${item.home_team} vs ${item.away_team}</b><br/>
                            <span style="color:#666;">ทาย: ${item.pick}</span>
                        </div>
                    `).join('');
                } else {
                    matchContent = `<div style="font-weight:800;">${bet.home_team} vs ${bet.away_team}</div>`;
                }

                return `
                <tr>
                  <td>${matchContent}<div style="font-size:10px; color:#999; margin-top:4px;">${date}</div></td>
                  <td style="text-align:center;">
                    <div style="background:#f0fdf4; border:1px solid #127447; color:#127447; padding:2px 4px; border-radius:4px; font-weight:900; font-size:10px;">
                        ${bet.pick || bet.selection || '-'}
                    </div>
                  </td>
                  <td style="text-align:right; font-weight:800;">฿${Number(bet.amount).toLocaleString()}</td>
                  <td style="text-align:center;">
                    <div style="background:${resColor}; color:white; padding:3px 6px; border-radius:6px; font-size:9px; font-weight:900; text-transform:uppercase;">
                        ${bet.status || bet.result}
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<p class="no-data">ไม่มีประวัติการเดิมพัน</p>';

      // --- 3. แสดง Modal ด้วย SweetAlert2 ---
      Swal.fire({
        title: `<div style="font-size:22px; font-weight:900; color:#127447;">USER INSPECTOR</div>`,
        width: '95%',
        showConfirmButton: true,
        confirmButtonText: "ปิดหน้าต่าง",
        confirmButtonColor: "#127447",
        html: `
          <style>
            .table-container { max-height:400px; overflow:auto; border:1px solid #eee; border-radius:15px; margin-top:10px; }
            .details-table { width:100%; border-collapse:collapse; font-size:12px; }
            .details-table th { background:#f8f9fa; padding:10px; position:sticky; top:0; z-index:1; text-align:left; color:#666; font-size:10px; }
            .details-table td { padding:10px; border-bottom:1px solid #f1f5f9; text-align:left; }
            .user-info-card { background:#f0fdf4; padding:15px; border-radius:15px; border:2px solid #127447; margin-bottom:15px; text-align:left; }
            .nav-tabs { display:flex; gap:5px; margin-bottom:10px; border-bottom:2px solid #f1f5f9; }
            .tab-btn { flex:1; padding:12px; font-size:12px; font-weight:800; cursor:pointer; border:none; background:none; color:#94a3b8; transition:0.3s; }
            .tab-btn.active { color:#127447; border-bottom:3px solid #127447; }
            .no-data { padding:40px; text-align:center; color:#94a3b8; font-weight:bold; }
          </style>
          
          <div class="user-info-card">
            <div style="font-size:10px; color:#127447; font-weight:800; text-transform:uppercase;">Username: ${user.username}</div>
            <div style="font-size:24px; font-weight:900; color:#127447;">฿${Number(user.credit || 0).toLocaleString()}</div>
          </div>

          <div class="nav-tabs">
            <button id="tab-tx-btn" class="tab-btn active" onclick="window.switchTab('tx')">ธุรกรรมการเงิน (เฉพาะคู่บอล)</button>
            <button id="tab-bet-btn" class="tab-btn" onclick="window.switchTab('bet')">ประวัติเดิมพัน</button>
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
      console.error(err);
      Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error");
    }
  };

  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: 'ปรับเครดิต',
      input: 'number',
      inputLabel: `Username: ${user.username}`,
      inputPlaceholder: 'ใส่จำนวนเงิน (เช่น 100 หรือ -100)',
      showCancelButton: true,
      confirmButtonColor: '#127447',
      confirmButtonText: 'ยืนยัน'
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

  const handleDeleteUser = async (user: any) => {
    const confirm = await Swal.fire({
      title: 'ลบผู้ใช้งาน?',
      text: `คุณกำลังจะลบ ${user.username} ออกจากระบบ`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'ยืนยันการลบ'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/users/${user.id}`, { method: "DELETE" });
        if (res.ok) {
          Swal.fire("สำเร็จ", "ลบผู้ใช้งานเรียบร้อย", "success");
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
              placeholder="ค้นหาด้วยชื่อหรือเบอร์โทร..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="bg-[#127447] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-[#127447]/20 flex items-center justify-center gap-2">
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin inline text-[#127447]" size={40} /></div>
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
                    <Phone size={14} /> {user.phone || "ไม่มีเบอร์โทรศัพท์"}
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