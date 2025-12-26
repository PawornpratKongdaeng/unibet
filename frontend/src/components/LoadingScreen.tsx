export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
}