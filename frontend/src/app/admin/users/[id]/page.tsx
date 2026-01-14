"use client";
import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Loader2, Search, ArrowLeft, KeyRound, Calendar, X } from "lucide-react";

const fetcher = async (url: string) => {
  const res = await apiFetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      return null;
    }
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.id as string;
  const [selectedDate, setSelectedDate] = useState("");

  // Fetch user details - try multiple endpoints
  const { data: user, isLoading: userLoading, error: userError } = useSWR(
    userId ? `/admin/users/${userId}` : null,
    fetcher,
    {
      onError: (error) => {
        console.error("Error fetching user:", error);
      },
      revalidateOnFocus: false,
    }
  );

  // If user endpoint fails, try to get from users list
  const { data: usersList } = useSWR(
    user ? null : `/admin/users`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Find user from list if direct fetch failed
  const foundUser = useMemo(() => {
    if (user) return user;
    if (usersList && Array.isArray(usersList) && userId) {
      return usersList.find((u: any) => u.id === Number(userId) || u.id === userId);
    }
    return null;
  }, [user, usersList, userId]);

  // Fetch transactions
  const { data: transactions, isLoading: transactionsLoading } = useSWR(
    foundUser && userId ? `/admin/users/${userId}/transactions${selectedDate ? `?date=${selectedDate}` : ""}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const filteredTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions)) return [];
    return transactions;
  }, [transactions]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum: number, tx: any) => {
      return sum + (Number(tx.amount) || 0);
    }, 0);
  }, [filteredTransactions]);

  const handlePasswordChange = async () => {
    const { value: formValues } = await Swal.fire({
      title: `<div class="text-left"><p class="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Security</p><p class="text-xl font-[1000] text-zinc-800 uppercase italic">Password Change</p></div>`,
      html: `
        <div class="p-2 text-left space-y-4">
          <input id="swal-password" type="password" class="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none" placeholder="New Password">
          <input id="swal-confirm" type="password" class="w-full p-4 bg-zinc-50 border-2 border-zinc-100 rounded-xl font-bold text-sm outline-none" placeholder="Confirm Password">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'CHANGE PASSWORD',
      confirmButtonColor: '#ef4444',
      customClass: { popup: 'rounded-[2.5rem]' },
      preConfirm: () => {
        const password = (document.getElementById('swal-password') as HTMLInputElement).value;
        const confirm = (document.getElementById('swal-confirm') as HTMLInputElement).value;
        if (!password || password.length < 6) return Swal.showValidationMessage('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        if (password !== confirm) return Swal.showValidationMessage('รหัสผ่านไม่ตรงกัน');
        return { password };
      }
    });

    if (formValues) {
      try {
        const res = await apiFetch(`/admin/users/${userId}/password`, {
          method: "PATCH",
          body: JSON.stringify(formValues),
        });
        if (res.ok) {
          Swal.fire({ icon: 'success', title: 'Password Changed', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire("Error", "ไม่สามารถเปลี่ยนรหัสผ่านได้", "error");
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const isLoading = userLoading && !foundUser;
  const displayUser = foundUser;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-slate-400 font-black uppercase text-sm tracking-widest">User not found</p>
        <p className="text-xs text-slate-500">User ID: {userId}</p>
        <button
          onClick={() => router.push("/admin/users")}
          className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all"
        >
          Go Back to Users
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">Back to Users</span>
      </button>

      {/* User Profile Section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-[1000] uppercase italic tracking-tighter text-slate-900 mb-6">
              Name - {displayUser.name || displayUser.username}
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Name</p>
                <p className="text-sm font-bold text-slate-900">{displayUser.username || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                <p className="text-sm font-bold text-slate-900">{displayUser.phone || "-"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Roles</p>
                <p className="text-sm font-bold text-slate-900">{displayUser.role || "normal"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                <p className="text-lg font-[1000] text-emerald-600">{Number(displayUser.credit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created Time</p>
                <p className="text-sm font-bold text-slate-900">{formatDate(displayUser.created_at)}</p>
              </div>
              {displayUser.parent && (
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parent</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {displayUser.parent.username || displayUser.parent.name} {displayUser.parent.phone ? `(${displayUser.parent.phone})` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {}}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm whitespace-nowrap"
            >
              Transactions
            </button>
            <button
              onClick={handlePasswordChange}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-rose-600 transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              Password Change
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="relative flex-1">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-[1000] text-slate-600 uppercase tracking-widest border-b border-slate-200">
                <th className="p-4 sm:p-6 px-4 sm:px-8">NAME</th>
                <th className="p-4 sm:p-6">ACTION BY</th>
                <th className="p-4 sm:p-6">TYPE</th>
                <th className="p-4 sm:p-6 text-center">STATUS</th>
                <th className="p-4 sm:p-6 text-right">AMOUNT</th>
                <th className="p-4 sm:p-6 text-right">CURRENT AMOUNT</th>
                <th className="p-4 sm:p-6 text-right px-4 sm:px-8">DATE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactionsLoading ? (
                <tr>
                  <td colSpan={7} className="p-16 sm:p-24 text-center">
                    <Loader2 className="animate-spin inline text-emerald-600" size={32} />
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 sm:p-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">
                    No transactions found
                  </td>
                </tr>
              ) : (
                (() => {
                  // Sort transactions by date (oldest first) and calculate running balance forward
                  const sortedTransactions = [...filteredTransactions].sort((a: any, b: any) => {
                    const dateA = new Date(a.created_at || a.date || 0).getTime();
                    const dateB = new Date(b.created_at || b.date || 0).getTime();
                    return dateA - dateB; // Oldest first
                  });
                  
                  // Calculate running balance starting from current balance minus total
                  // Then add/subtract transactions to show balance after each transaction
                  const totalIn = sortedTransactions
                    .filter((tx: any) => tx.type === "IN" || tx.type === "deposit" || (tx.amount && Number(tx.amount) > 0))
                    .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount || 0)), 0);
                  const totalOut = sortedTransactions
                    .filter((tx: any) => !(tx.type === "IN" || tx.type === "deposit" || (tx.amount && Number(tx.amount) > 0)))
                    .reduce((sum: number, tx: any) => sum + Math.abs(Number(tx.amount || 0)), 0);
                  
                  // Start from initial balance (current - net transactions)
                  let runningBalance = Number(displayUser.credit || 0) - (totalIn - totalOut);
                  
                  return sortedTransactions.map((tx: any, index: number) => {
                    const isIn = tx.type === "IN" || tx.type === "deposit" || (tx.amount && Number(tx.amount) > 0);
                    const amount = Math.abs(Number(tx.amount || 0));
                    
                    // Update running balance after this transaction
                    if (isIn) {
                      runningBalance += amount;
                    } else {
                      runningBalance -= amount;
                    }
                    
                    return (
                      <tr key={tx.id || index} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className="text-sm font-bold text-slate-700">{tx.user?.username || displayUser.username || "-"}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className="text-sm font-bold text-slate-600">{tx.action_by || tx.created_by?.username || "-"}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5">
                          <span className="text-sm font-bold text-slate-700">{tx.transaction_type || tx.type || "-"}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            isIn 
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                              : "bg-rose-50 text-rose-600 border border-rose-200"
                          }`}>
                            {isIn ? "IN" : "OUT"}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <span className={`text-sm font-[1000] ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                            {amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <span className="text-sm font-[1000] text-slate-900">
                            {runningBalance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                          <span className="text-sm font-bold text-slate-600">{formatDate(tx.created_at || tx.date)}</span>
                        </td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Total */}
        {filteredTransactions.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Total</span>
              <span className="text-lg font-[1000] text-slate-900">{totalAmount.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
