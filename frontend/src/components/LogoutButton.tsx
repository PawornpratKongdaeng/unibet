import { LogoutIcon } from "./Icons";

export default function LogoutButton({ onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-3 p-5 text-sm font-bold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-all duration-200 border border-zinc-800"
    >
      <LogoutIcon />
      <span>ออกจากระบบ</span>
    </button>
  );
}