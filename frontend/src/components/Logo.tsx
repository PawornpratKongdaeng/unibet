export default function Logo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center font-black text-black text-2xl">
          A
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></div>
      </div>
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight leading-none">
          ADMIN
        </h1>
        <p className="text-xs text-zinc-500 font-bold tracking-[0.3em] uppercase mt-1">
          Control Panel
        </p>
      </div>
    </div>
  );
}