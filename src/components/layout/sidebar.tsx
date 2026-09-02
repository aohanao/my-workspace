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
  Download,
  Upload,
  Layers,
  Cloud,
  Check,
  RefreshCw,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'
import { StorageService, CloudSyncStatus } from '@/lib/storage'

const NAV_ITEMS = [
  { href: '/', label: '控制中枢', sub: 'Overview', icon: LayoutDashboard },
  { href: '/career', label: '秋招求职管家', sub: 'Pipeline', icon: Briefcase },
  { href: '/career/analytics', label: '秋招量化大屏', sub: 'Analytics', icon: BarChart3, highlight: true },
  { href: '/research', label: '科研与硕士毕业', sub: 'Research & Thesis', icon: GraduationCap },
  { href: '/study', label: '知识与算法复盘', sub: 'Study & LeetCode', icon: Brain },
  { href: '/life', label: '生活与习惯管理', sub: 'Life & Habits', icon: Smile },
]

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncInfo(StorageService.getSyncStatus())
    }

    updateSyncStatus()
    window.addEventListener('workspace-sync-status', updateSyncStatus)
    return () => window.removeEventListener('workspace-sync-status', updateSyncStatus)
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

  const handleExportData = () => {
    const data = StorageService.exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workspace-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        await StorageService.importAllData(json)
        alert('数据恢复成功并已同步！')
        window.location.reload()
      } catch (err) {
        alert('文件格式错误，导入失败！')
      }
    }
    reader.readAsText(file)
  }

  return (
    <aside className="w-64 h-screen border-r border-white/[0.07] bg-[#090b10]/95 backdrop-blur-2xl flex flex-col justify-between select-none z-30 transition-all duration-300">
      <div className="overflow-y-auto flex-1">
        {/* Logo 区域 */}
        <div className="p-4 sm:p-5 border-b border-white/[0.06] flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={onClose}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-white/20 group-hover:scale-105 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm tracking-tight text-white flex items-center gap-1.5 font-sans">
                Workspace <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">PRO</span>
              </h1>
              <p className="text-[11px] text-zinc-500 font-normal">Academic & Career OS</p>
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
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative border',
                  isActive
                    ? 'bg-white/[0.08] text-white border-white/[0.1] shadow-sm font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] border-transparent',
                  item.highlight && !isActive && 'text-blue-400 bg-blue-500/[0.03]'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform group-hover:scale-110',
                      isActive ? 'text-blue-400' : 'text-zinc-500 group-hover:text-zinc-300'
                    )}
                  />
                  <div>
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                </div>

                {item.highlight && !isActive && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 底部功能区：Supabase 云端状态与数据备份 */}
      <div className="p-3 border-t border-white/[0.06] space-y-2.5 shrink-0 bg-[#090b10]">
        {/* 云端同步卡片 */}
        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
          <div className="flex items-center justify-between font-medium mb-1">
            <div className="flex items-center gap-1.5">
              {syncInfo.isConfigured ? (
                syncInfo.status === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                ) : syncInfo.status === 'error' ? (
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                )
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-500" />
              )}

              <span className="text-[11px] text-zinc-300 font-medium">
                {syncInfo.isConfigured
                  ? syncInfo.status === 'syncing'
                    ? '云端同步中...'
                    : syncInfo.status === 'error'
                    ? '云同步异常'
                    : 'Supabase 已连接'
                  : '本地缓存模式'}
              </span>
            </div>

            {syncInfo.isConfigured && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="立即同步到云端"
                className="p-1 rounded text-zinc-400 hover:text-blue-400 hover:bg-white/[0.05] transition-colors"
              >
                <RefreshCw className={cn('w-3 h-3', isSyncing && 'animate-spin')} />
              </button>
            )}
          </div>

          <p className="text-[10px] text-zinc-500 leading-tight">
            {syncInfo.isConfigured
              ? syncInfo.lastSyncTime
                ? `最近同步: ${syncInfo.lastSyncTime}`
                : '多端数据实时云持久化'
              : '配置 Supabase 可开启多端云同步'}
          </p>
        </div>

        {/* 导入 / 导出 */}
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportData}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="恢复数据"
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] flex items-center justify-center gap-1.5 border border-white/[0.06] transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>导入</span>
          </button>
          <button
            onClick={handleExportData}
            title="导出备份"
            className="flex-1 py-1.5 px-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] flex items-center justify-center gap-1.5 border border-white/[0.06] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出</span>
          </button>
        </div>
      </div>
    </aside>
  )
}
