'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import { TopHeader } from './top-header'
import { TechCursorEffect } from './tech-cursor-effect'
import { StorageService } from '@/lib/storage'

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // 路由变化时自动关闭移动端菜单
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // 应用初始化时启动云端数据同步
  useEffect(() => {
    StorageService.initCloudSync()
  }, [])

  return (
    <div className="min-h-screen flex w-full bg-background text-foreground overflow-hidden relative">
      {/* 科技感鼠标光影跟随与网格粒子 */}
      <TechCursorEffect />

      {/* PC 端固定侧边栏 (lg 及以上显示) */}
      <div className="hidden lg:block shrink-0">
        <Sidebar />
      </div>

      {/* 移动端/平板端抽屉侧边栏与遮罩 (lg 以下显示) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* 抽屉容器 */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <Sidebar isMobile onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 主工作区 */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <TopHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
