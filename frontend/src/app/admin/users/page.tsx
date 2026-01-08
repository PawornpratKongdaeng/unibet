"use client";
import { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { useInspectorTab } from "../../../../hooks/useInspectorTab"; 
import UserCard from "@/components/UserCard";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);
  
  useInspectorTab();

  // --- 1. เพิ่มผู้ใช้ใหม่ ---
  const handleAddUser = async () => {
    const { value: formValues } = await Swal.fire({
      title: '<span class="text-2xl font-black text-[#127447]">ADD NEW MEMBER</span>',
      html: `
        <div class="text-left font-sans p-2">
          <label class="block text-[10px] font-black text-zinc-400 uppercase mb-1">Username</label>
          <input id="swal-username" class="w-full p-3 border-2 border-zinc-100 rounded-xl focus:border-[#127447] outline-none font-bold mb-4">
          <label class="block text-[10px] font-black text-zinc-400 uppercase mb-1">Password</label>
          <input id="swal-password" type="password" class="w-full p-3 border-2 border-zinc-100 rounded-xl focus:border-[#127447] outline-none font-bold">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CREATE ACCOUNT',
      confirmButtonColor: '#127447',
      customClass: { popup: 'rounded-[2rem]' },
      preConfirm: () => ({
        username: (document.getElementById('swal-username') as HTMLInputElement).value,
        password: (document.getElementById('swal-password') as HTMLInputElement).value,
      })
    });

    if (formValues?.username) {
      const res = await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(formValues) });
      if (res.ok) { mutate(); Swal.fire("Success", "User created", "success"); }
    }
  };

  // --- 2. ปรับเครดิต ---
  const handleCredit = async (user: any) => {
    const { value: amount } = await Swal.fire({
      title: 'ADJUST CREDIT',
      text: `Username: ${user.username}`,
      input: 'number',
      inputAttributes: { step: "1" },
      showCancelButton: true,
      confirmButtonColor: '#127447',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (amount) {
      const res = await apiFetch(`/admin/users/${user.id}/credit`, {
        method: "POST",
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });
      if (res.ok) { mutate(); Swal.fire("Updated", "Credit adjusted", "success"); }
    }
  };

  // --- 3. ลบผู้ใช้ ---
  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "คุณต้องการลบสมาชิกท่านนี้ใช่หรือไม่?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e11d48',
      confirmButtonText: 'Yes, Delete'
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/users/${id}`, { method: "DELETE" });
      if (res.ok) { mutate(); Swal.fire("Deleted", "User removed", "success"); }
    }
  };

  // --- 4. ดูรายละเอียด (Inspector) ---
  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "กำลังดึงข้อมูล...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      // 1. ดึงข้อมูลแบบตรวจสอบสถานะ Response
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`).catch(e => { console.error("TX Error:", e); return null; }),
        apiFetch(`/admin/users/${user.id}/bets`).catch(e => { console.error("Bet Error:", e); return null; })
      ]);

      // 2. ฟังก์ชันช่วย Parse JSON ป้องกัน Error กรณี Body ว่างหรือไม่ใช่ JSON
      const safeParse = async (res: Response | null) => {
        if (!res || !res.ok) return [];
        try {
          const text = await res.text();
          return text ? JSON.parse(text) : [];
        } catch (e) {
          console.error("JSON Parse Error:", e);
          return [];
        }
      };

      const transactions = await safeParse(txRes);
      const bets = await safeParse(betRes);

      // --- Debug Log: ตรวจดูว่าข้อมูลที่มาจริง ๆ หน้าตาเป็นอย่างไร ---
      console.log("Fetched Transactions:", transactions);
      console.log("Fetched Bets:", bets);

      // 3. ตรวจสอบว่าข้อมูลเป็น Array ก่อนใช้ .map()
      const txData = Array.isArray(transactions) ? transactions : [];
      const betData = Array.isArray(bets) ? bets : [];

      const txHtml = txData.length > 0 ? `
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
              ${txData.map((tx: any) => {
                const dateObj = new Date(tx.created_at);
                const isPlus = tx.type?.toLowerCase() === 'payout' || tx.type?.toLowerCase() === 'deposit';
                return `
                <tr>
                  <td><div class="bold">${dateObj.toLocaleDateString('th-TH')}</div><div class="small-grey">${dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div></td>
                  <td>
                    <div class="bold" style="color:${isPlus ? '#10b981' : '#f43f5e'}">${(tx.type || 'N/A').toUpperCase()}</div>
                    ${tx.home_team ? `<div class="small-green">⚽ ${tx.home_team} vs ${tx.away_team}</div>` : ''}
                  </td>
                  <td style="text-align:right;" class="bold-large">฿${Number(tx.amount || 0).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="badge-status">${(tx.status || 'PENDING').toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-box">ไม่พบข้อมูลธุรกรรม</div>';

      const betHtml = betData.length > 0 ? `
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
              ${betData.map((bet: any) => {
                const resColor = bet.result === 'win' ? '#10b981' : (bet.result === 'loss' ? '#f43f5e' : '#94a3b8');
                return `
                <tr>
                  <td><div class="bold">${bet.home_team || 'Unknown'} vs ${bet.away_team || 'Unknown'}</div><div class="small-grey">${new Date(bet.created_at).toLocaleDateString('th-TH')}</div></td>
                  <td style="text-align:center;"><span class="pick-tag">${bet.pick || '-'}</span></td>
                  <td style="text-align:right;" class="bold">฿${Number(bet.amount || 0).toLocaleString()}</td>
                  <td style="text-align:center;"><span class="res-tag" style="background:${resColor}">${(bet.result || 'PENDING').toUpperCase()}</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>` : '<div class="empty-box">ไม่พบประวัติการเดิมพัน</div>';

      // 4. แสดงผล Inspector
      Swal.fire({
        title: `<div class="insp-title">USER INSPECTOR</div>`,
        width: '900px',
        confirmButtonText: "CLOSE",
        confirmButtonColor: "#127447",
        html: `
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

    } catch (err: any) {
      console.error("Inspector Error Details:", err);
      Swal.fire("Error", `เกิดข้อผิดพลาด: ${err.message}`, "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 lg:p-10 font-sans">
      <header className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black italic text-[#127447] tracking-tighter uppercase">Members</h1>
          <p className="text-zinc-400 font-bold text-xs tracking-widest uppercase mt-2">Database Management</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              className="w-full bg-white border-none rounded-2xl py-4 pl-12 pr-6 shadow-sm focus:ring-2 focus:ring-[#127447] outline-none font-bold"
              placeholder="Search username..."
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handleAddUser} className="bg-[#127447] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase shadow-lg hover:bg-black transition-all flex items-center gap-2">
            <UserPlus size={18} /> Add User
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-20 text-center"><Loader2 className="animate-spin inline text-[#127447]" size={40} /></div>
        ) : (
          filteredUsers.map((user: any) => (
            <UserCard 
              key={user.id} 
              user={user} 
              onView={handleViewDetails} 
              onCredit={handleCredit}
              onDelete={handleDelete}
              onBan={() => {/* Logic for Ban */}}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Helper HTML Generators ---

function buildTransactionRows(txs: any[]) {
  if (!txs.length) return '<tr><td colspan="4" class="p-10 text-center text-zinc-400 font-bold">No transactions found</td></tr>';
  return txs.map(tx => `
    <tr class="border-b border-zinc-50">
      <td class="p-4 text-xs font-bold text-zinc-500">${new Date(tx.created_at).toLocaleString()}</td>
      <td class="p-4 font-black text-[#127447] uppercase">${tx.type}</td>
      <td class="p-4 font-black text-right">฿${Number(tx.amount).toLocaleString()}</td>
      <td class="p-4 text-center"><span class="bg-zinc-100 px-2 py-1 rounded text-[10px] font-black">${tx.status}</span></td>
    </tr>
  `).join('');
}

function generateInspectorHTML(user: any, txs: any[], bets: any[]) {
  return `
    <style>
      .insp-table { width: 100%; border-collapse: collapse; text-align: left; }
      .insp-table th { background: #f8f9fa; padding: 12px; font-size: 10px; font-weight: 900; color: #999; text-transform: uppercase; }
      .tab-item { transition: all 0.3s; border-bottom: 4px solid transparent; }
      .tab-item.active { color: #127447; border-color: #127447; }
    </style>
    <div class="bg-[#f0fdf4] border-2 border-[#127447] rounded-3xl p-6 mb-6 flex justify-between items-center">
      <div>
        <p class="text-[10px] font-black text-[#127447] uppercase">Current Balance</p>
        <h2 class="text-4xl font-black text-[#127447]">฿${Number(user.credit || 0).toLocaleString()}</h2>
      </div>
      <div class="text-right text-[#127447] font-bold">UID: ${user.id.slice(0,8)}</div>
    </div>
    <div class="flex gap-6 border-b-2 border-zinc-100 mb-4">
      <button id="t-fin" class="tab-item active flex-1 py-4 font-black text-xs uppercase" onclick="switchInspectorTab('fin')">Financials</button>
      <button id="t-bet" class="tab-item flex-1 py-4 font-black text-xs uppercase" onclick="switchInspectorTab('bet')">Bet History</button>
    </div>
    <div id="box-fin" class="max-h-[400px] overflow-y-auto">
      <table class="insp-table">
        <thead><tr><th>Date</th><th>Type</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th></tr></thead>
        <tbody>${buildTransactionRows(txs)}</tbody>
      </table>
    </div>
    <div id="box-bet" style="display:none" class="max-h-[400px] overflow-y-auto">
      <p class="p-10 text-center font-bold text-zinc-300">Bet history data implementation...</p>
    </div>
  `;
}