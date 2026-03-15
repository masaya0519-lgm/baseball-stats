'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { sumBatting, sumPitching, formatAvg, fmt2, fmt1 } from '@/lib/stats'
import LeaderboardCard from '@/components/LeaderboardCard'
import Modal from '@/components/Modal'

interface GalleryPhoto {
  id: string
  url: string
  caption: string
}

const HERO_KEY = 'baseball-hero-v1'
const GALLERY_KEY = 'baseball-gallery-v1'

export default function Dashboard() {
  const { data, setTeamName } = useData()
  const [editTeam, setEditTeam] = useState(false)
  const [teamInput, setTeamInput] = useState('')

  // Hero image
  const [heroImage, setHeroImage] = useState('')
  const [editHero, setEditHero] = useState(false)
  const [heroInput, setHeroInput] = useState('')

  // Photo gallery
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')

  useEffect(() => {
    setHeroImage(localStorage.getItem(HERO_KEY) ?? '')
    try {
      const g = localStorage.getItem(GALLERY_KEY)
      setPhotos(g ? JSON.parse(g) : [])
    } catch {
      setPhotos([])
    }
  }, [])

  function saveHero() {
    setHeroImage(heroInput)
    localStorage.setItem(HERO_KEY, heroInput)
    setEditHero(false)
  }

  function clearHero() {
    setHeroImage('')
    setHeroInput('')
    localStorage.removeItem(HERO_KEY)
    setEditHero(false)
  }

  function addPhoto() {
    if (!newPhotoUrl.trim()) return
    const updated = [...photos, { id: crypto.randomUUID(), url: newPhotoUrl.trim(), caption: newPhotoCaption.trim() }]
    setPhotos(updated)
    localStorage.setItem(GALLERY_KEY, JSON.stringify(updated))
    setNewPhotoUrl('')
    setNewPhotoCaption('')
    setShowAddPhoto(false)
  }

  function removePhoto(id: string) {
    const updated = photos.filter(p => p.id !== id)
    setPhotos(updated)
    localStorage.setItem(GALLERY_KEY, JSON.stringify(updated))
  }

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
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm">
        {heroImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={heroImage} alt="チームバナー" className="w-full h-52 sm:h-64 object-cover" />
        ) : (
          <div className="w-full h-52 sm:h-64 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 flex items-center justify-center">
            <span className="text-9xl opacity-10 select-none">⚾</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-5 py-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-sm leading-tight">{data.teamName}</h1>
              <p className="text-white/75 text-sm mt-1">
                {data.games.length}試合 ／ {wins}勝 {losses}敗{draws > 0 ? ` ${draws}分` : ''}
              </p>
            </div>
            <button
              onClick={openEditTeam}
              className="text-white/60 hover:text-white transition-colors text-sm shrink-0 pb-0.5"
              title="チーム名を編集"
            >
              ✏️
            </button>
          </div>
        </div>
        <button
          onClick={() => { setHeroInput(heroImage); setEditHero(true) }}
          className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white text-xs px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm"
        >
          📷 カバー写真
        </button>
      </div>

      {/* Action row */}
      <div className="flex justify-end">
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

      {/* Photo Gallery */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-700">チームフォト</h2>
          <button
            onClick={() => setShowAddPhoto(true)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ＋ 追加
          </button>
        </div>
        {photos.length === 0 ? (
          <button
            onClick={() => setShowAddPhoto(true)}
            className="w-full bg-white rounded-xl border border-dashed border-slate-200 hover:border-blue-300 px-6 py-10 text-center transition-colors group"
          >
            <div className="text-4xl mb-2">📸</div>
            <p className="text-slate-400 text-sm group-hover:text-blue-500 transition-colors">チームの写真を追加しましょう</p>
          </button>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-slate-100 aspect-square shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption || 'チーム写真'} className="w-full h-full object-cover" />
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-white text-xs px-2 py-1.5 truncate">
                    {photo.caption}
                  </div>
                )}
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  title="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
            <button onClick={() => setEditTeam(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
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

      {/* Hero image modal */}
      <Modal open={editHero} onClose={() => setEditHero(false)} title="カバー写真を設定">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">画像URL</label>
            <input
              type="text"
              value={heroInput}
              onChange={e => setHeroInput(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">GoogleフォトやImgurなど外部サービスの画像URLを貼り付けてください</p>
          </div>
          {heroInput && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={heroInput}
              alt="プレビュー"
              className="w-full h-32 object-cover rounded-lg bg-slate-100"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <div className="flex gap-2 justify-end">
            {heroImage && (
              <button onClick={clearHero} className="px-4 py-2 text-sm text-red-500 hover:text-red-700 mr-auto">
                削除
              </button>
            )}
            <button onClick={() => setEditHero(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
              キャンセル
            </button>
            <button onClick={saveHero} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              保存
            </button>
          </div>
        </div>
      </Modal>

      {/* Add photo modal */}
      <Modal open={showAddPhoto} onClose={() => setShowAddPhoto(false)} title="写真を追加">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">画像URL *</label>
            <input
              type="text"
              value={newPhotoUrl}
              onChange={e => setNewPhotoUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">キャプション（任意）</label>
            <input
              type="text"
              value={newPhotoCaption}
              onChange={e => setNewPhotoCaption(e.target.value)}
              placeholder="例: 2025年春季大会"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {newPhotoUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={newPhotoUrl}
              alt="プレビュー"
              className="w-full h-32 object-cover rounded-lg bg-slate-100"
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddPhoto(false)} className="px-4 py-2 text-sm text-slate-600">
              キャンセル
            </button>
            <button
              onClick={addPhoto}
              disabled={!newPhotoUrl.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              追加
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
