export function renderInspector(user: any, txs: any[], bets: any[]) {
  const safeTxs = Array.isArray(txs) ? txs : [];
  const safeBets = Array.isArray(bets) ? bets : [];

  const txRows = safeTxs.map(t => `
    <tr class="border-b"><td class="p-3">${new Date(t.created_at).toLocaleDateString()}</td><td class="p-3 uppercase font-black ${t.type === 'deposit' ? 'text-emerald-500' : 'text-rose-500'}">${t.type}</td><td class="p-3 text-right">฿${Number(t.amount).toLocaleString()}</td></tr>
  `).join("");

  const betRows = safeBets.map(b => `
    <tr class="border-b"><td class="p-3">${b.game_name || 'N/A'}</td><td class="p-3 text-right font-black ${b.payout >= 0 ? 'text-emerald-500' : 'text-rose-500'}">฿${Number(b.payout).toLocaleString()}</td></tr>
  `).join("");

  return `
    <style>
      .tab-btn { flex:1; padding:12px; font-weight:900; font-size:9px; border-radius:12px; text-transform:uppercase; transition:all 0.3s; border:none; cursor:pointer; }
      .box-container { max-height:400px; overflow-y:auto; border-radius:20px; border:1px solid #f1f1f4; background:white; margin-top:15px; }
      .insp-head { background:#f8f9fa; padding:10px; font-size:8px; font-weight:900; color:#a1a1aa; text-transform:uppercase; position:sticky; top:0; z-index:10; }
    </style>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
      <div class="bg-[#f0fdf4] p-5 rounded-[1.5rem] border border-[#127447]/10">
        <p class="text-[8px] font-black text-[#127447] uppercase mb-1">Total Credit</p>
        <h3 class="text-2xl font-black text-[#127447]">฿${Number(user.credit || 0).toLocaleString()}</h3>
      </div>
      <div class="bg-zinc-900 p-5 rounded-[1.5rem] text-white">
        <p class="text-[8px] font-black text-zinc-500 uppercase mb-1">Status</p>
        <h3 class="text-lg font-black uppercase italic">${user.status || "Active"}</h3>
      </div>
      <button onclick="window.switchTab('sec')" class="bg-rose-500 text-white rounded-2xl font-black text-[9px] uppercase">Security Control</button>
    </div>
    <div class="flex gap-2 p-1.5 bg-zinc-100 rounded-[1.2rem] mb-4">
      <button id="btn-fin" onclick="window.switchTab('fin')" class="tab-btn bg-[#127447] text-white">Finance</button>
      <button id="btn-bet" onclick="window.switchTab('bet')" class="tab-btn">Bets</button>
      <button id="btn-sec" onclick="window.switchTab('sec')" class="tab-btn">Settings</button>
    </div>
    <div id="box-fin" class="box-container text-left">
      <table class="w-full text-[10px]">
        <thead class="insp-head"><tr><th class="p-3">Date</th><th class="p-3">Type</th><th class="p-3 text-right">Amount</th></tr></thead>
        <tbody>${txRows}</tbody>
      </table>
    </div>
    <div id="box-bet" style="display:none" class="box-container text-left">
       <table class="w-full text-[10px]">
        <thead class="insp-head"><tr><th class="p-3">Game</th><th class="p-3 text-right">Payout</th></tr></thead>
        <tbody>${betRows}</tbody>
      </table>
    </div>
    <div id="box-sec" style="display:none" class="p-8 text-left bg-white rounded-[1.5rem]">
      <label class="block text-[9px] font-black text-zinc-400 uppercase mb-3">New Password</label>
      <div class="flex gap-3">
        <input id="new-pw" type="password" class="flex-1 p-4 bg-zinc-50 border rounded-xl" placeholder="Password">
        <button onclick="window.changePassword('${user.id}')" class="bg-black text-white px-8 rounded-xl font-black text-[10px]">UPDATE</button>
      </div>
    </div>
  `;
}