"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { 
  ArrowUpCircle, RefreshCcw, Landmark, User as UserIcon, 
  XCircle, Copy, Search, Calendar, CheckCircle2, Filter
} from "lucide-react";
import { 
  FinanceCard, Toast 
} from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
});

export default function WithdrawManagement() {
  const { data: pending, mutate, error, isLoading } = useSWR("/admin/transactions/pending", fetcher);
  
  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter Data Logic
  const list = React.useMemo(() => {
    if (!pending || !Array.isArray(pending)) return [];

    return pending.filter((tx: any) => {
      // 1. Filter only withdraw types
      if (tx.type !== "withdraw") return false;

      // 2. Filter by Date
      if (selectedDate) {
        const txDate = new Date(tx.created_at).toISOString().split('T')[0];
        if (txDate !== selectedDate) return false;
      }

      // 3. Filter by Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const userObj = tx.user || {}; 
        const username = userObj.username?.toLowerCase() || "";
        const phone = userObj.phone || ""; 
        const accNum = tx.account_number || "";
        
        return username.includes(term) || phone.includes(term) || accNum.includes(term);
      }

      return true;
    });
  }, [pending, searchTerm, selectedDate]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Toast.fire({ icon: 'success', title: 'Account number copied' });
  };

  const handleApprove = async (tx: any) => {
    const result = await Swal.fire({
      title: `<p class="text-lg font-bold">Confirm Transfer?</p>`,
      html: `
        <div class="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4 space-y-4">
           <div class="flex justify-between items-center pb-4 border-b border-slate-200">
             <span class="text-xs font-bold text-slate-400 uppercase">Transfer Amount</span>
             <span class="text-2xl font-black text-rose-500">฿${tx.amount.toLocaleString()}</span>
           </div>
           
           <div class="space-y-2">
             <p class="text-[10px] font-bold text-slate-400 uppercase">Transfer To</p>
             <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                <div class="flex items-center gap-2 mb-1">
                    <span class="bg-slate-900 text-white text-[9px] font-bold px-1.5 rounded">${tx.bank_name}</span>
                    <span class="text-sm font-mono font-bold text-slate-700">${tx.account_number}</span>
                </div>
                <p class="text-xs font-medium text-slate-500">${tx.account_name}</p>
             </div>
           </div>

           <div class="p-3 bg-rose-50 rounded-2xl border border-rose-100 flex gap-3">
            <Landmark size={16} className="text-rose-500 shrink-0" />
            <p class="text-[10px] font-bold text-rose-700 leading-relaxed">
              Please ensure you have <span class="underline">actually transferred</span> the funds before clicking this button. The amount will be deducted, and the customer will be notified immediately.
            </p>
          </div>
        </div>
      `,
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'Transfer Confirmed',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/transactions/approve/${tx.id}`, { method: 'POST' });
      if (res.ok) {
        Toast.fire({ icon: 'success', title: 'Withdrawal approved successfully' });
        mutate();
      }
    }
  };

  const handleReject = async (tx: any) => {
    const result = await Swal.fire({
      title: 'Reject Withdrawal?',
      text: "Funds will be returned to the customer's wallet.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f43f5e',
      confirmButtonText: 'Confirm Reject',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      const res = await apiFetch(`/admin/transactions/reject/${tx.id}`, { method: 'POST' });
      if (res.ok) {
        Toast.fire({ icon: 'success', title: 'Request rejected successfully' });
        mutate();
      }
    }
  };

  if (error) return <div className="p-10 text-center font-bold text-rose-500 uppercase">Error loading data...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20 font-sans antialiased">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
        <div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
            Withdraw <span className="text-rose-500">Requests</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Customer withdrawal requests queue
          </p>
        </div>
        <button 
          onClick={() => mutate()} 
          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:text-rose-500 active:scale-90 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
          <span className="text-[10px] font-black uppercase">Sync Queue</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceCard title="Total Withdrawal Amount" value={list.reduce((acc:any, curr:any) => acc + curr.amount, 0)} icon={<ArrowUpCircle />} variant="rose" />
        <FinanceCard title="Pending Requests" value={list.length} icon={<Landmark />} variant="highlight" unit="" />
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
                type="text" 
                placeholder="Search username, phone, account no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-400 font-bold text-slate-600"
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-600 font-bold"
                />
            </div>
            <button 
                onClick={() => {setSearchTerm(''); setSelectedDate('');}}
                className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200"
            >
                Clear
            </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-6">User Details</th>
                <th className="px-8 py-6">Destination Bank</th>
                <th className="px-8 py-6 text-center">Amount</th>
                <th className="px-8 py-6 text-center">Date</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.length > 0 ? (
                list.map((tx: any) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* User Column */}
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-300 border border-rose-100">
                            <UserIcon size={20}/>
                          </div>
                          <div>
                            <p className="text-slate-900 font-black text-lg tracking-tight uppercase">
                                {tx.user?.username || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">ID: #{tx.id}</span>
                                {tx.user?.phone && (
                                    <span className="text-[12px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded-md">Phone:{tx.user.phone}</span>
                                )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Bank Info Column */}
                      <td className="px-8 py-6">
                         <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wide">
                                    {tx.bank_name}
                                </span>
                                <button 
                                    onClick={() => copyToClipboard(tx.account_number)}
                                    className="text-slate-300 hover:text-emerald-500 transition-colors"
                                    title="Copy Account Number"
                                >
                                    <Copy size={14}/>
                                </button>
                            </div>
                            <p className="text-sm font-black text-slate-800 font-mono tracking-wide">
                                {tx.account_number}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">
                                {tx.account_name}
                            </p>
                         </div>
                      </td>

                      {/* Amount Column */}
                      <td className="px-8 py-6 text-center">
                        <span className="text-rose-500 font-black text-2xl tracking-tight">฿{tx.amount.toLocaleString()}</span>
                      </td>

                      {/* Date Column */}
                      <td className="px-8 py-6 text-center">
                        <div className="inline-flex flex-col items-center">
                            {/* Changed to English/Universal Date Format (DD/MM/YYYY) */}
                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                                {new Date(tx.created_at).toLocaleDateString('en-GB')}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1">
                                {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                      </td>

                      {/* Actions Column - Soft UI Style */}
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                            {/* Reject Button */}
                            <button 
                                onClick={() => handleReject(tx)} 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider hover:bg-rose-600 hover:text-white transition-all duration-200 active:scale-95"
                            >
                                <XCircle size={16} strokeWidth={2.5} />
                                Reject
                            </button>

                            {/* Approve Button */}
                            <button 
                                onClick={() => handleApprove(tx)} 
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-emerald-200 active:scale-95"
                            >
                                <CheckCircle2 size={16} strokeWidth={2.5} />
                                Approve
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                 <tr>
                    <td colSpan={5}>
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Filter size={48} className="mb-4 opacity-20"/>
                            <p className="text-sm font-bold">No withdraw requests found</p>
                        </div>
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}