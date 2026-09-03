'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Sparkles, Plus, Menu } from 'lucide-react'
import { getDaysLeft, WORKSPACE_DEADLINES } from '@/lib/utils'
import { StorageService, CloudSyncStatus } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { CloudConfigModal } from './cloud-config-modal'

interface TopHeaderProps {
  onOpenMobileMenu?: () => void
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
  const [greeting, setGreeting] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [careerDays, setCareerDays] = useState({ days: 0, isOverdue: false })
  const [thesisDays, setThesisDays] = useState({ days: 0, isOverdue: false })
  const [quickNoteOpen, setQuickNoteOpen] = useState(false)
  const [quickNoteText, setQuickNoteText] = useState('')
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('unconfigured')
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours()
    if (hours < 6) setGreeting('夜深了，早点休息 🌙')
    else if (hours < 12) setGreeting('早上好，保持专注 ☀️')
    else if (hours < 18) setGreeting('下午好，高效推进 ☕')
    else setGreeting('晚上好，复盘今日 🌌')

    const dateOptions: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    }
    setCurrentDate(now.toLocaleDateString('zh-CN', dateOptions))

    const thesisInfo = StorageService.getThesis()
    setCareerDays(getDaysLeft(WORKSPACE_DEADLINES.careerSprint))
    setThesisDays(getDaysLeft(thesisInfo.blindReviewDate || WORKSPACE_DEADLINES.blindReview))

    const updateSync = () => {
      setSyncStatus(StorageService.getSyncStatus().status)
    }
    updateSync()
    window.addEventListener('workspace-sync-status', updateSync)
    window.addEventListener('workspace-data-updated', updateSync)
    return () => {
      window.removeEventListener('workspace-sync-status', updateSync)
      window.removeEventListener('workspace-data-updated', updateSync)
    }
  }, [])

  const handleSaveQuickNote = () => {
    if (!quickNoteText.trim()) return
    const notes = StorageService.getNotes()
    const newNote = {
      id: `note-${Date.now()}`,
      content: quickNoteText.trim(),
      createdAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      tags: ['速记'],
    }
    StorageService.saveNotes([newNote, ...notes])
    setQuickNoteText('')
    setQuickNoteOpen(false)
  }

  return (
    <>
      <header className="h-14 sm:h-16 border-b border-white/[0.06] bg-[#090b10]/80 backdrop-blur-xl px-3.5 sm:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
        {/* 左侧：移动端汉堡菜单 + 问候与日期 */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
            title="打开菜单"
            aria-label="打开菜单"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-medium text-white tracking-tight truncate">
              {greeting}
            </h2>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 font-sans truncate">
              <Calendar className="w-3 h-3 text-zinc-400 shrink-0" />
              <span className="truncate">{currentDate}</span>
            </p>
          </div>
        </div>

        {/* 右侧：倒计时胶囊与速记 */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 云端连接状态小点（点击可弹出配置） */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            title="点击查看/配置云端数据库"
            className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] text-[10px] text-zinc-400 transition-colors"
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                syncStatus === 'synced' && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
                syncStatus === 'syncing' && 'bg-blue-400 animate-ping',
                syncStatus === 'error' && 'bg-rose-400',
                syncStatus === 'unconfigured' && 'bg-zinc-500'
              )}
            />
            <span className="hidden sm:inline">
              {syncStatus === 'synced' ? 'Supabase' : syncStatus === 'syncing' ? '同步中' : '配置云端'}
            </span>
          </button>

          {/* 秋招倒计时 */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/[0.08] text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400 font-normal hidden md:inline">秋招冲刺:</span>
            <span className="font-mono font-semibold text-white">
              {careerDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </div>

          {/* 12月硕士中期考核倒计时 */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400/90 font-normal">12月中期:</span>
            <span className="font-mono font-bold text-amber-200">
              {getDaysLeft(WORKSPACE_DEADLINES.midTerm).days} <span className="text-[11px] font-normal text-amber-400/60">天</span>
            </span>
          </div>

          {/* 论文初稿倒计时 */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-white/[0.08] text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400 font-normal">初稿完成:</span>
            <span className="font-mono font-semibold text-white">
              {thesisDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </div>

          {/* 灵感速记按钮 */}
          <div className="relative">
            <button
              onClick={() => setQuickNoteOpen(!quickNoteOpen)}
              className="flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl linear-btn-primary text-xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline sm:inline">速记一条</span>
              <span className="inline xs:hidden sm:hidden">速记</span>
            </button>

            {/* 速记弹窗 */}
            {quickNoteOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
                  onClick={() => setQuickNoteOpen(false)}
                />
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-11 left-3 sm:left-auto sm:w-80 p-4 bg-[#12151f] border border-white/[0.12] shadow-2xl rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 快速捕获灵感 / 待办
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">INBOX</span>
                  </div>
                  <textarea
                    value={quickNoteText}
                    onChange={(e) => setQuickNoteText(e.target.value)}
                    placeholder="记录导师交代、面试考点、临时待办..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 resize-none placeholder:text-zinc-600 leading-relaxed"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-2 mt-3">
                    <button
                      onClick={() => setQuickNoteOpen(false)}
                      className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveQuickNote}
                      className="px-4 py-1.5 text-xs font-medium linear-btn-primary rounded-lg"
                    >
                      保存便签
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 云端配置弹窗 */}
      <CloudConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false)
          setSyncStatus(StorageService.getSyncStatus().status)
        }}
      />
    </>
  )
}
