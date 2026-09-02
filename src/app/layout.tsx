import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AppShell } from '@/components/layout/app-shell'

export const metadata: Metadata = {
  title: '个人工作台 | Master & Career OS',
  description: '专为硕士研究生打造的一体化科研进度、秋招求职与生活管理工作台',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090b10',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className="dark">
      <body className="bg-background text-foreground antialiased selection:bg-blue-500/30 selection:text-blue-200">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
