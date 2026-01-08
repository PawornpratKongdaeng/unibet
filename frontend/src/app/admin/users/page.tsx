"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  UserPlus, Search, Ban, Wallet, Loader2, Phone, Trash2, Eye,
} from "lucide-react";

// --- Fetcher Helper ---
const fetcher = (url: string) =>
  apiFetch(url).then(async (res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  });

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // --- 1. ลงทะเบียน Global Function สำหรับสลับ Tab ---
  useEffect(() => {
    (window as any).switchInspectorTab = (type: 'fin' | 'bet') => {
      const finBtn = document.getElementById('t-fin');
      const betBtn = document.getElementById('t-bet');
      const finBox = document.getElementById('box-fin');
      const betBox = document.getElementById('box-bet');

      if (!finBtn || !betBtn || !finBox || !betBox) return;

      if (type === 'fin') {
        finBtn.classList.add('active');
        betBtn.classList.remove('active');
        finBox.style.display = 'block';
        betBox.style.display = 'none';
      } else {
        betBtn.classList.add('active');
        finBtn.classList.remove('active');
        finBox.style.display = 'none';
        betBox.style.display = 'block';
      }
    };

    // Cleanup เมื่อออกจากหน้า
    return () => {
      delete (window as any).switchInspectorTab;
    };
  }, []);

  // --- 2. ฟังก์ชันเพิ่มผู้ใช้ใหม่ ---
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span style="font-weight:900; color:#127447;">ADD NEW MEMBER</span>',
      html: `
        <div style="text-align:left; font-family: sans-serif;">
          <label style="font-size:12px; font-weight:800; color:#666; text-transform:uppercase;">Username</label>
          <input id="swal-username" class="swal2-input" style="margin-top:5px; border-radius:12px; font-weight:bold;" placeholder="Username">
          <label style="font-size:12px; font-weight:800; color:#666; margin-top:15px; display:block; text-transform:uppercase;">Password</label>
          <input id="swal-password" type="password" class="swal2-input" style="margin-top:5px; border-radius:12px; font-weight:bold;" placeholder="Password">
          <label style="font-size:12px; font-weight:800; color:#666; margin-top:15px; display:block; text-transform:uppercase;">Phone Number</label>
          <input id="swal-phone" class="swal2-input" style="margin-top:5px; border-radius:12px; font-weight:bold;" placeholder="08x-xxxxxxx">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CREATE ACCOUNT',
      confirmButtonColor: '#127447',
      cancelButtonText: 'CANCEL',
      customClass: { popup: 'rounded-[2rem]' },
      preConfirm: () => {
        const username = (document.getElementById('swal-username') as HTMLInputElement).value;
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const phone = (document.getElementById('swal-phone') as HTMLInputElement).value;
        if (!username || !password) return Swal.showValidationMessage('กรุณากรอกข้อมูล Username และ Password');
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
          Swal.fire({ icon: 'success', title: 'สำเร็จ', text: 'เพิ่มสมาชิกใหม่เรียบร้อยแล้ว', timer: 1500 });
          mutate();
        }
      } catch (err) {
        Swal.fire("ผิดพลาด", "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้", "error");
      }
    }
  };

  // --- 3. ฟังก์ชันดูรายละเอียด (USER INSPECTOR) ---
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

      const txHtml = (Array.isArray(transactions) && transactions.length > 0) ? `
        <div class="table-scroll">
          <table class="insp-table">
            <thead>
              <tr>
                <th style="width:25%">Date/Time</th>
                <th style="width:40%">Type / Match</th>
                <th style="text-align:right;">Amount</th>
                <th style="text-align:center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx: any) => {
                const isPlus = tx.type.toLowerCase() === 'payout' || tx.type.toLowerCase() === 'deposit';
                return `
                <tr>
                  <td><div class="bold">${new Date(tx.created_at).toLocaleDateString('th-TH')}</div><div class="small-grey">${new Date(tx.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div></td>
                  <td>
                    <div class="bold" style="color:${isPlus ? '#10b981' : '#f43f5e'}">${tx.type.toUpperCase()}</div>
                    ${tx.home_team ? `<div class="small-green">⚽ ${tx.home_team} vs ${tx.away_team}</div>` : ''}
                  </td>
                  <td style="text-align:right;" class="bold-large">฿${Number(tx.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="badge-status">${tx.status.toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-box">ไม่พบข้อมูลธุรกรรม</div>';

      const betHtml = (Array.isArray(bets) && bets.length > 0) ? `
        <div class="table-scroll">
          <table class="insp-table">
            <thead>
              <tr>
                <th>Match</th>
                <th style="text-align:center;">Pick</th>
                <th style="text-align:right;">Wager</th>
                <th style="text-align:center;">Result</th>
              </tr>
            </thead>
            <tbody>
              ${bets.map((bet: any) => {
                const resColor = bet.result === 'win' ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                return `
                <tr>
                  <td><div class="bold">${bet.home_team} vs ${bet.away_team}</div><div class="small-grey">${new Date(bet.created_at).toLocaleDateString('th-TH')}</div></td>
                  <td style="text-align:center;"><span class="pick-tag">${bet.pick || '-'}</span></td>
                  <td style="text-align:right;" class="bold">฿${Number(bet.amount).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="res-tag" style="background:${resColor}">${(bet.result || 'PENDING').toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-box">ไม่พบประวัติการเดิมพัน</div>';

      Swal.fire({
        title: `<div class="insp-title">USER INSPECTOR</div>`,
        width: '900px',
        confirmButtonText: "CLOSE",
        confirmButtonColor: "#127447",
        html: `
          <style>
            .insp-title { font-weight:900; color:#127447; margin-bottom:10px; font-size:24px; }
            .user-info-card { border: 2.5px solid #127447; border-radius:15px; padding:15px; text-align:left; margin-bottom:20px; }
            .info-label { font-size:11px; font-weight:900; color:#127447; text-transform:uppercase; margin-bottom:2px; }
            .info-value { font-size:28px; font-weight:900; color:#127447; }
            .tab-wrapper { display:flex; gap:10px; margin-bottom:15px; border-bottom: 2px solid #eee; }
            .tab-item { flex:1; padding:12px; font-weight:900; cursor:pointer; border:none; background:none; color:#bbb; text-transform:uppercase; font-size:13px; }
            .tab-item.active { color:#127447; border-bottom: 4px solid #127447; }
            .table-scroll { max-height:450px; overflow-y:auto; border-radius:10px; }
            .insp-table { width:100%; border-collapse:collapse; font-size:13px; text-align:left; }
            .insp-table th { background:#f9f9f9; padding:12px; color:#777; font-size:10px; text-transform:uppercase; position:sticky; top:0; z-index:1; }
            .insp-table td { padding:12px; border-bottom:1px solid #f5f5f5; }
            .bold { font-weight:800; color:#333; }
            .bold-large { font-weight:900; font-size:15px; }
            .small-grey { font-size:10px; color:#999; }
            .small-green { font-size:11px; color:#127447; font-weight:700; margin-top:3px; }
            .badge-status { font-size:10px; font-weight:800; color:#666; background:#eee; padding:3px 8px; border-radius:5px; }
            .pick-tag { background:#f0fdf4; border:1px solid #127447; color:#127447; padding:2px 8px; border-radius:5px; font-weight:900; font-size:11px; }
            .res-tag { color:white; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:900; display:inline-block; min-width:65px; }
            .empty-box { padding:50px; text-align:center; font-weight:bold; color:#ccc; }
          </style>
          
          <div class="user-info-card">
            <div class="info-label">Username: ${user.username}</div>
            <div class="info-value">฿${Number(user.credit || 0).toLocaleString()}</div>
          </div>

          <div class="tab-wrapper">
            <button id="t-fin" class="tab-item active" onclick="switchInspectorTab('fin')">FINANCIALS</button>
            <button id="t-bet" class="tab-item" onclick="switchInspectorTab('bet')">BET HISTORY</button>
          </div>

          <div id="box-fin">${txHtml}</div>
          <div id="box-bet" style="display:none;">${betHtml}</div>
        `,
        customClass: { popup: 'rounded-[2rem]' }
      });
    } catch (err) {
      Swal.fire("Error", "เกิดข้อผิดพลาดในการดึงข้อมูล", "error");
    }
  };

  // --- 4. ฟังก์ชันปรับเครดิต ---
  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: '<span style="font-weight:900;">ADJUST CREDIT</span>',
      input: 'number',
      inputLabel: `Username: ${user.username}`,
      inputPlaceholder: 'ใส่จำนวนเงิน...',
      showCancelButton: true,
      confirmButtonColor: '#127447',
      confirmButtonText: 'CONFIRM',
      customClass: { popup: 'rounded-[2rem]' }
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
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-10 font-sans">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black italic text-[#127447] tracking-tighter uppercase">Members</h1>
          <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase mt-2">Member Database Management</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#127447] outline-none font-bold"
              placeholder="Search by username or phone..."
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

      {/* User Grid */}
      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin inline text-[#127447]" size={40} />
            <p className="mt-4 font-bold text-zinc-400 uppercase tracking-widest">Loading Database...</p>
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