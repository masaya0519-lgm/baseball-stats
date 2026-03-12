'use client'

interface Entry {
  playerId: string
  playerName: string
  value: string
  rawValue: number
}

interface Props {
  title: string
  unit?: string
  entries: Entry[]
  ascending?: boolean  // lower is better (ERA, WHIP)
  highlight?: string   // playerName to highlight
}

export default function LeaderboardCard({ title, entries, ascending }: Props) {
  const top = [...entries]
    .sort((a, b) => ascending ? a.rawValue - b.rawValue : b.rawValue - a.rawValue)
    .slice(0, 5)

  const medals = ['🥇', '🥈', '🥉', '4', '5']

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-900 to-blue-700">
        <h3 className="text-white font-bold text-sm">{title}</h3>
      </div>
      <div className="divide-y divide-slate-50">
        {top.length === 0 && (
          <div className="px-4 py-6 text-center text-slate-400 text-sm">データなし</div>
        )}
        {top.map((e, i) => (
          <div key={e.playerId + i} className="flex items-center px-4 py-2.5 hover:bg-slate-50 transition-colors">
            <span className="w-7 text-center text-sm font-medium text-slate-400">
              {i < 3 ? medals[i] : <span className="text-slate-400 text-xs">{i + 1}</span>}
            </span>
            <span className="flex-1 text-sm font-medium text-slate-800 ml-1">{e.playerName}</span>
            <span className="text-base font-bold text-blue-700 tabular-nums">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
