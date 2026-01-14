"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { apiFetch } from "@/lib/api";
import Swal from "sweetalert2";
import { Loader2, Search, Calendar, X, Trash2 } from "lucide-react";

const fetcher = (url: string) => apiFetch(url).then((res) => res.json());

export default function BetslipHistoryPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState("");
  const [searchUsername, setSearchUsername] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  // Fetch betslips
  const { data: betslips, mutate, isLoading } = useSWR(
    "/admin/betslips",
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const filteredBetslips = useMemo(() => {
    if (!betslips || !Array.isArray(betslips)) return [];
    
    let filtered = betslips;

    // Filter by date
    if (selectedDate) {
      const filterDate = new Date(selectedDate).toDateString();
      filtered = filtered.filter((bs: any) => {
        const betDate = new Date(bs.created_at || bs.bet_date).toDateString();
        return betDate === filterDate;
      });
    }

    // Filter by username
    if (searchUsername.trim()) {
      const term = searchUsername.toLowerCase();
      filtered = filtered.filter((bs: any) =>
        bs.user?.username?.toLowerCase().includes(term) ||
        bs.username?.toLowerCase().includes(term)
      );
    }

    // Filter by status/type (Maung/Body)
    if (selectedFilter) {
      // Assuming selectedFilter could be status or type
      filtered = filtered.filter((bs: any) => {
        // Adjust this based on your data structure
        return bs.status === selectedFilter || bs.type === selectedFilter;
      });
    }

    return filtered;
  }, [betslips, selectedDate, searchUsername, selectedFilter]);

  const handleDelete = async (betslip: any) => {
    const result = await Swal.fire({
      title: `<span class="italic font-black text-xl uppercase">Delete Betslip?</span>`,
      text: `ยืนยันการลบ betslip #${betslip.voucher_id || betslip.id} (ไม่สามารถกู้คืนได้)`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'DELETE',
      cancelButtonText: 'CANCEL',
      customClass: { popup: 'rounded-[2.5rem]' }
    });

    if (result.isConfirmed) {
      try {
        const res = await apiFetch(`/admin/betslips/${betslip.id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          mutate();
          Swal.fire({ icon: 'success', title: 'Deleted', timer: 1000, showConfirmButton: false });
        } else {
          Swal.fire("Error", "ไม่สามารถลบ betslip ได้", "error");
        }
      } catch (e) {
        Swal.fire("System Error", "ติดต่อ Server ไม่ได้", "error");
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-[1000] uppercase italic tracking-tighter text-slate-900">
            Betslip <span className="text-emerald-600">History</span>
          </h1>
        </div>
      </div>

      {/* Filter/Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
        {/* Date and Username Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Date Input */}
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

          {/* Search Button for Date */}
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search size={16} />
            Search
          </button>
        </div>

        {/* Username Search and Filter Buttons Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Username Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="text"
              autoComplete="off"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-bold text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all"
              placeholder="Search by username"
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedFilter(selectedFilter === "maung" ? null : "maung")}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm whitespace-nowrap ${
                selectedFilter === "maung"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Maung
            </button>
            <button
              onClick={() => setSelectedFilter(selectedFilter === "body" ? null : "body")}
              className={`px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-sm whitespace-nowrap ${
                selectedFilter === "body"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              Body
            </button>
          </div>

          {/* Search Button for Username */}
          <button
            onClick={() => {}}
            className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Search size={16} />
            Search
          </button>
        </div>
      </div>

      {/* Betslip History Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-[1000] text-slate-600 uppercase tracking-widest border-b border-slate-200">
                <th className="p-4 sm:p-6 px-4 sm:px-8">NAME - VOUCHER ID</th>
                <th className="p-4 sm:p-6">REMARK</th>
                <th className="p-4 sm:p-6 text-right">TOTAL AMOUNT</th>
                <th className="p-4 sm:p-6 text-right">BET DATE</th>
                <th className="p-4 sm:p-6 text-center px-4 sm:px-8">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-16 sm:p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="animate-spin text-emerald-600" size={48} />
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest">
                        Loading Betslips...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredBetslips.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 sm:p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">
                        {searchUsername || selectedDate ? "No betslips found" : "No betslips available"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBetslips.map((betslip: any) => {
                  const username = betslip.user?.username || betslip.username || "unknown";
                  const voucherId = betslip.voucher_id || betslip.id || "-";
                  const remark = betslip.status || betslip.remark || "INCOMPLETE";
                  const isIncomplete = remark.toUpperCase() === "INCOMPLETE";

                  return (
                    <tr key={betslip.id} className="hover:bg-slate-50/50 transition-all border-b border-slate-100">
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">{username}</span>
                          <span className="text-xs text-slate-500 font-bold">#{voucherId}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          isIncomplete
                            ? "bg-rose-50 text-rose-600 border border-rose-200"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}>
                          {remark}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                        <span className="text-sm font-[1000] text-slate-900">
                          {Number(betslip.total_amount || betslip.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                        <span className="text-sm font-bold text-slate-600">
                          {formatDate(betslip.created_at || betslip.bet_date)}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                        <button
                          onClick={() => handleDelete(betslip)}
                          className="px-4 py-2 bg-rose-500 text-white rounded-lg font-black text-[9px] uppercase tracking-tight hover:bg-rose-600 transition-all shadow-sm flex items-center justify-center gap-2 mx-auto"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
