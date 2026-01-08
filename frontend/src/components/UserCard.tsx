import { Phone, Wallet, Eye, Trash2, Ban } from "lucide-react";

// 1. กำหนด Interface เพื่อความปลอดภัยของข้อมูล
interface UserCardProps {
  user: {
    id: string;
    username: string;
    phone?: string;
    credit: number;
    status: 'Active' | 'Banned' | string;
  };
  onView: (user: any) => void;
  onCredit: (user: any) => void;
  onDelete: (id: string) => void;
  onBan: (id: string) => void;
}

const UserCard = ({ user, onView, onCredit, onDelete, onBan }: UserCardProps) => {
  // คำนวณสีตามสถานะ
  const isActive = user.status?.toLowerCase() === 'active';

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row items-center gap-8 group">
      
      {/* ส่วนที่ 1: ข้อมูลพื้นฐาน (Avatar & Name) */}
      <div className="flex flex-1 items-center gap-6 w-full">
        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2rem] flex items-center justify-center font-black text-3xl shadow-inner transition-colors duration-300
          ${isActive 
            ? 'bg-[#f0fdf4] text-[#127447] group-hover:bg-[#127447] group-hover:text-white' 
            : 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
          }`}>
          {user.username[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-black text-zinc-900 truncate uppercase tracking-tight">
            {user.username}
          </h3>
          <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm">
            <Phone size={14} className="text-[#127447]" /> 
            {user.phone || "No phone linked"}
          </div>
        </div>
      </div>

      {/* ส่วนที่ 2: ตัวเลขเครดิต และ สถานะ */}
      <div className="flex gap-10 border-y lg:border-none py-6 lg:py-0 w-full lg:w-auto justify-between md:justify-start">
        <div className="min-w-[120px]">
          <div className="text-[10px] font-black text-zinc-300 uppercase mb-1 tracking-widest">Available Credit</div>
          <div className="text-2xl font-black text-[#127447] flex items-center gap-2">
            ฿{Number(user.credit || 0).toLocaleString()}
            <button 
              onClick={() => onCredit(user)} 
              title="Adjust Credit"
              className="p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-[#127447] hover:bg-[#f0fdf4] transition-all"
            >
              <Wallet size={16}/>
            </button>
          </div>
        </div>
        
        <div className="min-w-[100px]">
          <div className="text-[10px] font-black text-zinc-300 uppercase mb-1 tracking-widest">Status</div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-colors
            ${isActive 
              ? 'bg-[#f0fdf4] border-[#dcfce7] text-[#127447]' 
              : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            <span className="text-xs font-black uppercase">{user.status || 'Active'}</span>
          </div>
        </div>
      </div>

      {/* ส่วนที่ 3: ปุ่มดำเนินการ (Actions) */}
      <div className="flex gap-3 w-full lg:w-auto">
        {/* View Details */}
        <button 
          onClick={() => onView(user)} 
          title="View Details"
          className="flex-1 lg:flex-none bg-[#f0fdf4] text-[#127447] p-5 rounded-2xl hover:bg-[#127447] hover:text-white transition-all shadow-sm active:scale-95"
        >
          <Eye size={24} />
        </button>

        {/* Delete */}
        <button 
          onClick={() => onDelete(user.id)} 
          title="Delete User"
          className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-95"
        >
          <Trash2 size={24} />
        </button>

        {/* Ban/Block */}
        <button 
          onClick={() => onBan(user.id)} 
          title="Ban User"
          className="flex-1 lg:flex-none bg-zinc-50 text-zinc-300 p-5 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm active:scale-95"
        >
          <Ban size={24} />
        </button>
      </div>
    </div>
  );
};

export default UserCard;