export interface Player {
  id: string
  name: string
  number: number
  position: string
  createdAt: string
}

export interface Game {
  id: string
  date: string
  opponent: string
  location: string
  result: 'W' | 'L' | 'D'
  teamScore: number
  opponentScore: number
  notes: string
}

export interface BattingLine {
  id: string
  playerId: string
  gameId: string
  pa: number    // 打席
  ab: number    // 打数
  h: number     // 安打
  d: number     // 二塁打
  t: number     // 三塁打
  hr: number    // 本塁打
  rbi: number   // 打点
  r: number     // 得点
  bb: number    // 四球
  hbp: number   // 死球
  k: number     // 三振
  sb: number    // 盗塁
  cs: number    // 盗塁死
  sac: number   // 犠打
  sf: number    // 犠飛
}

export interface PitchingLine {
  id: string
  playerId: string
  gameId: string
  ipOuts: number  // アウト数で記録 (3 = 1回)
  h: number       // 被安打
  r: number       // 失点
  er: number      // 自責点
  bb: number      // 与四球
  k: number       // 奪三振
  hr: number      // 被本塁打
  win: boolean
  loss: boolean
  save: boolean
  hold: boolean
}

export interface AppData {
  teamName: string
  players: Player[]
  games: Game[]
  batting: BattingLine[]
  pitching: PitchingLine[]
}
