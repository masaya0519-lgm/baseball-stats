import { BattingLine, PitchingLine } from './types'

export interface BattingTotals {
  games: number
  pa: number
  ab: number
  h: number
  d: number
  t: number
  hr: number
  rbi: number
  r: number
  bb: number
  hbp: number
  k: number
  sb: number
  cs: number
  sac: number
  sf: number
  tb: number
  avg: number   // 打率
  obp: number   // 出塁率
  slg: number   // 長打率
  ops: number   // OPS
  iso: number   // 長打率 - 打率
  bbPct: number // 四球率
  kPct: number  // 三振率
  sbPct: number // 盗塁成功率
}

export interface PitchingTotals {
  games: number
  ipOuts: number
  ip: number
  h: number
  r: number
  er: number
  bb: number
  k: number
  hr: number
  wins: number
  losses: number
  saves: number
  holds: number
  era: number    // 防御率
  whip: number   // WHIP
  k9: number     // K/9
  bb9: number    // BB/9
  kbb: number    // K/BB
}

export function sumBatting(lines: BattingLine[]): BattingTotals {
  const s = lines.reduce(
    (acc, l) => ({
      pa: acc.pa + l.pa,
      ab: acc.ab + l.ab,
      h: acc.h + l.h,
      d: acc.d + l.d,
      t: acc.t + l.t,
      hr: acc.hr + l.hr,
      rbi: acc.rbi + l.rbi,
      r: acc.r + l.r,
      bb: acc.bb + l.bb,
      hbp: acc.hbp + l.hbp,
      k: acc.k + l.k,
      sb: acc.sb + l.sb,
      cs: acc.cs + l.cs,
      sac: acc.sac + l.sac,
      sf: acc.sf + l.sf,
    }),
    { pa: 0, ab: 0, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 }
  )

  // TB = 1B*1 + 2B*2 + 3B*3 + HR*4 = H + D + T*2 + HR*3
  const tb = s.h + s.d + s.t * 2 + s.hr * 3
  const avg = s.ab > 0 ? s.h / s.ab : 0
  const obpDen = s.ab + s.bb + s.hbp + s.sf
  const obp = obpDen > 0 ? (s.h + s.bb + s.hbp) / obpDen : 0
  const slg = s.ab > 0 ? tb / s.ab : 0

  return {
    games: lines.length,
    ...s,
    tb,
    avg,
    obp,
    slg,
    ops: obp + slg,
    iso: slg - avg,
    bbPct: s.pa > 0 ? s.bb / s.pa : 0,
    kPct: s.pa > 0 ? s.k / s.pa : 0,
    sbPct: s.sb + s.cs > 0 ? s.sb / (s.sb + s.cs) : 0,
  }
}

export function sumPitching(lines: PitchingLine[]): PitchingTotals {
  const s = lines.reduce(
    (acc, l) => ({
      ipOuts: acc.ipOuts + l.ipOuts,
      h: acc.h + l.h,
      r: acc.r + l.r,
      er: acc.er + l.er,
      bb: acc.bb + l.bb,
      k: acc.k + l.k,
      hr: acc.hr + l.hr,
      wins: acc.wins + (l.win ? 1 : 0),
      losses: acc.losses + (l.loss ? 1 : 0),
      saves: acc.saves + (l.save ? 1 : 0),
      holds: acc.holds + (l.hold ? 1 : 0),
    }),
    { ipOuts: 0, h: 0, r: 0, er: 0, bb: 0, k: 0, hr: 0, wins: 0, losses: 0, saves: 0, holds: 0 }
  )

  const ip = s.ipOuts / 3
  const era = ip > 0 ? (s.er / ip) * 9 : 0
  const whip = ip > 0 ? (s.h + s.bb) / ip : 0
  const k9 = ip > 0 ? (s.k / ip) * 9 : 0
  const bb9 = ip > 0 ? (s.bb / ip) * 9 : 0

  return {
    games: lines.length,
    ...s,
    ip,
    era,
    whip,
    k9,
    bb9,
    kbb: s.bb > 0 ? s.k / s.bb : s.k,
  }
}

export function formatAvg(n: number): string {
  if (isNaN(n) || n === 0) return '.000'
  return n.toFixed(3).replace('0.', '.')
}

export function formatPct(n: number): string {
  return (n * 100).toFixed(1) + '%'
}

export function formatIp(ipOuts: number): string {
  const full = Math.floor(ipOuts / 3)
  const partial = ipOuts % 3
  return `${full}.${partial}`
}

export function ipInputToOuts(val: string): number {
  const parts = val.split('.')
  const full = parseInt(parts[0] || '0', 10) || 0
  const partial = parseInt(parts[1] || '0', 10) || 0
  return full * 3 + Math.min(partial, 2)
}

export function fmt2(n: number): string {
  if (isNaN(n)) return '0.00'
  return n.toFixed(2)
}

export function fmt1(n: number): string {
  if (isNaN(n)) return '0.0'
  return n.toFixed(1)
}
