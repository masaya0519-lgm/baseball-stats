import type { Metadata } from 'next'
import './globals.css'
import { DataProvider } from '@/contexts/DataContext'
import Nav from '@/components/Nav'

export const metadata: Metadata = {
  title: '草野球成績管理',
  description: '草野球チームの個人成績を管理するアプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <DataProvider>
          <Nav />
          <main className="max-w-7xl mx-auto px-4 py-6">
            {children}
          </main>
        </DataProvider>
      </body>
    </html>
  )
}
