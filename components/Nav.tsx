'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useData } from '@/contexts/DataContext'

const links = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/players', label: '選手一覧' },
  { href: '/games', label: '試合記録' },
]

export default function Nav() {
  const pathname = usePathname()
  const { data, exportData, importData } = useData()
  const [menuOpen, setMenuOpen] = useState(false)

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const ok = importData(ev.target?.result as string)
      if (!ok) alert('読み込みに失敗しました')
      else alert('データを読み込みました')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <nav className="bg-blue-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            ⚾ {data.teamName}
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? 'bg-blue-700 text-white'
                    : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="ml-3 flex items-center gap-2">
              <button
                onClick={exportData}
                className="px-3 py-1.5 text-xs bg-blue-800 hover:bg-blue-700 rounded text-blue-200 hover:text-white transition-colors"
              >
                エクスポート
              </button>
              <label className="px-3 py-1.5 text-xs bg-blue-800 hover:bg-blue-700 rounded text-blue-200 hover:text-white transition-colors cursor-pointer">
                インポート
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded text-blue-200 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-3 flex flex-col gap-1">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  pathname === l.href ? 'bg-blue-700' : 'text-blue-200'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button onClick={exportData} className="text-left px-3 py-2 text-sm text-blue-200">
              エクスポート
            </button>
            <label className="px-3 py-2 text-sm text-blue-200 cursor-pointer">
              インポート
              <input type="file" accept=".json" className="hidden" onChange={handleImport} />
            </label>
          </div>
        )}
      </div>
    </nav>
  )
}
