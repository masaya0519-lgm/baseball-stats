'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { BattingLine, PitchingLine } from '@/lib/types'
import { ipInputToOuts, formatIp } from '@/lib/stats'

interface BattingRow {
  playerId: string
  pa: string; ab: string; h: string; d: string; t: string; hr: string
  rbi: string; r: string; bb: string; hbp: string; k: string
  sb: string; cs: string; sac: string; sf: string
}

interface PitchingRow {
  playerId: string
  ip: string; h: string; r: string; er: string; bb: string; k: string; hr: string
  win: boolean; loss: boolean; save: boolean; hold: boolean
}

const defaultBatting = (playerId: string): BattingRow => ({
  playerId, pa: '', ab: '', h: '', d: '', t: '', hr: '',
  rbi: '', r: '', bb: '', hbp: '', k: '', sb: '', cs: '', sac: '', sf: '',
})

const defaultPitching = (playerId: string): PitchingRow => ({
  playerId, ip: '', h: '', r: '', er: '', bb: '', k: '', hr: '',
  win: false, loss: false, save: false, hold: false,
})

function n(v: string): number { return parseInt(v, 10) || 0 }

export default function NewGamePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const { data, addGame, deleteGame, upsertBattingLines, upsertPitchingLines } = useData()

  const editGame = editId ? data.games.find(g => g.id === editId) : null

  // Game info
  const [date, setDate] = useState(editGame?.date ?? new Date().toISOString().slice(0, 10))
  const [opponent, setOpponent] = useState(editGame?.opponent ?? '')
  const [location, setLocation] = useState(editGame?.location ?? '')
  const [result, setResult] = useState<'W' | 'L' | 'D'>(editGame?.result ?? 'W')
  const [teamScore, setTeamScore] = useState(editGame ? String(editGame.teamScore) : '')
  const [oppScore, setOppScore] = useState(editGame ? String(editGame.opponentScore) : '')
  const [notes, setNotes] = useState(editGame?.notes ?? '')

  // Selected players for this game
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() => {
    if (editId) {
      const battingIds = data.batting.filter(b => b.gameId === editId).map(b => b.playerId)
      const pitchingIds = data.pitching.filter(p => p.gameId === editId).map(p => p.playerId)
      return [...new Set([...battingIds, ...pitchingIds])]
    }
    return data.players.map(p => p.id)
  })

  // Batting rows
  const [battingRows, setBattingRows] = useState<Record<string, BattingRow>>(() => {
    const rows: Record<string, BattingRow> = {}
    data.players.forEach(p => {
      if (editId) {
        const existing = data.batting.find(b => b.gameId === editId && b.playerId === p.id)
        if (existing) {
          rows[p.id] = {
            playerId: p.id,
            pa: String(existing.pa), ab: String(existing.ab), h: String(existing.h),
            d: String(existing.d), t: String(existing.t), hr: String(existing.hr),
            rbi: String(existing.rbi), r: String(existing.r), bb: String(existing.bb),
            hbp: String(existing.hbp), k: String(existing.k), sb: String(existing.sb),
            cs: String(existing.cs), sac: String(existing.sac), sf: String(existing.sf),
          }
        } else {
          rows[p.id] = defaultBatting(p.id)
        }
      } else {
        rows[p.id] = defaultBatting(p.id)
      }
    })
    return rows
  })

  // Pitching rows
  const [pitchingRows, setPitchingRows] = useState<Record<string, PitchingRow>>(() => {
    const rows: Record<string, PitchingRow> = {}
    data.players.forEach(p => {
      if (editId) {
        const existing = data.pitching.find(pi => pi.gameId === editId && pi.playerId === p.id)
        if (existing) {
          rows[p.id] = {
            playerId: p.id,
            ip: formatIp(existing.ipOuts),
            h: String(existing.h), r: String(existing.r), er: String(existing.er),
            bb: String(existing.bb), k: String(existing.k), hr: String(existing.hr),
            win: existing.win, loss: existing.loss, save: existing.save, hold: existing.hold,
          }
        } else {
          rows[p.id] = defaultPitching(p.id)
        }
      } else {
        rows[p.id] = defaultPitching(p.id)
      }
    })
    return rows
  })

  const [pitchingPlayerIds, setPitchingPlayerIds] = useState<string[]>(() => {
    if (editId) {
      return data.pitching.filter(p => p.gameId === editId).map(p => p.playerId)
    }
    return []
  })

  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>('batting')
  const [saving, setSaving] = useState(false)

  // Sync new players into rows if players change
  useEffect(() => {
    setBattingRows(prev => {
      const updated = { ...prev }
      data.players.forEach(p => {
        if (!updated[p.id]) updated[p.id] = defaultBatting(p.id)
      })
      return updated
    })
    setPitchingRows(prev => {
      const updated = { ...prev }
      data.players.forEach(p => {
        if (!updated[p.id]) updated[p.id] = defaultPitching(p.id)
      })
      return updated
    })
  }, [data.players])

  function updateBatting(playerId: string, field: keyof BattingRow, value: string) {
    setBattingRows(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }))
  }

  function updatePitching(playerId: string, field: keyof PitchingRow, value: string | boolean) {
    setPitchingRows(prev => ({
      ...prev,
      [playerId]: { ...prev[playerId], [field]: value },
    }))
  }

  function togglePitcher(playerId: string) {
    setPitchingPlayerIds(prev =>
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    )
  }

  async function handleLiveStart() {
    if (!opponent.trim()) { alert('対戦相手を入力してください'); return }
    setSaving(true)
    const newGame = await addGame({
      date, opponent: opponent.trim(), location, result,
      teamScore: n(teamScore), opponentScore: n(oppScore), notes,
    })
    setSaving(false)
    router.push(`/games/${newGame.id}/live`)
  }

  async function handleSave() {
    if (!opponent.trim()) { alert('対戦相手を入力してください'); return }
    setSaving(true)

    let gameId: string
    if (editGame) {
      // Delete old then re-save
      await deleteGame(editGame.id)
      const newGame = await addGame({
        date, opponent: opponent.trim(), location, result,
        teamScore: n(teamScore), opponentScore: n(oppScore), notes,
      })
      gameId = newGame.id
    } else {
      const newGame = await addGame({
        date, opponent: opponent.trim(), location, result,
        teamScore: n(teamScore), opponentScore: n(oppScore), notes,
      })
      gameId = newGame.id
    }

    // Save batting
    const battingToSave: Omit<BattingLine, 'id'>[] = selectedPlayerIds
      .map(playerId => {
        const row = battingRows[playerId]
        if (!row || row.ab === '') return null
        return {
          playerId, gameId,
          pa: n(row.pa), ab: n(row.ab), h: n(row.h), d: n(row.d), t: n(row.t), hr: n(row.hr),
          rbi: n(row.rbi), r: n(row.r), bb: n(row.bb), hbp: n(row.hbp), k: n(row.k),
          sb: n(row.sb), cs: n(row.cs), sac: n(row.sac), sf: n(row.sf),
        }
      })
      .filter(Boolean) as Omit<BattingLine, 'id'>[]

    if (battingToSave.length > 0) {
      await upsertBattingLines(battingToSave)
    }

    // Save pitching
    const pitchingToSave: Omit<PitchingLine, 'id'>[] = pitchingPlayerIds
      .map(playerId => {
        const row = pitchingRows[playerId]
        if (!row || row.ip === '') return null
        return {
          playerId, gameId,
          ipOuts: ipInputToOuts(row.ip),
          h: n(row.h), r: n(row.r), er: n(row.er), bb: n(row.bb), k: n(row.k), hr: n(row.hr),
          win: row.win, loss: row.loss, save: row.save, hold: row.hold,
        }
      })
      .filter(Boolean) as Omit<PitchingLine, 'id'>[]

    if (pitchingToSave.length > 0) {
      await upsertPitchingLines(pitchingToSave)
    }

    setSaving(false)
    router.push('/games')
  }

  const BattingInput = ({ playerId, field, width = 'w-10' }: { playerId: string; field: keyof BattingRow; width?: string }) => (
    <input
      type="number"
      min="0"
      value={battingRows[playerId]?.[field] as string ?? ''}
      onChange={e => updateBatting(playerId, field, e.target.value)}
      className={`${width} border border-slate-200 rounded px-1 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400`}
    />
  )

  const PitchingInput = ({ playerId, field, width = 'w-12' }: { playerId: string; field: keyof PitchingRow; width?: string }) => (
    <input
      type={field === 'ip' ? 'text' : 'number'}
      min="0"
      value={pitchingRows[playerId]?.[field] as string ?? ''}
      onChange={e => updatePitching(playerId, field, e.target.value)}
      placeholder={field === 'ip' ? '0.0' : ''}
      className={`${width} border border-slate-200 rounded px-1 py-1 text-center text-sm focus:outline-none focus:ring-1 focus:ring-blue-400`}
    />
  )

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/games" className="text-slate-400 hover:text-blue-600 text-sm">← 戻る</Link>
        <h1 className="text-xl font-bold text-slate-800">{editGame ? '試合を編集' : '試合を記録'}</h1>
      </div>

      {/* Game info */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
        <h2 className="font-bold text-slate-700 text-sm mb-4">試合情報</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">日付 *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">対戦相手 *</label>
            <input
              type="text"
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              placeholder="例: タイガース"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">場所</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="例: 市民球場"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">勝敗</label>
            <div className="flex gap-2">
              {(['W', 'L', 'D'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                    result === r
                      ? r === 'W' ? 'bg-green-500 text-white' : r === 'L' ? 'bg-red-500 text-white' : 'bg-amber-400 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {r === 'W' ? '勝' : r === 'L' ? '負' : '分'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">スコア</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={teamScore}
                onChange={e => setTeamScore(e.target.value)}
                placeholder="自チーム"
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                value={oppScore}
                onChange={e => setOppScore(e.target.value)}
                placeholder="相手"
                className="w-20 border border-slate-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">メモ</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="任意"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* No players warning */}
      {data.players.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-sm text-amber-700">
          選手が登録されていません。
          <Link href="/players" className="underline ml-1">選手を追加</Link>してから戻ってきてください。
        </div>
      )}

      {data.players.length > 0 && (
        <>
          {/* Player selection */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-slate-700 text-sm">出場選手を選択</h2>
                <p className="text-xs text-slate-400 mt-0.5">クリックで選択／解除</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPlayerIds(data.players.map(p => p.id))}
                  className="text-xs px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors"
                >
                  全員
                </button>
                <button
                  onClick={() => setSelectedPlayerIds([])}
                  className="text-xs px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 hover:bg-slate-100 font-medium transition-colors"
                >
                  クリア
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.players.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerIds(prev =>
                    prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                  )}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                    selectedPlayerIds.includes(p.id)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  #{p.number} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('batting')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'batting' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              打撃成績
            </button>
            <button
              onClick={() => setActiveTab('pitching')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pitching' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              投球成績
            </button>
          </div>

          {/* Batting stats input */}
          {activeTab === 'batting' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-700 text-sm">打撃成績入力</h2>
                <span className="text-xs text-slate-400">空欄 = 未入力</span>
              </div>
              <div className="overflow-x-auto p-2">
                <table className="text-sm min-w-max">
                  <thead>
                    <tr className="text-xs text-slate-500">
                      <th className="px-2 py-1.5 text-left font-medium min-w-24">選手</th>
                      {['打席', '打数', '安打', '2塁打', '3塁打', 'HR', '打点', '得点', '四球', '死球', '三振', '盗塁', '盗失', '犠打', '犠飛'].map(h => (
                        <th key={h} className="px-1 py-1.5 text-center font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.players
                      .filter(p => selectedPlayerIds.includes(p.id))
                      .map(p => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="px-2 py-1.5 font-medium text-slate-700 whitespace-nowrap">
                            {p.name}
                          </td>
                          {(['pa', 'ab', 'h', 'd', 't', 'hr', 'rbi', 'r', 'bb', 'hbp', 'k', 'sb', 'cs', 'sac', 'sf'] as (keyof BattingRow)[]).map(field => (
                            <td key={field} className="px-1 py-1.5">
                              <BattingInput playerId={p.id} field={field} />
                            </td>
                          ))}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pitching stats input */}
          {activeTab === 'pitching' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-700 text-sm mb-1">投球成績入力</h2>
                <p className="text-xs text-slate-400">IP: 投球回 (例: 7.0 = 7回, 5.2 = 5回2/3)</p>
              </div>
              <div className="px-4 py-3">
                <div className="flex flex-wrap gap-2 mb-4">
                  {data.players.map(p => (
                    <button
                      key={p.id}
                      onClick={() => togglePitcher(p.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        pitchingPlayerIds.includes(p.id)
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
                {pitchingPlayerIds.length === 0 && (
                  <p className="text-sm text-slate-400 py-4 text-center">投手を上から選択してください</p>
                )}
                {pitchingPlayerIds.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="text-sm min-w-max">
                      <thead>
                        <tr className="text-xs text-slate-500">
                          <th className="px-2 py-1.5 text-left font-medium min-w-24">投手</th>
                          {['IP', '被安打', '失点', '自責点', '四球', '三振', '被HR', '勝', '負', 'S', 'H'].map(h => (
                            <th key={h} className="px-1 py-1.5 text-center font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pitchingPlayerIds.map(pid => {
                          const p = data.players.find(x => x.id === pid)
                          if (!p) return null
                          const row = pitchingRows[pid]
                          return (
                            <tr key={pid} className="hover:bg-slate-50">
                              <td className="px-2 py-1.5 font-medium text-slate-700 whitespace-nowrap">{p.name}</td>
                              <td className="px-1 py-1.5">
                                <PitchingInput playerId={pid} field="ip" width="w-14" />
                              </td>
                              {(['h', 'r', 'er', 'bb', 'k', 'hr'] as (keyof PitchingRow)[]).map(field => (
                                <td key={field} className="px-1 py-1.5">
                                  <PitchingInput playerId={pid} field={field} />
                                </td>
                              ))}
                              {(['win', 'loss', 'save', 'hold'] as (keyof PitchingRow)[]).map(field => (
                                <td key={field} className="px-2 py-1.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={row?.[field] as boolean ?? false}
                                    onChange={e => updatePitching(pid, field, e.target.checked)}
                                    className="w-4 h-4 accent-blue-600"
                                  />
                                </td>
                              ))}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Link
          href="/games"
          className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-800"
        >
          キャンセル
        </Link>
        {!editGame && (
          <button
            onClick={handleLiveStart}
            disabled={saving || !opponent.trim()}
            className="bg-red-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40"
          >
            {saving ? '準備中...' : 'ライブで開始'}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !opponent.trim()}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40"
        >
          {saving ? '保存中...' : editGame ? '更新する' : '記録する'}
        </button>
      </div>
    </div>
  )
}
