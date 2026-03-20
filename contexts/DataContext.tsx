'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { AppData, Player, Game, BattingLine, PitchingLine } from '@/lib/types'
import { sampleData } from '@/lib/sampleData'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const STORAGE_KEY = 'baseball-stats-v1'

const emptyData: AppData = {
  teamName: '草野球チーム',
  players: [],
  games: [],
  batting: [],
  pitching: [],
}

// ---- DB row → TypeScript型 変換 ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPlayer(r: any): Player {
  return { id: r.id, name: r.name, number: r.number, position: r.position, createdAt: r.created_at }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toGame(r: any): Game {
  return {
    id: r.id, date: r.date, opponent: r.opponent, location: r.location ?? '',
    result: r.result, teamScore: r.team_score, opponentScore: r.opponent_score, notes: r.notes ?? '',
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBatting(r: any): BattingLine {
  return {
    id: r.id, playerId: r.player_id, gameId: r.game_id,
    pa: r.pa, ab: r.ab, h: r.h, d: r.d, t: r.t, hr: r.hr,
    rbi: r.rbi, r: r.r, bb: r.bb, hbp: r.hbp, k: r.k,
    sb: r.sb, cs: r.cs, sac: r.sac, sf: r.sf,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toPitching(r: any): PitchingLine {
  return {
    id: r.id, playerId: r.player_id, gameId: r.game_id, ipOuts: r.ip_outs,
    h: r.h, r: r.r, er: r.er, bb: r.bb, k: r.k, hr: r.hr,
    win: r.win, loss: r.loss, save: r.save, hold: r.hold,
  }
}

interface DataContextType {
  data: AppData
  setTeamName: (name: string) => Promise<void>
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => Promise<Player>
  updatePlayer: (player: Player) => Promise<void>
  deletePlayer: (id: string) => Promise<void>
  addGame: (game: Omit<Game, 'id'>) => Promise<Game>
  updateGame: (id: string, updates: Partial<Omit<Game, 'id'>>) => Promise<void>
  deleteGame: (id: string) => Promise<void>
  upsertBattingLines: (lines: Omit<BattingLine, 'id'>[]) => Promise<void>
  upsertPitchingLines: (lines: Omit<PitchingLine, 'id'>[]) => Promise<void>
  exportData: () => void
  importData: (json: string) => Promise<boolean>
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [loaded, setLoaded] = useState(false)

  // ---- 初回ロード ----
  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      // Supabaseからロード
      ;(async () => {
        const [
          { data: players },
          { data: games },
          { data: batting },
          { data: pitching },
          { data: settings },
        ] = await Promise.all([
          supabase.from('players').select('*'),
          supabase.from('games').select('*').order('date', { ascending: false }),
          supabase.from('batting').select('*'),
          supabase.from('pitching').select('*'),
          supabase.from('settings').select('*'),
        ])
        const teamName = settings?.find(s => s.key === 'team_name')?.value ?? '草野球チーム'
        setData({
          teamName,
          players: (players ?? []).map(toPlayer),
          games: (games ?? []).map(toGame),
          batting: (batting ?? []).map(toBatting),
          pitching: (pitching ?? []).map(toPitching),
        })
        setLoaded(true)
      })()
    } else {
      // localStorage fallback
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        setData(stored ? JSON.parse(stored) : sampleData)
      } catch {
        setData(sampleData)
      }
      setLoaded(true)
    }
  }, [])

  // localStorage fallback: データ変更時に保存
  useEffect(() => {
    if (loaded && !isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, loaded])

  const uid = () => crypto.randomUUID()

  // ---- setTeamName ----
  const setTeamName = useCallback(async (name: string) => {
    setData(d => ({ ...d, teamName: name }))
    if (supabase) {
      await supabase.from('settings').upsert({ key: 'team_name', value: name })
    }
  }, [])

  // ---- addPlayer ----
  const addPlayer = useCallback(async (p: Omit<Player, 'id' | 'createdAt'>): Promise<Player> => {
    const player: Player = { ...p, id: uid(), createdAt: new Date().toISOString() }
    if (supabase) {
      const { error } = await supabase.from('players').insert({
        id: player.id, name: player.name, number: player.number,
        position: player.position, created_at: player.createdAt,
      })
      if (error) throw error
    }
    setData(d => ({ ...d, players: [...d.players, player] }))
    return player
  }, [])

  // ---- updatePlayer ----
  const updatePlayer = useCallback(async (p: Player) => {
    if (supabase) {
      const { error } = await supabase.from('players')
        .update({ name: p.name, number: p.number, position: p.position })
        .eq('id', p.id)
      if (error) throw error
    }
    setData(d => ({ ...d, players: d.players.map(x => x.id === p.id ? p : x) }))
  }, [])

  // ---- deletePlayer ----
  const deletePlayer = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('players').delete().eq('id', id)
      if (error) throw error
    }
    setData(d => ({
      ...d,
      players: d.players.filter(p => p.id !== id),
      batting: d.batting.filter(b => b.playerId !== id),
      pitching: d.pitching.filter(p => p.playerId !== id),
    }))
  }, [])

  // ---- addGame ----
  const addGame = useCallback(async (g: Omit<Game, 'id'>): Promise<Game> => {
    const game: Game = { ...g, id: uid() }
    if (supabase) {
      const { error } = await supabase.from('games').insert({
        id: game.id, date: game.date, opponent: game.opponent,
        location: game.location, result: game.result,
        team_score: game.teamScore, opponent_score: game.opponentScore, notes: game.notes,
      })
      if (error) throw error
    }
    setData(d => ({ ...d, games: [game, ...d.games] }))
    return game
  }, [])

  // ---- updateGame ----
  const updateGame = useCallback(async (id: string, updates: Partial<Omit<Game, 'id'>>) => {
    if (supabase) {
      const dbUpdates: Record<string, unknown> = {}
      if (updates.date !== undefined) dbUpdates.date = updates.date
      if (updates.opponent !== undefined) dbUpdates.opponent = updates.opponent
      if (updates.location !== undefined) dbUpdates.location = updates.location
      if (updates.result !== undefined) dbUpdates.result = updates.result
      if (updates.teamScore !== undefined) dbUpdates.team_score = updates.teamScore
      if (updates.opponentScore !== undefined) dbUpdates.opponent_score = updates.opponentScore
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      await supabase.from('games').update(dbUpdates).eq('id', id)
    }
    setData(d => ({ ...d, games: d.games.map(g => g.id === id ? { ...g, ...updates } : g) }))
  }, [])

  // ---- deleteGame ----
  const deleteGame = useCallback(async (id: string) => {
    if (supabase) {
      const { error } = await supabase.from('games').delete().eq('id', id)
      if (error) throw error
    }
    setData(d => ({
      ...d,
      games: d.games.filter(g => g.id !== id),
      batting: d.batting.filter(b => b.gameId !== id),
      pitching: d.pitching.filter(p => p.gameId !== id),
    }))
  }, [])

  // ---- upsertBattingLines ----
  const upsertBattingLines = useCallback(async (lines: Omit<BattingLine, 'id'>[]) => {
    const withIds = lines.map(l => ({ ...l, id: uid() }))
    if (supabase && lines.length > 0) {
      const gameId = lines[0].gameId
      const playerIds = lines.map(l => l.playerId)
      await supabase.from('batting').delete()
        .eq('game_id', gameId).in('player_id', playerIds)
      const { error } = await supabase.from('batting').insert(
        withIds.map(l => ({
          id: l.id, player_id: l.playerId, game_id: l.gameId,
          pa: l.pa, ab: l.ab, h: l.h, d: l.d, t: l.t, hr: l.hr,
          rbi: l.rbi, r: l.r, bb: l.bb, hbp: l.hbp, k: l.k,
          sb: l.sb, cs: l.cs, sac: l.sac, sf: l.sf,
        }))
      )
      if (error) throw error
    }
    setData(d => {
      const gameId = lines[0]?.gameId
      const playerIds = new Set(lines.map(l => l.playerId))
      return {
        ...d,
        batting: [
          ...d.batting.filter(b => !(b.gameId === gameId && playerIds.has(b.playerId))),
          ...withIds,
        ],
      }
    })
  }, [])

  // ---- upsertPitchingLines ----
  const upsertPitchingLines = useCallback(async (lines: Omit<PitchingLine, 'id'>[]) => {
    const withIds = lines.map(l => ({ ...l, id: uid() }))
    if (supabase && lines.length > 0) {
      const gameId = lines[0].gameId
      const playerIds = lines.map(l => l.playerId)
      await supabase.from('pitching').delete()
        .eq('game_id', gameId).in('player_id', playerIds)
      const { error } = await supabase.from('pitching').insert(
        withIds.map(l => ({
          id: l.id, player_id: l.playerId, game_id: l.gameId, ip_outs: l.ipOuts,
          h: l.h, r: l.r, er: l.er, bb: l.bb, k: l.k, hr: l.hr,
          win: l.win, loss: l.loss, save: l.save, hold: l.hold,
        }))
      )
      if (error) throw error
    }
    setData(d => {
      const gameId = lines[0]?.gameId
      const playerIds = new Set(lines.map(l => l.playerId))
      return {
        ...d,
        pitching: [
          ...d.pitching.filter(p => !(p.gameId === gameId && playerIds.has(p.playerId))),
          ...withIds,
        ],
      }
    })
  }, [])

  // ---- exportData ----
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baseball-stats-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  // ---- importData (全データ置き換え) ----
  const importData = useCallback(async (json: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(json) as AppData
      if (!parsed.teamName || !Array.isArray(parsed.players)) return false

      if (supabase) {
        // 全テーブルをクリアして再投入
        await supabase.from('batting').delete().neq('id', '')
        await supabase.from('pitching').delete().neq('id', '')
        await supabase.from('games').delete().neq('id', '')
        await supabase.from('players').delete().neq('id', '')
        await supabase.from('settings').upsert({ key: 'team_name', value: parsed.teamName })

        if (parsed.players.length > 0) {
          await supabase.from('players').insert(
            parsed.players.map(p => ({ id: p.id, name: p.name, number: p.number, position: p.position, created_at: p.createdAt }))
          )
        }
        if (parsed.games.length > 0) {
          await supabase.from('games').insert(
            parsed.games.map(g => ({
              id: g.id, date: g.date, opponent: g.opponent, location: g.location,
              result: g.result, team_score: g.teamScore, opponent_score: g.opponentScore, notes: g.notes,
            }))
          )
        }
        if (parsed.batting.length > 0) {
          await supabase.from('batting').insert(
            parsed.batting.map(b => ({
              id: b.id, player_id: b.playerId, game_id: b.gameId,
              pa: b.pa, ab: b.ab, h: b.h, d: b.d, t: b.t, hr: b.hr,
              rbi: b.rbi, r: b.r, bb: b.bb, hbp: b.hbp, k: b.k,
              sb: b.sb, cs: b.cs, sac: b.sac, sf: b.sf,
            }))
          )
        }
        if (parsed.pitching.length > 0) {
          await supabase.from('pitching').insert(
            parsed.pitching.map(p => ({
              id: p.id, player_id: p.playerId, game_id: p.gameId, ip_outs: p.ipOuts,
              h: p.h, r: p.r, er: p.er, bb: p.bb, k: p.k, hr: p.hr,
              win: p.win, loss: p.loss, save: p.save, hold: p.hold,
            }))
          )
        }
      }
      setData(parsed)
      return true
    } catch {
      return false
    }
  }, [])

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-400 text-sm">読み込み中...</div>
      </div>
    )
  }

  return (
    <DataContext.Provider value={{
      data, setTeamName,
      addPlayer, updatePlayer, deletePlayer,
      addGame, updateGame, deleteGame,
      upsertBattingLines, upsertPitchingLines,
      exportData, importData,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
