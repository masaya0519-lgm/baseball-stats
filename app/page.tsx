'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { sumBatting, sumPitching, formatAvg, fmt2, fmt1 } from '@/lib/stats'
import LeaderboardCard from '@/components/LeaderboardCard'
import Modal from '@/components/Modal'

export default function Dashboard() {
  const { data, setTeamName } = useData()
  const [editTeam, setEditTeam] = useState(false)
  const [teamInput, setTeamInput] = useState('')

  const wins = data.games.filter(g => g.result === 'W').length
  const losses = data.games.filter(g => g.result === 'L').length
  const draws = data.games.filter(g => g.result === 'D').length

  const playerStats = useMemo(() => {
    return data.players.map(p => {
      const batting = sumBatting(data.batting.filter(b => b.playerId === p.id))
      const pitching = sumPitching(data.pitching.filter(pi => pi.playerId === p.id))
      return { player: p, batting, pitching }
    })
  }, [data])

  const battingEntries = (key: keyof ReturnType<typeof sumBatting>, fmt: (n: number) => string) =>
    playerStats
      .filter(s => s.batting.ab > 0)
      .map(s => ({
        playerId: s.player.id,
        playerName: s.player.name,
        rawValue: s.batting[key] as number,
        value: fmt(s.batting[key] as number),
      }))

  const pitchingEntries = (key: keyof ReturnType<typeof sumPitching>, fmt: (n: number) => string) =>
    playerStats
      .filter(s => s.pitching.ipOuts > 0)
      .map(s => ({
        playerId: s.player.id,
        playerName: s.player.name,
        rawValue: s.pitching[key] as number,
        value: fmt(s.pitching[key] as number),
      }))

  const totBatting = sumBatting(data.batting)
  const totPitching = sumPitching(data.pitching)

  function openEditTeam() {
    setTeamInput(data.teamName)
    setEditTeam(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{data.teamName}</h1>
            <button
              onClick={openEditTeam}
              className="text-slate-400 hover:text-blue-600 transition-colors text-sm"
            >
              ✏️
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {data.games.length}試合 ／ {wins}勝{losses}敗{draws > 0 ? `${draws}分` : ''}
          </p>
        </div>
        <Link
          href="/games/new"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors shadow-sm"
        >
          ＋ 試合を記録
        </Link>
      </div>

      {/* Record cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '試合数', value: data.games.length, color: 'text-slate-700' },
          { label: '勝利', value: wins, color: 'text-green-600' },
          { label: '敗北', value: losses, color: 'text-red-500' },
          { label: '引分', value: draws, color: 'text-amber-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-3 text-center">
            <div className={`text-3xl font-bold ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Team batting totals */}
      {data.batting.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
          <h2 className="font-bold text-slate-700 text-sm mb-3">チーム打撃</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 text-center">
            {[
              { label: '打率', value: formatAvg(totBatting.avg) },
              { label: '出塁率', value: formatAvg(totBatting.obp) },
              { label: 'OPS', value: fmt2(totBatting.ops) },
              { label: '安打', value: totBatting.h },
              { label: '本塁打', value: totBatting.hr },
              { label: '打点', value: totBatting.rbi },
            ].map(s => (
              <div key={s.label}>
                <div className="text-xl font-bold text-blue-700 tabular-nums">{s.value}</div>
                <div className="text-xs text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batting leaderboards */}
      <div>
        <h2 className="font-bold text-slate-700 mb-3">打撃ランキング</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LeaderboardCard title="打率 (AVG)" entries={battingEntries('avg', formatAvg)} />
          <LeaderboardCard title="OPS" entries={battingEntries('ops', fmt2)} />
          <LeaderboardCard title="本塁打 (HR)" entries={battingEntries('hr', n => String(n))} />
          <LeaderboardCard title="打点 (RBI)" entries={battingEntries('rbi', n => String(n))} />
        </div>
      </div>

      <div>
        <h2 className="font-bold text-slate-700 mb-3">その他打撃ランキング</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <LeaderboardCard title="安打 (H)" entries={battingEntries('h', n => String(n))} />
          <LeaderboardCard title="出塁率 (OBP)" entries={battingEntries('obp', formatAvg)} />
          <LeaderboardCard title="長打率 (SLG)" entries={battingEntries('slg', formatAvg)} />
          <LeaderboardCard title="盗塁 (SB)" entries={battingEntries('sb', n => String(n))} />
        </div>
      </div>

      {/* Pitching leaderboards */}
      {totPitching.ipOuts > 0 && (
        <>
          <div>
            <h2 className="font-bold text-slate-700 mb-3">投球ランキング</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <LeaderboardCard title="防御率 (ERA)" entries={pitchingEntries('era', fmt2)} ascending />
              <LeaderboardCard title="WHIP" entries={pitchingEntries('whip', fmt2)} ascending />
              <LeaderboardCard title="奪三振 (K)" entries={pitchingEntries('k', n => String(n))} />
              <LeaderboardCard title="勝利 (W)" entries={pitchingEntries('wins', n => String(n))} />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-slate-700 mb-3">その他投球ランキング</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <LeaderboardCard title="K/9" entries={pitchingEntries('k9', fmt1)} />
              <LeaderboardCard title="BB/9" entries={pitchingEntries('bb9', fmt1)} ascending />
              <LeaderboardCard title="K/BB" entries={pitchingEntries('kbb', fmt1)} />
              <LeaderboardCard title="セーブ (SV)" entries={pitchingEntries('saves', n => String(n))} />
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {data.games.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-8 py-16 text-center">
          <div className="text-5xl mb-4">⚾</div>
          <h3 className="font-bold text-slate-700 text-lg mb-2">まだ試合記録がありません</h3>
          <p className="text-slate-400 text-sm mb-6">試合を記録して成績を管理しましょう</p>
          <Link
            href="/games/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ＋ 最初の試合を記録
          </Link>
        </div>
      )}

      {/* Edit team name modal */}
      <Modal open={editTeam} onClose={() => setEditTeam(false)} title="チーム名を変更">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">チーム名</label>
            <input
              type="text"
              value={teamInput}
              onChange={e => setTeamInput(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditTeam(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              キャンセル
            </button>
            <button
              onClick={() => { setTeamName(teamInput); setEditTeam(false) }}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              保存
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
