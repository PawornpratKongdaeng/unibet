"use client";
import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Loader2, ArrowLeft, KeyRound, Calendar, X, Network } from "lucide-react";

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

  // Fetch user details
  const { data: user, isLoading: userLoading } = useSWR(
    userId ? `/admin/users/${userId}` : null,
    fetcher,
    {
      onError: (error) => {
        console.error("Error fetching user:", error);
      },
      revalidateOnFocus: false,
    }
  );

  // Fallback to list if needed (Logic เดิมของคุณ)
  const { data: usersList } = useSWR(
    user ? null : `/admin/users`,
    fetcher,
    { revalidateOnFocus: false }
  );

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
    { revalidateOnFocus: false }
  );

  // ✅ Helper Function: แยกประเภท In/Out
  const getFlowType = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    // เงินเข้า: ฝาก, ชนะ, รับโบนัส
    if (['deposit', 'win', 'reward', 'bonus', 'in'].includes(lowerType)) {
      return 'IN';
    }
    // เงินออก: ถอน, แทง
    if (['bet', 'withdraw', 'maung_bet', 'out'].includes(lowerType)) {
      return 'OUT';
    }
    return 'IN'; // Default
  };

  // ✅ Calculation Logic: คำนวณ Balance ย้อนหลัง
  const processedTransactions = useMemo(() => {
    if (!transactions || !Array.isArray(transactions) || !foundUser) return [];

    // 1. เรียงวันที่ ล่าสุด -> เก่าสุด
    const sortedDocs = [...transactions].sort((a: any, b: any) => {
      return new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime();
    });

    // 2. ตั้งต้นด้วย Credit ปัจจุบันของผู้ใช้
    let currentBalanceCalc = Number(foundUser.credit || 0);

    // 3. วนลูปเพื่อคำนวณและแปะค่า Balance ณ ตอนนั้นเข้าไป
    return sortedDocs.map((tx) => {
      const flow = getFlowType(tx.transaction_type || tx.type);
      const amount = Number(tx.amount || 0);
      const isAPIBalanceAvailable = tx.balance !== undefined && tx.balance !== null;

      // Balance ณ บรรทัดนี้ (ถ้า API ส่งมาให้ใช้ API, ถ้าไม่มีให้ใช้ค่าที่คำนวณ)
      const rowBalance = isAPIBalanceAvailable ? Number(tx.balance) : currentBalanceCalc;

      // เตรียมค่าสำหรับรอบถัดไป (ซึ่งคือรายการที่เก่ากว่านี้)
      // ถ้าบรรทัดนี้เงินเข้า (+) แปลว่าก่อนหน้านี้เงินต้องน้อยกว่านี้ -> ลบออก
      // ถ้าบรรทัดนี้เงินออก (-) แปลว่าก่อนหน้านี้เงินต้องมากกว่านี้ -> บวกกลับ
      if (!isAPIBalanceAvailable) {
         if (flow === 'IN') {
             currentBalanceCalc -= amount;
         } else {
             currentBalanceCalc += amount;
         }
      }

      return {
        ...tx,
        flow, // IN หรือ OUT
        displayBalance: rowBalance,
        displayAmount: amount
      };
    });

  }, [transactions, foundUser]);

  // คำนวณยอดรวมสุทธิของช่วงเวลาที่เลือก
  const totalNetChange = useMemo(() => {
     return processedTransactions.reduce((acc, tx) => {
         return tx.flow === 'IN' ? acc + tx.displayAmount : acc - tx.displayAmount;
     }, 0);
  }, [processedTransactions]);

  // ... (Keep existing handlers like handlePasswordChange, formatDate) ...
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
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
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
          <div className="flex-1 w-full">
            <h1 className="text-2xl sm:text-3xl font-[1000] uppercase italic tracking-tighter text-slate-900 mb-6 flex items-center gap-3">
              <span>{displayUser.name || displayUser.username}</span>
              {displayUser.role === 'admin' && (
                  <span className="px-3 py-1 bg-rose-100 text-rose-600 text-[10px] rounded-full not-italic tracking-normal font-black">ADMIN</span>
              )}
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-4">
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
                <p className="text-sm font-bold text-slate-900 uppercase">{displayUser.role || "member"}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Balance</p>
                <p className="text-lg font-[1000] text-emerald-600">{Number(displayUser.credit || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Created</p>
                <p className="text-sm font-bold text-slate-900">{formatDate(displayUser.created_at)}</p>
              </div>

              {/* Agent / Parent Info */}
              <div className="relative">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Network size={12} /> Agent / Parent
                </p>
                {displayUser.parent ? (
                  <div className="flex flex-col bg-slate-50 p-2 rounded-lg border border-slate-100 -ml-2">
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-2">
                      {displayUser.parent.username}
                      <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400 font-normal">
                        ID: {displayUser.parent.id}
                      </span>
                    </p>
                    {displayUser.parent.phone && (
                        <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            Tel: {displayUser.parent.phone}
                        </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-300 italic flex items-center gap-1">
                      No Parent (Root Node)
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handlePasswordChange}
              className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-rose-600 transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-2"
            >
              <KeyRound size={16} />
              Change Pass
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Filter */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="relative flex-1 w-full">
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
                <th className="p-4 sm:p-6 text-right">BALANCE</th>
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
              ) : processedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 sm:p-24 text-center text-slate-400 font-black uppercase text-xs tracking-widest italic">
                    No transactions found
                  </td>
                </tr>
              ) : (
                processedTransactions.map((tx: any, index: number) => {
                  const isIn = tx.flow === 'IN';
                  
                  return (
                    <tr key={tx.id || index} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <span className="text-sm font-bold text-slate-700">{tx.user?.username || displayUser.username || "-"}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <span className="text-sm font-bold text-slate-600">{tx.action_by || tx.created_by?.username || "-"}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <span className="text-sm font-black text-slate-700 capitalize">
                           {tx.transaction_type === 'win' ? 'Maung (Win)' : (tx.transaction_type || tx.type || "-")}
                        </span>
                      </td>
                      
                      {/* STATUS BADGE */}
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider w-12 ${
                            isIn
                            ? "bg-emerald-100 text-emerald-600 border border-emerald-200"
                            : "bg-rose-100 text-rose-600 border border-rose-200"
                          }`}>
                          {tx.flow}
                        </span>
                      </td>
                      
                      {/* AMOUNT */}
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                        <span className={`text-sm font-[1000] ${isIn ? "text-emerald-600" : "text-rose-600"}`}>
                          {isIn ? "+" : "-"}{tx.displayAmount.toLocaleString()}
                        </span>
                      </td>
                      
                      {/* BALANCE */}
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                        <span className="text-sm font-[1000] text-slate-900">
                          {tx.displayBalance.toLocaleString()}
                        </span>
                      </td>
                      
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                        <span className="text-sm font-bold text-slate-600">{formatDate(tx.created_at || tx.date)}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Total Summary */}
        {processedTransactions.length > 0 && (
          <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-slate-600 uppercase tracking-widest">Net Change (Selected Period)</span>
              <span className={`text-lg font-[1000] ${totalNetChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalNetChange > 0 ? "+" : ""}{totalNetChange.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}