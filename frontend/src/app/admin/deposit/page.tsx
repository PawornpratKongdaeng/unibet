"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import {
  ArrowDownCircle, RefreshCcw, ImageIcon, User as UserIcon,
  XCircle, Info, ShieldCheck, Search, Calendar, Filter
} from "lucide-react";
import {
  FinanceCard,
  viewSlip, getFullImageUrl, Toast
} from "@/components/FinanceHelpers";

const fetcher = (url: string) => apiFetch(url).then(res => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

export default function DepositManagement() {
  const { data: pending, mutate, error, isLoading } = useSWR("/admin/transactions/pending", fetcher);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  // Filter Data Logic
  const list = React.useMemo(() => {
    if (!pending || !Array.isArray(pending)) return [];

    return pending.filter((tx: any) => {
      // 1. Filter only deposit types
      if (tx.type !== "deposit") return false;

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
        const id = tx.id?.toString() || "";
        const phone = userObj.phone || "";
        const name = (userObj.first_name + ' ' + userObj.last_name).toLowerCase();

        return username.includes(term) || id.includes(term) || phone.includes(term) || name.includes(term);
      }

      return true;
    });
  }, [pending, searchTerm, selectedDate]);

  const handleVerifySlip = async (tx: any) => {
    const result = await Swal.fire({
      title: `<p class="text-lg font-bold">Verify Payment Slip?</p>`,
      html: `
        <div class="text-left bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-[10px] font-bold text-slate-400 uppercase">Deposit Amount</span>
            <span class="text-xl font-black text-emerald-600">฿${tx.amount.toLocaleString()}</span>
          </div>
          <div class="p-3 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 mt-2">
            <Info size={16} className="text-amber-500 shrink-0" />
            <p class="text-[10px] font-bold text-amber-700 leading-relaxed">
              Clicking this button only <span class="underline">verifies the slip</span>. 
              The system will NOT automatically add funds. You must manually add credit to the customer later.
            </p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Slip Verified, Confirm',
      cancelButtonText: 'Cancel',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/transactions/approve-only/${tx.id}`, { method: 'POST' });
        if (res.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Slip Verified Successfully',
            text: 'Please check the amount and add credit in "User Management".',
            confirmButtonColor: '#0f172a',
            customClass: { popup: 'rounded-[2.5rem]' }
          });
          mutate();
        } else {
          const err = await res.json();
          Swal.fire('Error', err.error || 'Operation failed', 'error');
        }
      } catch (error) {
        Swal.fire('System Error', 'Server connection failed', 'error');
      }
    }
  };

  const handleReject = async (tx: any) => {
    const result = await Swal.fire({
      title: 'Reject Deposit?',
      text: "This transaction will be cancelled.",
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
        Toast.fire({ icon: 'success', title: 'Transaction rejected' });
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
            Deposit <span className="text-emerald-600">Verification</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            Verify payment slips <span className="text-emerald-500">(Funds are not added automatically)</span>
          </p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:text-emerald-600 active:scale-90 transition-all flex items-center gap-2"
        >
          <RefreshCcw size={18} className={isLoading ? "animate-spin" : ""} />
          <span className="text-[10px] font-black uppercase">Sync Data</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FinanceCard title="Waiting for Verification" value={list.reduce((acc: any, curr: any) => acc + curr.amount, 0)} icon={<ArrowDownCircle />} variant="emerald" />
        <FinanceCard title="Pending Requests" value={list.length} icon={<UserIcon />} variant="highlight" unit="" />
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by username, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400 font-bold text-slate-600"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 font-bold"
            />
          </div>
          <button
            onClick={() => { setSearchTerm(''); setSelectedDate(''); }}
            className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
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
                <th className="px-8 py-6 text-center">Amount</th>
                <th className="px-8 py-6 text-center">Date</th>
                <th className="px-8 py-6 text-center">Slip</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {list.length > 0 ? (
                list.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-inner">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="text-slate-900 font-black text-lg tracking-tight uppercase">
                            {tx.user?.username || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2">

                            {tx.user?.phone && (
                              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-md">Phone:{tx.user.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-emerald-600 font-black text-2xl tracking-tight">฿{tx.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                           {/* Format Date to EN-GB (DD/MM/YYYY) */}
                          {new Date(tx.created_at).toLocaleDateString('en-GB')}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">
                           {/* Format Time to EN-GB (24h) */}
                          {new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => viewSlip(tx.slip_url)}
                        className="w-14 h-14 rounded-2xl border-2 border-slate-100 overflow-hidden hover:border-emerald-500 transition-all mx-auto bg-slate-50 flex items-center justify-center relative group"
                      >
                        {tx.slip_url ? (
                          <img src={getFullImageUrl(tx.slip_url)!} className="w-full h-full object-cover" alt="slip" />
                        ) : (
                          <ImageIcon size={20} className="text-slate-300" />
                        )}
                        <div className="absolute inset-0 bg-black/20 hidden group-hover:flex items-center justify-center">
                          <Search size={16} className="text-white" />
                        </div>
                      </button>
                    </td>
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

                        {/* Confirm Button */}
                        <button
                          onClick={() => handleVerifySlip(tx)}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all duration-200 shadow-sm hover:shadow-emerald-200 active:scale-95"
                        >
                          <ShieldCheck size={16} strokeWidth={2.5} />
                          Confirm
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                      <Filter size={48} className="mb-4 opacity-20" />
                      <p className="text-sm font-bold">No transactions found matching your criteria</p>
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