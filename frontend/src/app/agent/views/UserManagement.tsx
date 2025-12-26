import { useState } from "react";

export default function AllBetsReport() {
  const bets = [
    { id: "BET001", user: "John Doe", game: "Baccarat", amount: "฿500", result: "Win", payout: "฿1,000", date: "2025-12-26 14:30" },
    { id: "BET002", user: "Jane Smith", game: "Dragon Tiger", amount: "฿1,000", result: "Loss", payout: "฿0", date: "2025-12-26 14:25" },
    { id: "BET003", user: "Mike Johnson", game: "Roulette", amount: "฿2,500", result: "Win", payout: "฿5,000", date: "2025-12-26 14:20" },
    { id: "BET004", user: "Sarah Williams", game: "Blackjack", amount: "฿750", result: "Loss", payout: "฿0", date: "2025-12-26 14:15" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Bets" value="4" />
        <StatCard title="Total Wagered" value="฿4,750" />
        <StatCard title="Total Payout" value="฿6,000" />
      </div>

      <div className="bg-zinc-950/50 backdrop-blur-xl border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Bet ID</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Game</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Result</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Payout</th>
                <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-wider">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {bets.map((bet) => (
                <tr key={bet.id} className="hover:bg-zinc-900/30 transition-colors duration-200">
                  <td className="px-6 py-4 text-sm font-bold text-white">{bet.id}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-white">{bet.user}</td>
                  <td className="px-6 py-4 text-sm text-zinc-300">{bet.game}</td>
                  <td className="px-6 py-4 text-sm font-bold text-white">{bet.amount}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${bet.result === 'Win' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
                      {bet.result}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-green-400">{bet.payout}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{bet.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all duration-300">
      <p className="text-zinc-400 text-sm font-semibold mb-1">{title}</p>
      <p className="text-3xl font-black text-white">{value}</p>
    </div>
  );
}
