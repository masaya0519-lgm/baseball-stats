import { AppData } from './types'

export const sampleData: AppData = {
  teamName: '草野球チーム',
  players: [
    { id: 'p1', name: '田中 太郎', number: 1, position: 'P/SS', createdAt: '2025-01-01' },
    { id: 'p2', name: '佐藤 次郎', number: 7, position: 'CF', createdAt: '2025-01-01' },
    { id: 'p3', name: '鈴木 三郎', number: 23, position: '3B', createdAt: '2025-01-01' },
    { id: 'p4', name: '高橋 四郎', number: 34, position: '1B', createdAt: '2025-01-01' },
    { id: 'p5', name: '伊藤 五郎', number: 55, position: 'C', createdAt: '2025-01-01' },
    { id: 'p6', name: '渡辺 六郎', number: 12, position: 'RF', createdAt: '2025-01-01' },
  ],
  games: [
    { id: 'g1', date: '2025-04-06', opponent: 'タイガース', location: '市民球場', result: 'W', teamScore: 7, opponentScore: 3, notes: '' },
    { id: 'g2', date: '2025-04-13', opponent: 'イーグルス', location: '公園グラウンド', result: 'L', teamScore: 2, opponentScore: 5, notes: '' },
    { id: 'g3', date: '2025-04-20', opponent: 'ベアーズ', location: '市民球場', result: 'W', teamScore: 11, opponentScore: 4, notes: '' },
    { id: 'g4', date: '2025-05-04', opponent: 'ホークス', location: '河川敷', result: 'D', teamScore: 4, opponentScore: 4, notes: '' },
  ],
  batting: [
    // Game 1
    { id: 'b1', playerId: 'p1', gameId: 'g1', pa: 4, ab: 4, h: 2, d: 1, t: 0, hr: 0, rbi: 1, r: 1, bb: 0, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b2', playerId: 'p2', gameId: 'g1', pa: 4, ab: 3, h: 1, d: 0, t: 0, hr: 1, rbi: 2, r: 2, bb: 1, hbp: 0, k: 0, sb: 1, cs: 0, sac: 0, sf: 0 },
    { id: 'b3', playerId: 'p3', gameId: 'g1', pa: 4, ab: 4, h: 1, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b4', playerId: 'p4', gameId: 'g1', pa: 4, ab: 4, h: 3, d: 1, t: 0, hr: 1, rbi: 3, r: 2, bb: 0, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b5', playerId: 'p5', gameId: 'g1', pa: 4, ab: 3, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 1, sf: 0 },
    { id: 'b6', playerId: 'p6', gameId: 'g1', pa: 3, ab: 3, h: 1, d: 0, t: 1, hr: 0, rbi: 1, r: 2, bb: 0, hbp: 0, k: 0, sb: 2, cs: 0, sac: 0, sf: 0 },
    // Game 2
    { id: 'b7', playerId: 'p1', gameId: 'g2', pa: 4, ab: 4, h: 1, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b8', playerId: 'p2', gameId: 'g2', pa: 4, ab: 3, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 1, bb: 1, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b9', playerId: 'p3', gameId: 'g2', pa: 3, ab: 3, h: 1, d: 0, t: 1, hr: 0, rbi: 1, r: 1, bb: 0, hbp: 0, k: 0, sb: 1, cs: 0, sac: 0, sf: 0 },
    { id: 'b10', playerId: 'p4', gameId: 'g2', pa: 4, ab: 4, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b11', playerId: 'p5', gameId: 'g2', pa: 3, ab: 3, h: 1, d: 1, t: 0, hr: 0, rbi: 1, r: 0, bb: 0, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b12', playerId: 'p6', gameId: 'g2', pa: 3, ab: 3, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    // Game 3
    { id: 'b13', playerId: 'p1', gameId: 'g3', pa: 5, ab: 4, h: 3, d: 0, t: 0, hr: 1, rbi: 4, r: 2, bb: 1, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b14', playerId: 'p2', gameId: 'g3', pa: 5, ab: 4, h: 2, d: 1, t: 0, hr: 0, rbi: 1, r: 1, bb: 0, hbp: 1, k: 0, sb: 2, cs: 0, sac: 0, sf: 0 },
    { id: 'b15', playerId: 'p3', gameId: 'g3', pa: 5, ab: 4, h: 1, d: 0, t: 0, hr: 0, rbi: 0, r: 1, bb: 1, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b16', playerId: 'p4', gameId: 'g3', pa: 5, ab: 5, h: 2, d: 1, t: 0, hr: 1, rbi: 3, r: 3, bb: 0, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b17', playerId: 'p5', gameId: 'g3', pa: 4, ab: 4, h: 1, d: 0, t: 0, hr: 0, rbi: 1, r: 1, bb: 0, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b18', playerId: 'p6', gameId: 'g3', pa: 5, ab: 4, h: 3, d: 1, t: 0, hr: 0, rbi: 2, r: 2, bb: 1, hbp: 0, k: 0, sb: 1, cs: 0, sac: 0, sf: 0 },
    // Game 4
    { id: 'b19', playerId: 'p1', gameId: 'g4', pa: 4, ab: 3, h: 1, d: 1, t: 0, hr: 0, rbi: 1, r: 1, bb: 1, hbp: 0, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b20', playerId: 'p2', gameId: 'g4', pa: 5, ab: 4, h: 2, d: 0, t: 0, hr: 0, rbi: 1, r: 1, bb: 1, hbp: 0, k: 1, sb: 1, cs: 1, sac: 0, sf: 0 },
    { id: 'b21', playerId: 'p3', gameId: 'g4', pa: 4, ab: 4, h: 2, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 1, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b22', playerId: 'p4', gameId: 'g4', pa: 4, ab: 4, h: 1, d: 0, t: 0, hr: 1, rbi: 2, r: 1, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b23', playerId: 'p5', gameId: 'g4', pa: 4, ab: 4, h: 0, d: 0, t: 0, hr: 0, rbi: 0, r: 0, bb: 0, hbp: 0, k: 2, sb: 0, cs: 0, sac: 0, sf: 0 },
    { id: 'b24', playerId: 'p6', gameId: 'g4', pa: 3, ab: 2, h: 1, d: 0, t: 0, hr: 0, rbi: 0, r: 1, bb: 0, hbp: 1, k: 0, sb: 0, cs: 0, sac: 0, sf: 0 },
  ],
  pitching: [
    { id: 'pi1', playerId: 'p1', gameId: 'g1', ipOuts: 21, h: 4, r: 3, er: 3, bb: 2, k: 8, hr: 0, win: true, loss: false, save: false, hold: false },
    { id: 'pi2', playerId: 'p1', gameId: 'g2', ipOuts: 15, h: 7, r: 5, er: 5, bb: 3, k: 4, hr: 1, win: false, loss: true, save: false, hold: false },
    { id: 'pi3', playerId: 'p1', gameId: 'g3', ipOuts: 18, h: 5, r: 4, er: 3, bb: 1, k: 6, hr: 0, win: true, loss: false, save: false, hold: false },
    { id: 'pi4', playerId: 'p1', gameId: 'g4', ipOuts: 21, h: 6, r: 4, er: 4, bb: 2, k: 5, hr: 1, win: false, loss: false, save: false, hold: false },
  ],
}
