import { useState } from "react";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800 rounded-2xl p-8">
        <h3 className="text-xl font-bold text-white mb-6">System Settings</h3>
        <div className="space-y-4">
          <SettingItem label="Maintenance Mode" description="Enable maintenance mode to prevent user access" />
          <SettingItem label="Auto Payout" description="Automatically process winning payouts" />
          <SettingItem label="User Registration" description="Allow new users to register" />
          <SettingItem label="Email Notifications" description="Send email notifications to users" />
        </div>
      </div>
    </div>
  );
}

function SettingItem({ label, description }: any) {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl hover:bg-zinc-900 transition-colors duration-200 border border-zinc-800">
      <div>
        <p className="font-bold text-white">{label}</p>
        <p className="text-sm text-zinc-400">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${enabled ? 'bg-white' : 'bg-zinc-800'}`}
      >
        <div className={`absolute top-1 left-1 w-6 h-6 rounded-full transition-all duration-300 ${enabled ? 'translate-x-6 bg-black' : 'translate-x-0 bg-zinc-600'}`}></div>
      </button>
    </div>
  );
}