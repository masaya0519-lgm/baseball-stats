'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { AppData, Player, Game, BattingLine, PitchingLine } from '@/lib/types'
import { sampleData } from '@/lib/sampleData'

const STORAGE_KEY = 'baseball-stats-v1'

const emptyData: AppData = {
  teamName: 'My Team',
  players: [],
  games: [],
  batting: [],
  pitching: [],
}

interface DataContextType {
  data: AppData
  setTeamName: (name: string) => void
  addPlayer: (player: Omit<Player, 'id' | 'createdAt'>) => Player
  updatePlayer: (player: Player) => void
  deletePlayer: (id: string) => void
  addGame: (game: Omit<Game, 'id'>) => Game
  deleteGame: (id: string) => void
  upsertBattingLines: (lines: Omit<BattingLine, 'id'>[]) => void
  upsertPitchingLines: (lines: Omit<PitchingLine, 'id'>[]) => void
  exportData: () => void
  importData: (json: string) => boolean
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setData(JSON.parse(stored))
      } else {
        setData(sampleData)
      }
    } catch {
      setData(sampleData)
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }, [data, loaded])

  const uid = () => crypto.randomUUID()

  const setTeamName = useCallback((name: string) => {
    setData(d => ({ ...d, teamName: name }))
  }, [])

  const addPlayer = useCallback((p: Omit<Player, 'id' | 'createdAt'>): Player => {
    const player: Player = { ...p, id: uid(), createdAt: new Date().toISOString() }
    setData(d => ({ ...d, players: [...d.players, player] }))
    return player
  }, [])

  const updatePlayer = useCallback((p: Player) => {
    setData(d => ({ ...d, players: d.players.map(x => x.id === p.id ? p : x) }))
  }, [])

  const deletePlayer = useCallback((id: string) => {
    setData(d => ({
      ...d,
      players: d.players.filter(p => p.id !== id),
      batting: d.batting.filter(b => b.playerId !== id),
      pitching: d.pitching.filter(p => p.playerId !== id),
    }))
  }, [])

  const addGame = useCallback((g: Omit<Game, 'id'>): Game => {
    const game: Game = { ...g, id: uid() }
    setData(d => ({ ...d, games: [...d.games, game] }))
    return game
  }, [])

  const deleteGame = useCallback((id: string) => {
    setData(d => ({
      ...d,
      games: d.games.filter(g => g.id !== id),
      batting: d.batting.filter(b => b.gameId !== id),
      pitching: d.pitching.filter(p => p.gameId !== id),
    }))
  }, [])

  const upsertBattingLines = useCallback((lines: Omit<BattingLine, 'id'>[]) => {
    const withIds = lines.map(l => ({ ...l, id: uid() }))
    setData(d => {
      const gameId = lines[0]?.gameId
      const playerIds = new Set(lines.map(l => l.playerId))
      const filtered = d.batting.filter(
        b => !(b.gameId === gameId && playerIds.has(b.playerId))
      )
      return { ...d, batting: [...filtered, ...withIds] }
    })
  }, [])

  const upsertPitchingLines = useCallback((lines: Omit<PitchingLine, 'id'>[]) => {
    const withIds = lines.map(l => ({ ...l, id: uid() }))
    setData(d => {
      const gameId = lines[0]?.gameId
      const playerIds = new Set(lines.map(l => l.playerId))
      const filtered = d.pitching.filter(
        p => !(p.gameId === gameId && playerIds.has(p.playerId))
      )
      return { ...d, pitching: [...filtered, ...withIds] }
    })
  }, [])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `baseball-stats-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [data])

  const importData = useCallback((json: string): boolean => {
    try {
      const parsed = JSON.parse(json) as AppData
      if (!parsed.teamName || !Array.isArray(parsed.players)) return false
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
      addGame, deleteGame,
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
