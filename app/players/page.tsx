'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useData } from '@/contexts/DataContext'
import { sumBatting, sumPitching, formatAvg, fmt2, formatIp } from '@/lib/stats'
import Modal from '@/components/Modal'
import { Player } from '@/lib/types'

const POSITIONS = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'P/SS', 'P/OF', 'IF', 'OF']

type SortKey = 'name' | 'avg' | 'ops' | 'hr' | 'rbi' | 'h' | 'sb' | 'era' | 'k'
type SortDir = 'asc' | 'desc'

export default function PlayersPage() {
  const { data, addPlayer, updatePlayer, deletePlayer } = useData()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Player | null>(null)
  const [form, setForm] = useState({ name: '', number: '', position: 'OF' })
  const [sortKey, setSortKey] = useState<SortKey>('avg')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(() => {
    return data.players.map(p => {
      const b = sumBatting(data.batting.filter(x => x.playerId === p.id))
      const pi = sumPitching(data.pitching.filter(x => x.playerId === p.id))
      return { player: p, b, pi }
    })
  }, [data])

  const sorted = useMemo(() => {
    const getValue = (row: typeof rows[0]) => {
      switch (sortKey) {
        case 'name': return row.player.name
        case 'avg': return row.b.avg
        case 'ops': return row.b.ops
        case 'hr': return row.b.hr
        case 'rbi': return row.b.rbi
        case 'h': return row.b.h
        case 'sb': return row.b.sb
        case 'era': return row.pi.era
        case 'k': return row.pi.k
        default: return 0
      }
    }
    return [...rows].sort((a, b) => {
      const va = getValue(a)
      const vb = getValue(b)
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va)
      return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
    })
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'era' ? 'asc' : 'desc')
    }
  }

  function SortTh({ label, sk }: { label: string; sk: SortKey }) {
    const active = sortKey === sk
    return (
      <th
        className={`px-3 py-2 text-right cursor-pointer select-none whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-500'} hover:text-blue-600`}
        onClick={() => toggleSort(sk)}
      >
        {label}{active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
      </th>
    )
  }

  function openAdd() {
    setEditTarget(null)
    setForm({ name: '', number: '', position: 'OF' })
    setModalOpen(true)
  }

  function openEdit(p: Player) {
    setEditTarget(p)
    setForm({ name: p.name, number: String(p.number), position: p.position })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    if (editTarget) {
      await updatePlayer({ ...editTarget, name: form.name.trim(), number: parseInt(form.number) || 0, position: form.position })
    } else {
      await addPlayer({ name: form.name.trim(), number: parseInt(form.number) || 0, position: form.position })
    }
    setModalOpen(false)
  }

  async function handleDelete(p: Player) {
    if (confirm(`${p.name} を削除しますか？関連する全成績も削除されます。`)) {
      await deletePlayer(p.id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">選手一覧</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          ＋ 選手を追加
        </button>
      </div>

      {/* Players table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">#</th>
                <th
                  className={`px-3 py-2 text-left cursor-pointer select-none ${sortKey === 'name' ? 'text-blue-600' : 'text-slate-500'} hover:text-blue-600 font-medium`}
                  onClick={() => toggleSort('name')}
                >
                  選手名{sortKey === 'name' ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </th>
                <th className="px-3 py-2 text-left text-slate-500 font-medium">POS</th>
                <th className="px-3 py-2 text-right text-slate-500 font-medium">G</th>
                <SortTh label="打率" sk="avg" />
                <SortTh label="OPS" sk="ops" />
                <SortTh label="H" sk="h" />
                <SortTh label="HR" sk="hr" />
                <SortTh label="RBI" sk="rbi" />
                <SortTh label="SB" sk="sb" />
                <SortTh label="ERA" sk="era" />
                <SortTh label="K" sk="k" />
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-10 text-center text-slate-400">
                    選手がいません。追加してください。
                  </td>
                </tr>
              )}
              {sorted.map(({ player, b, pi }) => (
                <tr key={player.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2.5 text-slate-400 font-mono">{player.number}</td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/players/${player.id}`}
                      className="font-medium text-blue-700 hover:text-blue-900"
                    >
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 text-xs">{player.position}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{b.games}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-medium text-slate-800">
                    {b.ab > 0 ? formatAvg(b.avg) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                    {b.ab > 0 ? fmt2(b.ops) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{b.h || 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{b.hr || 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{b.rbi || 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">{b.sb || 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {pi.ipOuts > 0 ? fmt2(pi.era) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-600">
                    {pi.ipOuts > 0 ? pi.k : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(player)}
                        className="text-slate-400 hover:text-blue-600 px-1"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(player)}
                        className="text-slate-400 hover:text-red-500 px-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IP legend note */}
      {sorted.some(s => s.pi.ipOuts > 0) && (
        <p className="text-xs text-slate-400 text-right">
          ERA = 防御率 (自責点/投球回×9)　IP = {sorted.filter(s => s.pi.ipOuts > 0).map(s => `${s.player.name}: ${formatIp(s.pi.ipOuts)}`).join(', ')}
        </p>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? '選手を編集' : '選手を追加'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">選手名 *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="例: 田中 太郎"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">背番号</label>
              <input
                type="number"
                value={form.number}
                onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                placeholder="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ポジション</label>
              <select
                value={form.position}
                onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {POSITIONS.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              {editTarget ? '更新' : '追加'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
