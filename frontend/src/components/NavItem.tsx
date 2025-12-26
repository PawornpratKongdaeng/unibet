export default function NavItem({ icon, label, sublabel, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all duration-200 ${
        active
          ? "bg-white text-black"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
      }`}
    >
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-black rounded-r-full"></div>
      )}

      <span className="transition-transform duration-200">{icon}</span>
      <div className="flex-1 text-left">
        <div className={`font-bold ${active ? "text-black" : "text-zinc-300"}`}>
          {label}
        </div>
        <div className={`text-xs font-semibold ${active ? "text-zinc-700" : "text-zinc-600"}`}>
          {sublabel}
        </div>
      </div>

      {active && <div className="w-2 h-2 bg-black rounded-full"></div>}
    </button>
  );
}
