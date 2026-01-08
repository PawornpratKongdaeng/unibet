"use client";
import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { UserPlus, Search, Loader2 } from "lucide-react";
import UserCard from "@/components/UserCard";

const fetcher = (url: string) => apiFetch(url).then(res => res.json());

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const { data: users, mutate, isLoading } = useSWR("/admin/users", fetcher);

  // --- 1. Global Tab Switcher for SweetAlert ---
  useEffect(() => {
    (window as any).switchInspectorTab = (tab: 'fin' | 'bet') => {
      const finBox = document.getElementById('box-fin');
      const betBox = document.getElementById('box-bet');
      const finBtn = document.getElementById('t-fin');
      const betBtn = document.getElementById('t-bet');

      if (tab === 'fin') {
        if (finBox) finBox.style.display = 'block';
        if (betBox) betBox.style.display = 'none';
        finBtn?.classList.add('active');
        betBtn?.classList.remove('active');
      } else {
        if (finBox) finBox.style.display = 'none';
        if (betBox) betBox.style.display = 'block';
        finBtn?.classList.remove('active');
        betBtn?.classList.add('active');
      }
    };
  }, []);

  const filteredUsers = Array.isArray(users) 
    ? users.filter((u: any) => u.username.toLowerCase().includes(search.toLowerCase()))
    : [];

  // --- 2. Action Handlers ---
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

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "Do you really want to delete this member?",
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

  const handleViewDetails = async (user: any) => {
    Swal.fire({
      title: "Fetching data...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const [txRes, betRes] = await Promise.all([
        apiFetch(`/admin/users/${user.id}/transactions`),
        apiFetch(`/admin/users/${user.id}/bets`)
      ]);

      const transactions = txRes.ok ? await txRes.json() : [];
      const bets = betRes.ok ? await betRes.json() : [];

      Swal.fire({
        title: `<div class="text-xs font-black text-zinc-400 uppercase tracking-widest">User Inspector</div>`,
        width: '800px',
        confirmButtonText: "CLOSE",
        confirmButtonColor: "#127447",
        html: generateInspectorHTML(user, transactions, bets),
        customClass: { popup: 'rounded-[2rem]' }
      });

    } catch (err: any) {
      Swal.fire("Error", "Failed to load user details", "error");
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
              onView={() => handleViewDetails(user)} 
              onCredit={() => handleCredit(user)}
              onDelete={() => handleDelete(user.id)}
              onBan={() => {}}
            />
          ))
        )}
      </div>
    </div>
  );
}

// --- Helper Functions for HTML Generation ---

function buildTransactionRows(txs: any[]) {
  if (!txs || txs.length === 0) return '<tr><td colspan="4" class="p-10 text-center text-zinc-400 font-bold">No financial records found</td></tr>';
  
  return txs.map(tx => {
    const type = tx.type?.toLowerCase();
    let typeLabel = tx.type;
    let colorClass = 'text-zinc-500';

    if (type === 'deposit') {
      typeLabel = 'DEPOSIT';
      colorClass = 'text-emerald-600';
    } else if (type === 'withdraw') {
      typeLabel = 'WITHDRAW';
      colorClass = 'text-rose-500';
    } else if (type === 'payout') {
      typeLabel = 'PAYOUT (WIN)';
      colorClass = 'text-blue-600';
    }

    const statusColor = tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                        tx.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700';

    return `
      <tr class="border-b border-zinc-50 text-[11px]">
        <td class="p-3">
          <div class="font-bold text-zinc-600">${new Date(tx.created_at).toLocaleDateString('en-US')}</div>
          <div class="text-[9px] text-zinc-400">${new Date(tx.created_at).toLocaleTimeString('en-US', { hour12: false })}</div>
        </td>
        <td class="p-3 font-black ${colorClass} uppercase">${typeLabel}</td>
        <td class="p-3 font-black text-right text-sm">฿${Number(tx.amount).toLocaleString()}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${statusColor}">
            ${tx.status || 'PENDING'}
          </span>
        </td>
      </tr>
    `;
  }).join('');
}

