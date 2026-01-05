"use client";
import { useRouter } from "next/navigation";
import { 
  PlayCircle, 
  ChevronLeft, 
  Tv, 
  Wifi, 
  Activity,
  MonitorPlay
} from "lucide-react";

import Header from "@/components/Header";

export default function LiveStreamPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#013323] text-white pb-24 font-sans font-bold overflow-hidden">
      <Header />

      <div className="max-w-4xl mx-auto px-4 pt-6">
        
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-emerald-400 hover:text-white transition-all group"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm tracking-widest uppercase text-shadow-sm">Back to Home</span>
          </button>
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-rose-500 animate-pulse" />
            <h1 className="text-xl font-extrabold tracking-tighter uppercase italic">Live Stream</h1>
          </div>
        </div>

        {/* Live Player Placeholder Container */}
        <div className="relative aspect-video w-full bg-[#022c1e] rounded-[2rem] border border-[#044630] shadow-2xl overflow-hidden group">
          
          {/* Background Decor */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500 to-transparent"></div>
          
          {/* Main Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            
            {/* Animated Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#00b359] rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-[#013323] border-2 border-[#044630] rounded-full flex items-center justify-center shadow-inner">
                <PlayCircle className="w-10 h-10 text-[#00b359] animate-bounce" />
              </div>
              {/* Pulse Rings */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border border-[#00b359]/30 rounded-full animate-ping"></div>
            </div>

            <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-2 bg-gradient-to-r from-white via-emerald-400 to-white bg-clip-text text-transparent uppercase">
              Coming Soon
            </h2>
            
            <p className="text-[10px] md:text-xs text-emerald-500/60 uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed">
              Our High-Definition Live Sports Engine is being calibrated for your area.
            </p>

            {/* Status Badge */}
            <div className="mt-8 flex items-center space-x-3 bg-[#013323]/80 backdrop-blur-md px-4 py-2 rounded-full border border-[#044630]">
              <div className="w-2 h-2 bg-[#00b359] rounded-full animate-pulse shadow-[0_0_8px_#00b359]"></div>
              <span className="text-[9px] uppercase tracking-widest text-emerald-400">Signal: Waiting for Data</span>
            </div>
          </div>

          {/* Bottom Bar Decor */}
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-gradient-to-r from-transparent via-[#00b359] to-transparent opacity-30"></div>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {[
            { icon: Tv, title: "4K ULTRA HD", desc: "Crystal clear quality" },
            { icon: Wifi, title: "ZERO LATENCY", desc: "No delay streaming" },
            { icon: MonitorPlay, title: "MULTI-VIEW", desc: "Watch multiple matches" },
          ].map((feature, idx) => (
            <div key={idx} className="bg-[#022c1e]/50 border border-[#044630] rounded-2xl p-4 flex flex-col items-center text-center">
              <feature.icon className="w-5 h-5 text-emerald-500 mb-2 opacity-50" />
              <h3 className="text-[10px] font-black tracking-widest uppercase mb-1">{feature.title}</h3>
              <p className="text-[9px] text-zinc-500 uppercase tracking-tighter">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em]">
                Premium Subscription Feature <br/>
                <span className="text-emerald-900/40">Powered by THUNIBET Global Feed</span>
            </p>
        </div>

      </div>
    </main>
  );
}