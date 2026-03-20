'use client'

import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { sumBatting, sumPitching, formatAvg, fmt2 } from '@/lib/stats'
import { useMemo } from 'react'

export default function GamesPage() {
  const { data, deleteGame } = useData()

  const sorted = useMemo(
    () => [...data.games].sort((a, b) => b.date.localeCompare(a.date)),
    [data.games]
  )

  async function handleDelete(id: string, opponent: string) {
    if (confirm(`${opponent}戦を削除しますか？関連する全成績も削除されます。`)) {
      await deleteGame(id)
    }
  }

  const ResultBadge = ({ result }: { result: 'W' | 'L' | 'D' }) => {
    const styles = {
      W: 'bg-green-100 text-green-700',
      L: 'bg-red-100 text-red-600',
      D: 'bg-amber-100 text-amber-700',
    }
    const labels = { W: '勝', L: '負', D: '分' }
    return (
      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[result]}`}>
        {labels[result]}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">試合記録</h1>
        <Link
          href="/games/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ＋ 試合を記録
        </Link>
      </div>

      {sorted.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-8 py-20 text-center">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-slate-400 text-sm mb-4">試合記録がありません</p>
          <Link
            href="/games/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            最初の試合を記録
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {sorted.map(game => {
          const gameBatting = data.batting.filter(b => b.gameId === game.id)
          const gamePitching = data.pitching.filter(p => p.gameId === game.id)
          const tb = sumBatting(gameBatting)
          const tp = sumPitching(gamePitching)

          return (
            <div key={game.id} className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Date + result */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm text-slate-500 whitespace-nowrap">
                    {game.date.replace(/-/g, '/')}
                  </span>
                  <ResultBadge result={game.result} />
                  <span className="font-bold text-slate-800 text-sm">
                    vs {game.opponent}
                  </span>
                </div>

                {/* Score */}
                <div className="flex items-center gap-1 text-sm">
                  <span className={`font-bold text-lg tabular-nums ${game.result === 'W' ? 'text-green-600' : game.result === 'L' ? 'text-red-500' : 'text-slate-700'}`}>
                    {game.teamScore}
                  </span>
                  <span className="text-slate-400">–</span>
                  <span className="font-bold text-lg tabular-nums text-slate-500">{game.opponentScore}</span>
                </div>

                {/* Location */}
                {game.location && (
                  <span className="text-xs text-slate-400">📍 {game.location}</span>
                )}

                {/* Quick stats */}
                <div className="flex items-center gap-3 text-xs text-slate-500 ml-auto">
                  {tb.ab > 0 && (
                    <>
                      <span>打率 <strong className="text-slate-700">{formatAvg(tb.avg)}</strong></span>
                      <span>H <strong className="text-slate-700">{tb.h}</strong></span>
                      <span>HR <strong className="text-slate-700">{tb.hr}</strong></span>
                    </>
                  )}
                  {tp.ipOuts > 0 && (
                    <span>ERA <strong className="text-slate-700">{fmt2(tp.era)}</strong></span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Link
                    href={`/games/${game.id}/live`}
                    className="text-xs px-2 py-1 bg-red-500 text-white font-bold rounded hover:bg-red-600 transition-colors"
                  >
                    ライブ
                  </Link>
                  <Link
                    href={`/games/new?edit=${game.id}`}
                    className="text-slate-400 hover:text-blue-600 px-1.5 py-1 text-sm rounded hover:bg-slate-50"
                  >
                    ✏️
                  </Link>
                  <button
                    onClick={() => handleDelete(game.id, game.opponent)}
                    className="text-slate-400 hover:text-red-500 px-1.5 py-1 text-sm rounded hover:bg-slate-50"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Player breakdown */}
              {gameBatting.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-50 overflow-x-auto">
                  <table className="text-xs min-w-full">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-0.5 pr-3 font-normal">選手</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">AB</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">H</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">HR</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">RBI</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">BB</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">K</th>
                        <th className="text-right py-0.5 px-1.5 font-normal">AVG</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameBatting.map(line => {
                        const p = data.players.find(x => x.id === line.playerId)
                        if (!p) return null
                        const lineAvg = line.ab > 0 ? line.h / line.ab : 0
                        return (
                          <tr key={line.id} className="text-slate-600 hover:text-slate-800">
                            <td className="py-0.5 pr-3">
                              <Link href={`/players/${p.id}`} className="hover:text-blue-600">
                                {p.name}
                              </Link>
                            </td>
                            <td className="text-right px-1.5">{line.ab}</td>
                            <td className="text-right px-1.5 font-medium">{line.h}</td>
                            <td className="text-right px-1.5">{line.hr > 0 ? <span className="text-orange-600 font-bold">{line.hr}</span> : 0}</td>
                            <td className="text-right px-1.5">{line.rbi}</td>
                            <td className="text-right px-1.5">{line.bb}</td>
                            <td className="text-right px-1.5">{line.k}</td>
                            <td className="text-right px-1.5 tabular-nums">{line.ab > 0 ? formatAvg(lineAvg) : '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {game.notes && (
                <p className="mt-2 text-xs text-slate-400">{game.notes}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
