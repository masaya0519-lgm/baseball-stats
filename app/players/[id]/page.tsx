'use client'

import { useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { sumBatting, sumPitching, formatAvg, fmt2, fmt1, formatIp } from '@/lib/stats'
import { BattingLine, PitchingLine } from '@/lib/types'

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 text-center">
      <div className="text-2xl font-bold text-blue-700 tabular-nums">{value}</div>
      <div className="text-xs text-slate-400 mt-0.5">{label}</div>
    </div>
  )
}

export default function PlayerDetail() {
  const params = useParams()
  const router = useRouter()
  const { data } = useData()

  const player = data.players.find(p => p.id === params.id)
  const battingLines = useMemo(
    () => data.batting.filter(b => b.playerId === params.id),
    [data, params.id]
  )
  const pitchingLines = useMemo(
    () => data.pitching.filter(p => p.playerId === params.id),
    [data, params.id]
  )

  const b = useMemo(() => sumBatting(battingLines), [battingLines])
  const pi = useMemo(() => sumPitching(pitchingLines), [pitchingLines])

  const gameMap = useMemo(() => {
    const m: Record<string, typeof data.games[0]> = {}
    data.games.forEach(g => { m[g.id] = g })
    return m
  }, [data.games])

  if (!player) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">選手が見つかりません</p>
        <Link href="/players" className="text-blue-600 hover:underline text-sm">← 選手一覧に戻る</Link>
      </div>
    )
  }

  const sortedBatting = [...battingLines].sort((a, b) => {
    const ga = gameMap[a.gameId]
    const gb = gameMap[b.gameId]
    return (ga?.date ?? '').localeCompare(gb?.date ?? '')
  })

  const sortedPitching = [...pitchingLines].sort((a, b) => {
    const ga = gameMap[a.gameId]
    const gb = gameMap[b.gameId]
    return (ga?.date ?? '').localeCompare(gb?.date ?? '')
  })

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-blue-600 mb-3 flex items-center gap-1"
        >
          ← 戻る
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-blue-900 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold text-lg">
            {player.number}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{player.name}</h1>
            <p className="text-slate-500 text-sm">{player.position} ／ {b.games}試合出場</p>
          </div>
        </div>
      </div>

      {/* Batting summary */}
      {b.ab > 0 && (
        <div>
          <h2 className="font-bold text-slate-700 mb-3">打撃成績</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
            <StatCard label="打率" value={formatAvg(b.avg)} />
            <StatCard label="出塁率" value={formatAvg(b.obp)} />
            <StatCard label="長打率" value={formatAvg(b.slg)} />
            <StatCard label="OPS" value={fmt2(b.ops)} />
            <StatCard label="安打" value={b.h} />
            <StatCard label="本塁打" value={b.hr} />
            <StatCard label="打点" value={b.rbi} />
            <StatCard label="盗塁" value={b.sb} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatCard label="打席" value={b.pa} />
            <StatCard label="打数" value={b.ab} />
            <StatCard label="四球" value={b.bb} />
            <StatCard label="三振" value={b.k} />
            <StatCard label="二塁打" value={b.d} />
            <StatCard label="三塁打" value={b.t} />
          </div>

          {/* Game log - batting */}
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-medium text-slate-700 text-sm">打撃ゲームログ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['日付', '対戦', '打席', '打数', '安打', '2塁打', '3塁打', '本塁打', '打点', '得点', '四球', '三振', '盗塁'].map(h => (
                      <th key={h} className="px-2 py-2 text-xs text-slate-500 font-medium whitespace-nowrap text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedBatting.map((line: BattingLine) => {
                    const game = gameMap[line.gameId]
                    return (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">
                          {game ? (
                            <Link href={`/games`} className="hover:text-blue-600">
                              {game.date.replace(/-/g, '/')}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600 text-left">{game?.opponent ?? '—'}</td>
                        {[line.pa, line.ab, line.h, line.d, line.t, line.hr, line.rbi, line.r, line.bb, line.k, line.sb].map((v, i) => (
                          <td key={i} className="px-2 py-2 text-right tabular-nums text-slate-700">{v}</td>
                        ))}
                      </tr>
                    )
                  })}
                  {/* Totals row */}
                  <tr className="bg-blue-50 font-medium">
                    <td className="px-2 py-2 text-slate-700" colSpan={2}>合計</td>
                    {[b.pa, b.ab, b.h, b.d, b.t, b.hr, b.rbi, b.r, b.bb, b.k, b.sb].map((v, i) => (
                      <td key={i} className="px-2 py-2 text-right tabular-nums text-blue-800">{v}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Pitching summary */}
      {pi.ipOuts > 0 && (
        <div>
          <h2 className="font-bold text-slate-700 mb-3">投球成績</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
            <StatCard label="防御率" value={fmt2(pi.era)} />
            <StatCard label="WHIP" value={fmt2(pi.whip)} />
            <StatCard label="K/9" value={fmt1(pi.k9)} />
            <StatCard label="BB/9" value={fmt1(pi.bb9)} />
            <StatCard label="勝利" value={pi.wins} />
            <StatCard label="敗北" value={pi.losses} />
            <StatCard label="セーブ" value={pi.saves} />
            <StatCard label="HP" value={pi.holds} />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatCard label="投球回" value={formatIp(pi.ipOuts)} />
            <StatCard label="奪三振" value={pi.k} />
            <StatCard label="与四球" value={pi.bb} />
            <StatCard label="被安打" value={pi.h} />
            <StatCard label="失点" value={pi.r} />
            <StatCard label="自責点" value={pi.er} />
          </div>

          {/* Game log - pitching */}
          <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="font-medium text-slate-700 text-sm">投球ゲームログ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['日付', '対戦', '勝敗', 'IP', '被安打', '失点', '自責点', '四球', '三振'].map(h => (
                      <th key={h} className="px-2 py-2 text-xs text-slate-500 font-medium whitespace-nowrap text-right first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sortedPitching.map((line: PitchingLine) => {
                    const game = gameMap[line.gameId]
                    const result = line.win ? '勝' : line.loss ? '負' : line.save ? 'S' : line.hold ? 'H' : '—'
                    const resultColor = line.win ? 'text-green-600' : line.loss ? 'text-red-500' : 'text-slate-500'
                    return (
                      <tr key={line.id} className="hover:bg-slate-50">
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">
                          {game?.date.replace(/-/g, '/') ?? '—'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">{game?.opponent ?? '—'}</td>
                        <td className={`px-2 py-2 text-right font-medium ${resultColor}`}>{result}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{formatIp(line.ipOuts)}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{line.h}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{line.r}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{line.er}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{line.bb}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-slate-700">{line.k}</td>
                      </tr>
                    )
                  })}
                  {/* Totals */}
                  <tr className="bg-blue-50 font-medium">
                    <td className="px-2 py-2 text-slate-700" colSpan={3}>合計</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{formatIp(pi.ipOuts)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{pi.h}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{pi.r}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{pi.er}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{pi.bb}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-blue-800">{pi.k}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {b.ab === 0 && pi.ipOuts === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-8 py-16 text-center">
          <p className="text-slate-400 text-sm">まだ成績が記録されていません</p>
          <Link href="/games/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
            試合を記録する
          </Link>
        </div>
      )}
    </div>
  )
}
