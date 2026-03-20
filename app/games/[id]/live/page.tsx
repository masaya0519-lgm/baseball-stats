'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { BattingLine, PitchingLine } from '@/lib/types'
import { formatAvg, formatIp } from '@/lib/stats'

type AtBatResult = '1B' | '2B' | '3B' | 'HR' | 'BB' | 'HBP' | 'SAC' | 'SF' | 'K' | 'GO' | 'FO'

const RESULT_CONFIG: { result: AtBatResult; label: string; color: string; hasRbi: boolean }[] = [
  { result: '1B',  label: '安打',      color: 'bg-green-500 hover:bg-green-600 active:bg-green-700',     hasRbi: true  },
  { result: '2B',  label: '二塁打',    color: 'bg-green-600 hover:bg-green-700 active:bg-green-800',     hasRbi: true  },
  { result: '3B',  label: '三塁打',    color: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800', hasRbi: true },
  { result: 'HR',  label: '本塁打',    color: 'bg-red-500 hover:bg-red-600 active:bg-red-700',           hasRbi: true  },
  { result: 'BB',  label: '四球',      color: 'bg-blue-400 hover:bg-blue-500 active:bg-blue-600',        hasRbi: true  },
  { result: 'HBP', label: '死球',      color: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',        hasRbi: false },
  { result: 'SAC', label: '犠打',      color: 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700',     hasRbi: true  },
  { result: 'SF',  label: '犠飛',      color: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',     hasRbi: true  },
  { result: 'K',   label: '三振',      color: 'bg-slate-500 hover:bg-slate-600 active:bg-slate-700',     hasRbi: false },
  { result: 'GO',  label: 'ゴロアウト', color: 'bg-slate-400 hover:bg-slate-500 active:bg-slate-600',   hasRbi: true  },
  { result: 'FO',  label: 'フライアウト', color: 'bg-slate-400 hover:bg-slate-500 active:bg-slate-600', hasRbi: true  },
]

interface LiveBatting {
  playerId: string
  pa: number; ab: number; h: number; d: number; t: number; hr: number
  rbi: number; r: number; bb: number; hbp: number; k: number
  sb: number; cs: number; sac: number; sf: number
}

interface LivePitching {
  ipOuts: number; h: number; r: number; er: number
  bb: number; k: number; hr: number
  win: boolean; loss: boolean; save: boolean; hold: boolean
}

function defaultBatting(playerId: string): LiveBatting {
  return { playerId, pa: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 }
}

function defaultPitching(): LivePitching {
  return { ipOuts: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, win: false, loss: false, save: false, hold: false }
}

function fromBattingLine(b: BattingLine): LiveBatting {
  return { playerId: b.playerId, pa: b.pa, ab: b.ab, h: b.h, d: b.d, t: b.t, hr: b.hr, rbi: b.rbi, r: b.r, bb: b.bb, hbp: b.hbp, k: b.k, sb: b.sb, cs: b.cs, sac: b.sac, sf: b.sf }
}

function fromPitchingLine(p: PitchingLine): LivePitching {
  return { ipOuts: p.ipOuts, h: p.h, r: p.r, er: p.er, bb: p.bb, k: p.k, hr: p.hr, win: p.win, loss: p.loss, save: p.save, hold: p.hold }
}

function applyAtBat(b: LiveBatting, result: AtBatResult, rbi: number): LiveBatting {
  const n = { ...b, pa: b.pa + 1 }
  // 打数にカウントしない: BB, HBP, SAC, SF
  if (!['BB', 'HBP', 'SAC', 'SF'].includes(result)) n.ab++
  n.rbi += rbi
  switch (result) {
    case '1B': n.h++; break
    case '2B': n.h++; n.d++; break
    case '3B': n.h++; n.t++; break
    case 'HR': n.h++; n.hr++; break
    case 'BB': n.bb++; break
    case 'HBP': n.hbp++; break
    case 'SAC': n.sac++; break
    case 'SF': n.sf++; break
    case 'K': n.k++; break
  }
  return n
}

function calcAvg(b: LiveBatting): string {
  return b.ab === 0 ? '---' : formatAvg(b.h / b.ab)
}

export default function LiveGamePage() {
  const params = useParams()
  const gameId = params.id as string
  const { data, updateGame, upsertBattingLines, upsertPitchingLines } = useData()
  const game = data.games.find(g => g.id === gameId)

  const [teamScore, setTeamScore] = useState(game?.teamScore ?? 0)
  const [oppScore, setOppScore] = useState(game?.opponentScore ?? 0)
  const [gameResult, setGameResult] = useState<'W' | 'L' | 'D'>(game?.result ?? 'D')

  const [batting, setBatting] = useState<Record<string, LiveBatting>>(() => {
    const rows: Record<string, LiveBatting> = {}
    data.players.forEach(p => {
      const existing = data.batting.find(b => b.gameId === gameId && b.playerId === p.id)
      rows[p.id] = existing ? fromBattingLine(existing) : defaultBatting(p.id)
    })
    return rows
  })

  const [activePlayerIds, setActivePlayerIds] = useState<string[]>(() => {
    const existing = data.batting.filter(b => b.gameId === gameId).map(b => b.playerId)
    return existing.length > 0 ? existing : data.players.map(p => p.id)
  })

  const [pitching, setPitching] = useState<Record<string, LivePitching>>(() => {
    const rows: Record<string, LivePitching> = {}
    data.players.forEach(p => {
      const existing = data.pitching.find(pi => pi.gameId === gameId && pi.playerId === p.id)
      rows[p.id] = existing ? fromPitchingLine(existing) : defaultPitching()
    })
    return rows
  })

  const [pitcherIds, setPitcherIds] = useState<string[]>(() =>
    data.pitching.filter(p => p.gameId === gameId).map(p => p.playerId)
  )

  const [selectedBatter, setSelectedBatter] = useState<string | null>(null)
  const [pendingResult, setPendingResult] = useState<{ result: AtBatResult; hasRbi: boolean } | null>(null)
  const [rbiCount, setRbiCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'batting' | 'pitching'>('batting')
  const [selectedPitcher, setSelectedPitcher] = useState<string | null>(null)

  // スコアからW/L/Dを自動計算
  useEffect(() => {
    if (teamScore > oppScore) setGameResult('W')
    else if (teamScore < oppScore) setGameResult('L')
    else setGameResult('D')
  }, [teamScore, oppScore])

  // スコア・勝敗をデバウンス保存
  const scoreTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const scoreRef = useRef({ teamScore, oppScore, gameResult })
  scoreRef.current = { teamScore, oppScore, gameResult }

  useEffect(() => {
    if (!game) return
    clearTimeout(scoreTimerRef.current)
    scoreTimerRef.current = setTimeout(() => {
      updateGame(gameId, {
        teamScore: scoreRef.current.teamScore,
        opponentScore: scoreRef.current.oppScore,
        result: scoreRef.current.gameResult,
      })
    }, 800)
    return () => clearTimeout(scoreTimerRef.current)
  }, [teamScore, oppScore, gameResult, gameId, game, updateGame])

  // バッターの打撃成績を保存
  const savePlayerBatting = useCallback(async (b: LiveBatting) => {
    if (b.pa === 0) return
    await upsertBattingLines([{
      playerId: b.playerId, gameId,
      pa: b.pa, ab: b.ab, h: b.h, d: b.d, t: b.t, hr: b.hr,
      rbi: b.rbi, r: b.r, bb: b.bb, hbp: b.hbp, k: b.k,
      sb: b.sb, cs: b.cs, sac: b.sac, sf: b.sf,
    }])
  }, [gameId, upsertBattingLines])

  // 投手成績をデバウンス保存
  const pitchTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const pitchingRef = useRef(pitching)
  pitchingRef.current = pitching

  const savePitcherDebounced = useCallback((playerId: string) => {
    clearTimeout(pitchTimers.current[playerId])
    pitchTimers.current[playerId] = setTimeout(async () => {
      const p = pitchingRef.current[playerId]
      if (!p) return
      await upsertPitchingLines([{
        playerId, gameId,
        ipOuts: p.ipOuts, h: p.h, r: p.r, er: p.er,
        bb: p.bb, k: p.k, hr: p.hr,
        win: p.win, loss: p.loss, save: p.save, hold: p.hold,
      }])
    }, 800)
  }, [gameId, upsertPitchingLines])

  // 打席結果選択
  function selectResult(result: AtBatResult, hasRbi: boolean) {
    if (!selectedBatter) return
    if (hasRbi) {
      setPendingResult({ result, hasRbi })
      setRbiCount(0)
    } else {
      applyAndSave(result, 0)
    }
  }

  async function applyAndSave(result: AtBatResult, rbi: number) {
    if (!selectedBatter) return
    setSaving(true)
    const current = batting[selectedBatter] ?? defaultBatting(selectedBatter)
    const updated = applyAtBat(current, result, rbi)
    setBatting(prev => ({ ...prev, [selectedBatter]: updated }))
    setPendingResult(null)
    setRbiCount(0)

    const player = data.players.find(p => p.id === selectedBatter)
    const cfg = RESULT_CONFIG.find(r => r.result === result)
    setLastAction(`${player?.name ?? ''}: ${cfg?.label ?? result}${rbi > 0 ? ` (打点${rbi})` : ''}`)

    await savePlayerBatting(updated)
    setSaving(false)
  }

  // 投手スタット変更
  function incPitcherStat(playerId: string, field: 'ipOuts' | 'h' | 'r' | 'er' | 'bb' | 'k' | 'hr', delta: 1 | -1) {
    setPitching(prev => {
      const cur = prev[playerId] ?? defaultPitching()
      return { ...prev, [playerId]: { ...cur, [field]: Math.max(0, cur[field] + delta) } }
    })
    savePitcherDebounced(playerId)
  }

  function setPitcherFlag(playerId: string, field: 'win' | 'loss' | 'save' | 'hold', value: boolean) {
    setPitching(prev => {
      const cur = prev[playerId] ?? defaultPitching()
      return { ...prev, [playerId]: { ...cur, [field]: value } }
    })
    savePitcherDebounced(playerId)
  }

  function togglePitcher(playerId: string) {
    const isAdding = !pitcherIds.includes(playerId)
    setPitcherIds(prev => isAdding ? [...prev, playerId] : prev.filter(id => id !== playerId))
    if (isAdding) setSelectedPitcher(playerId)
  }

  if (!game) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">試合が見つかりません</p>
        <Link href="/games" className="text-blue-600 hover:underline text-sm mt-2 inline-block">← 試合一覧に戻る</Link>
      </div>
    )
  }

  const batter = selectedBatter ? data.players.find(p => p.id === selectedBatter) : null
  const activePlayers = data.players.filter(p => activePlayerIds.includes(p.id))

  return (
    <div className="space-y-4 max-w-xl">
      {/* ヘッダー */}
      <div className="flex items-center gap-3">
        <Link href="/games" className="text-slate-400 hover:text-blue-600 text-sm">← 戻る</Link>
        <h1 className="text-xl font-bold text-slate-800">ライブ入力</h1>
        {saving && <span className="text-xs text-blue-500 animate-pulse">保存中...</span>}
      </div>

      {/* スコアボード */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
        <div className="text-xs text-slate-500 text-center mb-3">vs {game.opponent} · {game.date}</div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="text-xs text-slate-500 text-center mb-1">自チーム</div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setTeamScore(s => Math.max(0, s - 1))} className="w-9 h-9 bg-slate-100 rounded-full text-slate-700 text-lg font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors">−</button>
              <span className="text-4xl font-bold text-slate-800 w-12 text-center tabular-nums">{teamScore}</span>
              <button onClick={() => setTeamScore(s => s + 1)} className="w-9 h-9 bg-blue-500 rounded-full text-white text-lg font-bold hover:bg-blue-600 active:bg-blue-700 transition-colors">+</button>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${gameResult === 'W' ? 'bg-green-100 text-green-700' : gameResult === 'L' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
              {gameResult === 'W' ? '勝' : gameResult === 'L' ? '負' : '分'}
            </span>
            <span className="text-slate-300 text-xl font-light">–</span>
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 text-center mb-1">相手チーム</div>
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setOppScore(s => Math.max(0, s - 1))} className="w-9 h-9 bg-slate-100 rounded-full text-slate-700 text-lg font-bold hover:bg-slate-200 active:bg-slate-300 transition-colors">−</button>
              <span className="text-4xl font-bold text-slate-800 w-12 text-center tabular-nums">{oppScore}</span>
              <button onClick={() => setOppScore(s => s + 1)} className="w-9 h-9 bg-red-500 rounded-full text-white text-lg font-bold hover:bg-red-600 active:bg-red-700 transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('batting')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'batting' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>打撃</button>
        <button onClick={() => setActiveTab('pitching')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'pitching' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>投球</button>
      </div>

      {/* ===== 打撃タブ ===== */}
      {activeTab === 'batting' && (
        <>
          {data.players.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
              選手が登録されていません。<Link href="/players" className="underline ml-1">選手を追加</Link>してください。
            </div>
          ) : (
            <>
              {/* バッター選択 */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-bold text-slate-700">バッターを選択</h2>
                  <div className="flex gap-1">
                    <button onClick={() => setActivePlayerIds(data.players.map(p => p.id))} className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-500 hover:bg-slate-100">全員</button>
                    <button onClick={() => { setActivePlayerIds([]); setSelectedBatter(null) }} className="text-xs px-2 py-0.5 rounded bg-slate-50 text-slate-500 hover:bg-slate-100">クリア</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.players.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        if (!activePlayerIds.includes(p.id)) setActivePlayerIds(prev => [...prev, p.id])
                        setSelectedBatter(prev => prev === p.id ? null : p.id)
                        setPendingResult(null)
                        setRbiCount(0)
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                        selectedBatter === p.id
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-300'
                          : activePlayerIds.includes(p.id)
                            ? 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                      }`}
                    >
                      #{p.number} {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 打席結果ボタン */}
              {selectedBatter && !pendingResult && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-4">
                  <h2 className="text-sm font-bold text-slate-700 mb-3">
                    {batter?.name}（#{batter?.number}）の打席結果
                  </h2>
                  <div className="grid grid-cols-4 gap-2">
                    {RESULT_CONFIG.map(({ result, label, color, hasRbi }) => (
                      <button
                        key={result}
                        onClick={() => selectResult(result, hasRbi)}
                        className={`${color} text-white text-sm font-bold py-3 rounded-lg transition-transform active:scale-95`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 打点入力 */}
              {pendingResult && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4">
                  <h2 className="text-sm font-bold text-blue-800 mb-3">
                    {batter?.name}：{RESULT_CONFIG.find(r => r.result === pendingResult.result)?.label} — 打点を入力
                  </h2>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setRbiCount(c => Math.max(0, c - 1))} className="w-10 h-10 bg-white border border-blue-200 rounded-full text-blue-700 text-xl font-bold hover:bg-blue-50">−</button>
                    <span className="text-3xl font-bold text-blue-800 w-10 text-center tabular-nums">{rbiCount}</span>
                    <button onClick={() => setRbiCount(c => c + 1)} className="w-10 h-10 bg-blue-600 rounded-full text-white text-xl font-bold hover:bg-blue-700">+</button>
                    <div className="flex gap-2 ml-auto">
                      <button onClick={() => { setPendingResult(null); setRbiCount(0) }} className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700">キャンセル</button>
                      <button
                        onClick={() => applyAndSave(pendingResult.result, rbiCount)}
                        disabled={saving}
                        className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors"
                      >
                        確定
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 直前のアクション表示 */}
              {lastAction && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
                  ✓ {lastAction}
                </div>
              )}

              {/* 本日の打撃成績 */}
              {activePlayers.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <h2 className="text-sm font-bold text-slate-700">本日の打撃成績</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-sm w-full">
                      <thead>
                        <tr className="text-xs text-slate-500 bg-slate-50">
                          <th className="px-3 py-2 text-left font-medium">選手</th>
                          <th className="px-2 py-2 text-center font-medium">打席</th>
                          <th className="px-2 py-2 text-center font-medium">打数</th>
                          <th className="px-2 py-2 text-center font-medium">安打</th>
                          <th className="px-2 py-2 text-center font-medium">HR</th>
                          <th className="px-2 py-2 text-center font-medium">打点</th>
                          <th className="px-2 py-2 text-center font-medium">打率</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {activePlayers.map(p => {
                          const b = batting[p.id] ?? defaultBatting(p.id)
                          return (
                            <tr
                              key={p.id}
                              className={`hover:bg-slate-50 cursor-pointer ${selectedBatter === p.id ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                setSelectedBatter(prev => prev === p.id ? null : p.id)
                                setPendingResult(null)
                                setRbiCount(0)
                              }}
                            >
                              <td className="px-3 py-2 font-medium text-slate-700">{p.name}</td>
                              <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{b.pa}</td>
                              <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{b.ab}</td>
                              <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{b.h}</td>
                              <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{b.hr}</td>
                              <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{b.rbi}</td>
                              <td className="px-2 py-2 text-center font-mono text-slate-700">{calcAvg(b)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ===== 投球タブ ===== */}
      {activeTab === 'pitching' && (
        <>
          {/* 投手選択 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-4 py-4">
            <h2 className="text-sm font-bold text-slate-700 mb-2">投手を選択</h2>
            <div className="flex flex-wrap gap-2">
              {data.players.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    togglePitcher(p.id)
                    setSelectedPitcher(prev => prev === p.id ? null : p.id)
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    selectedPitcher === p.id
                      ? 'bg-orange-500 text-white border-orange-500 ring-2 ring-orange-300'
                      : pitcherIds.includes(p.id)
                        ? 'bg-orange-50 text-orange-700 border-orange-200 hover:border-orange-400'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-orange-300'
                  }`}
                >
                  #{p.number} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* 選択中投手の入力 */}
          {selectedPitcher && (() => {
            const p = data.players.find(x => x.id === selectedPitcher)
            if (!p) return null
            const pitch = pitching[selectedPitcher] ?? defaultPitching()

            const statRows: { label: string; field: 'ipOuts' | 'h' | 'r' | 'er' | 'bb' | 'k' | 'hr' }[] = [
              { label: '投球回 (IP)', field: 'ipOuts' },
              { label: '被安打',      field: 'h'      },
              { label: '失点',        field: 'r'      },
              { label: '自責点',      field: 'er'     },
              { label: '与四球',      field: 'bb'     },
              { label: '奪三振',      field: 'k'      },
              { label: '被本塁打',    field: 'hr'     },
            ]

            return (
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-slate-700 mb-3">{p.name}（#{p.number}）の投球</h2>
                <div className="divide-y divide-slate-100">
                  {statRows.map(({ label, field }) => (
                    <div key={field} className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-700 w-28">{label}</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => incPitcherStat(selectedPitcher, field, -1)} className="w-8 h-8 bg-slate-100 rounded-full text-slate-700 font-bold hover:bg-slate-200 transition-colors">−</button>
                        <span className="text-lg font-bold text-slate-800 w-10 text-center tabular-nums font-mono">
                          {field === 'ipOuts' ? formatIp(pitch.ipOuts) : pitch[field]}
                        </span>
                        <button onClick={() => incPitcherStat(selectedPitcher, field, 1)} className="w-8 h-8 bg-blue-500 rounded-full text-white font-bold hover:bg-blue-600 transition-colors">+</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100">
                  {(['win', 'loss', 'save', 'hold'] as const).map(field => (
                    <label key={field} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pitch[field]}
                        onChange={e => setPitcherFlag(selectedPitcher, field, e.target.checked)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm text-slate-600">{field === 'win' ? '勝' : field === 'loss' ? '負' : field === 'save' ? 'S' : 'H'}</span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* 本日の投球成績 */}
          {pitcherIds.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-700">本日の投球成績</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="text-xs text-slate-500 bg-slate-50">
                      <th className="px-3 py-2 text-left font-medium">投手</th>
                      <th className="px-2 py-2 text-center font-medium">IP</th>
                      <th className="px-2 py-2 text-center font-medium">被安打</th>
                      <th className="px-2 py-2 text-center font-medium">失点</th>
                      <th className="px-2 py-2 text-center font-medium">自責</th>
                      <th className="px-2 py-2 text-center font-medium">四球</th>
                      <th className="px-2 py-2 text-center font-medium">三振</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {pitcherIds.map(pid => {
                      const p = data.players.find(x => x.id === pid)
                      if (!p) return null
                      const pitch = pitching[pid] ?? defaultPitching()
                      return (
                        <tr
                          key={pid}
                          className={`hover:bg-slate-50 cursor-pointer ${selectedPitcher === pid ? 'bg-orange-50' : ''}`}
                          onClick={() => setSelectedPitcher(prev => prev === pid ? null : pid)}
                        >
                          <td className="px-3 py-2 font-medium text-slate-700">{p.name}</td>
                          <td className="px-2 py-2 text-center font-mono text-slate-600">{formatIp(pitch.ipOuts)}</td>
                          <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{pitch.h}</td>
                          <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{pitch.r}</td>
                          <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{pitch.er}</td>
                          <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{pitch.bb}</td>
                          <td className="px-2 py-2 text-center text-slate-600 tabular-nums">{pitch.k}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
