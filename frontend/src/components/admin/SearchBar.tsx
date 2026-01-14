"use client";
import { Search, UserPlus, RefreshCw } from "lucide-react";

interface SearchBarProps {
  search: string;
  setSearch: (val: string) => void;
  onAddUser: () => void;
  isValidating: boolean;
}

export const SearchBar = ({ search, setSearch, onAddUser, isValidating }: SearchBarProps) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-3xl md:text-5xl font-black text-[#127447] italic tracking-tighter uppercase">Accounts</h1>
        {isValidating && <RefreshCw size={18} className="animate-spin text-zinc-300" />}
      </div>
      <p className="text-zinc-400 text-[10px] font-bold uppercase mt-1 tracking-widest">Management Center</p>
    </div>
    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
        <input
          id="admin-user-search-input"
          name="prevent-autofill-search" 
          autoComplete="off" // แก้ปัญหาชื่อเด้งใส่ช่อง Search
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border-none shadow-sm font-bold text-sm outline-none focus:ring-2 focus:ring-[#127447]"
          placeholder="Search by username or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <button onClick={onAddUser} className="bg-[#127447] text-white px-6 py-3.5 rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 hover:bg-[#0e5c38] transition-all active:scale-95">
        <UserPlus size={18} /> ADD NEW
      </button>
    </div>
  </div>
);