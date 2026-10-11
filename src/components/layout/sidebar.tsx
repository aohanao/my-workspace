'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  GraduationCap,
  Brain,
  Smile,
  Layers,
  Cloud,
  Check,
  RefreshCw,
  X,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { StorageService, CloudSyncStatus } from '@/lib/storage'
import { CloudConfigModal } from './cloud-config-modal'
import { getSupabase } from '@/lib/supabase'

const NAV_ITEMS = [
  { href: '/', label: '总览', icon: LayoutDashboard },
  { href: '/career', label: '求职', icon: Briefcase },
  { href: '/career/analytics', label: '求职分析', icon: BarChart3 },
  { href: '/research', label: '论文与研究', icon: GraduationCap },
  { href: '/study', label: '学习复习', icon: Brain },
  { href: '/life', label: '生活', icon: Smile },
]

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [syncInfo, setSyncInfo] = useState<{
    status: CloudSyncStatus
    isConfigured: boolean
    lastSyncTime: string | null
  }>({
    status: 'unconfigured',
    isConfigured: false,
    lastSyncTime: null,
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncInfo(StorageService.getSyncStatus())
    }

    updateSyncStatus()
    window.addEventListener('workspace-sync-status', updateSyncStatus)
    window.addEventListener('workspace-data-updated', updateSyncStatus)
    return () => {
      window.removeEventListener('workspace-sync-status', updateSyncStatus)
      window.removeEventListener('workspace-data-updated', updateSyncStatus)
    }
  }, [])

  const handleManualSync = async () => {
    setIsSyncing(true)
    if (syncInfo.isConfigured) {
      await StorageService.pushAllToCloud()
    } else {
      await StorageService.initCloudSync()
    }
    setSyncInfo(StorageService.getSyncStatus())
    setIsSyncing(false)
  }

  const handleSignOut = async () => {
    const client = getSupabase()
    if (!client) return
    const { error } = await client.auth.signOut({ scope: 'local' })
    if (error) {
      alert('退出失败，请稍后重试。')
      return
    }
    StorageService.clearLocalCache()
    onClose?.()
  }

  return (
    <>
      <aside className="w-64 h-screen border-r border-white/[0.08] bg-black/40 backdrop-blur-2xl flex flex-col justify-between select-none z-30 transition-all duration-300">
        <div className="overflow-y-auto flex-1">
          {/* Logo 区域 (DeepSeek 极简 AI 纯白与深空钛金质感) */}
          <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
              <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 border border-white/40 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-black stroke-[2.2]" />
              </div>
              <div>
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5 font-sans">
                  我的工作台
                </h1>
                <p className="text-xs text-zinc-400 font-normal">把重要的事放在眼前</p>
              </div>
            </Link>

            {isMobile && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* 导航项 */}
          <nav className="p-3 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all group relative border',
                    isActive
                      ? 'bg-white/[0.1] text-white border-white/[0.14] shadow-sm font-semibold'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                      )}
                    />
                    <div>
                      <span className="tracking-tight">{item.label}</span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* 底部功能区：Supabase 云端状态与数据备份 */}
        <div className="p-3 border-t border-white/[0.06] space-y-2.5 shrink-0 bg-[#07090e]">
          {/* 云端同步卡片 */}
          <div
            onClick={() => setIsConfigModalOpen(true)}
            className="p-2.5 rounded-xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.08] text-xs cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between font-medium mb-1">
              <div className="flex items-center gap-2">
                {syncInfo.isConfigured ? (
                  syncInfo.status === 'syncing' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-300 animate-spin" />
                  ) : syncInfo.status === 'error' ? (
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  )
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-500" />
                )}

                <span className="text-xs text-zinc-300 font-medium group-hover:text-white">
                  {syncInfo.isConfigured
                    ? syncInfo.status === 'syncing'
                      ? '云端同步中...'
                      : syncInfo.status === 'error'
                      ? '云同步异常'
                      : 'Supabase 已连接'
                    : '本地缓存模式 (点击配置)'}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {syncInfo.isConfigured && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleManualSync()
                    }}
                    disabled={isSyncing}
                    title="立即同步到云端"
                    className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors"
                  >
                    <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
                  </button>
                )}
                <Settings className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200" />
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 leading-tight">
              {syncInfo.isConfigured
                ? syncInfo.lastSyncTime
                  ? `最近同步: ${syncInfo.lastSyncTime}`
                  : '多端数据实时云持久化'
                : '点击可填入 Supabase Key 开启多端同步'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-400 hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" />
            退出当前设备
          </button>
        </div>
      </aside>

      {/* 云端配置弹窗 */}
      <CloudConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false)
          setSyncInfo(StorageService.getSyncStatus())
        }}
      />
    </>
  )
}