function buildBetRows(bets: any) {
  // รวมข้อมูลจากทั้ง singles และ parlays (รองรับโครงสร้าง Object จาก API)
  let betArray: any[] = [];
  if (Array.isArray(bets)) {
    betArray = bets;
  } else if (bets && (bets.parlays || bets.singles)) {
    betArray = [...(bets.parlays || []), ...(bets.singles || [])];
  }
  
  if (betArray.length === 0) return '<tr><td colspan="4" class="p-10 text-center text-zinc-400 font-bold">No betting history found</td></tr>';
  
  // เรียงลำดับตามวันที่ล่าสุด
  betArray.sort((a, b) => new Date(b.CreatedAt || b.created_at).getTime() - new Date(a.CreatedAt || a.created_at).getTime());

  return betArray.map(bet => {
    const dateStr = new Date(bet.CreatedAt || bet.created_at).toLocaleDateString();
    const status = (bet.status || 'pending').toLowerCase();
    const resColor = status === 'win' ? 'text-emerald-500' : (status === 'lost' ? 'text-rose-500' : 'text-zinc-400');
    
    // ตรวจสอบว่าเป็นสเต็ป (Mixplay) หรือไม่
    const items = bet.Items || bet.items || [];

    if (items.length > 0) {
      const itemsHtml = items.map((item: any) => `
        <div class="mb-2 p-2 bg-zinc-50 rounded border-l-2 border-[#127447]">
          <div class="font-bold text-[10px] uppercase">${item.home_team} vs ${item.away_team}</div>
          <div class="text-[9px] text-[#127447] font-black">เลือก: ${item.pick} @${item.odds}</div>
        </div>
      `).join('');

      return `
        <tr class="border-b border-zinc-100 bg-emerald-50/20">
          <td class="p-3">
             <div class="font-bold text-zinc-600">${dateStr}</div>
             <span class="text-[9px] bg-[#127447] text-white px-2 py-0.5 rounded-full font-black uppercase">Mixplay (${items.length} คู่)</span>
          </td>
          <td class="p-3">${itemsHtml}</td>
          <td class="p-3 font-black text-right text-sm">฿${Number(bet.amount).toLocaleString()}</td>
          <td class="p-3 text-center font-black ${resColor} uppercase">${status}</td>
        </tr>
      `;
    }

    // กรณีบอลเต็ง (Single)
    let displayPick = bet.pick;
    if (bet.pick?.toLowerCase() === 'home') displayPick = bet.home_team;
    if (bet.pick?.toLowerCase() === 'away') displayPick = bet.away_team;

    return `
      <tr class="border-b border-zinc-50 text-[11px]">
        <td class="p-3 font-bold text-zinc-600">${dateStr}</td>
        <td class="p-3">
          <div class="font-black text-zinc-800 uppercase leading-tight">${bet.home_team} vs ${bet.away_team}</div>
          <div class="text-[10px] text-[#127447] font-bold mt-1 uppercase">PICK: ${displayPick}</div>
        </td>
        <td class="p-3 font-black text-right text-sm">฿${Number(bet.amount).toLocaleString()}</td>
        <td class="p-3 text-center font-black ${resColor} uppercase">${status}</td>
      </tr>
    `;
  }).join('');
}

function generateInspectorHTML(user: any, txs: any[], bets: any[]) {
  return `
    <style>
      .insp-table { width: 100%; border-collapse: collapse; text-align: left; }
      .insp-table th { background: #f9fafb; padding: 12px 10px; font-size: 10px; font-weight: 900; color: #9ca3af; text-transform: uppercase; }
      .tab-item { transition: all 0.2s; border: 2px solid transparent; color: #9ca3af; border-radius: 8px; margin: 0 4px; cursor: pointer; }
      .tab-item.active { color: #127447; border-color: #127447; background: #f0fdf4; }
    </style>

    <div class="border-2 border-[#127447] rounded-[1.5rem] p-6 mb-6 flex justify-between items-center bg-white shadow-sm">
      <div class="text-left">
        <p class="text-[10px] font-black text-[#127447] uppercase tracking-wider">Current Balance</p>
        <h2 class="text-4xl font-black text-[#127447]">฿${Number(user.credit || 0).toLocaleString()}</h2>
      </div>
      <div class="text-right">
        <p class="text-[10px] font-black text-zinc-400 uppercase">Username</p>
        <div class="text-xl font-black text-zinc-800 italic">${user.username}</div>
      </div>
    </div>

    <div class="flex p-1 bg-zinc-100 rounded-xl mb-4">
      <button id="t-fin" class="tab-item active flex-1 py-3 font-black text-xs uppercase" onclick="switchInspectorTab('fin')">Financials</button>
      <button id="t-bet" class="tab-item flex-1 py-3 font-black text-xs uppercase" onclick="switchInspectorTab('bet')">Bet History</button>
    </div>

    <div id="box-fin" class="max-h-[400px] overflow-y-auto rounded-xl border border-zinc-50">
      <table class="insp-table">
        <thead>
          <tr><th>Date & Time</th><th>Type</th><th style="text-align:right">Amount</th><th style="text-align:center">Status</th></tr>
        </thead>
        <tbody>${buildTransactionRows(txs)}</tbody>
      </table>
    </div>

    <div id="box-bet" style="display:none" class="max-h-[400px] overflow-y-auto rounded-xl border border-zinc-50">
      <table class="insp-table">
        <thead>
          <tr><th>Match Detail</th><th>Selection</th><th style="text-align:right">Stake</th><th style="text-align:center">Result</th></tr>
        </thead>
        <tbody>${buildBetRows(bets)}</tbody>
      </table>
    </div>
  `;
}