'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Sparkles, Plus, Menu } from 'lucide-react'
import { getDaysLeft, WORKSPACE_DEADLINES } from '@/lib/utils'
import { StorageService, CloudSyncStatus } from '@/lib/storage'
import { cn } from '@/lib/utils'
import { CloudConfigModal } from './cloud-config-modal'
import { CalendarModal } from './calendar-modal'

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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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
      <header className="h-16 sm:h-18 border-b border-cyan-500/15 bg-[#060912]/85 backdrop-blur-xl px-4 sm:px-7 flex items-center justify-between sticky top-0 z-30 shrink-0">
        {/* 左侧：移动端汉堡菜单 + 醒目问候与可交互日历 */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors"
            title="打开菜单"
            aria-label="打开菜单"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            {/* 醒目问候语 */}
            <h2 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] inline-block shrink-0" />
              <span>{greeting}</span>
            </h2>

            {/* 可点击日历入口按钮 */}
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-xs sm:text-sm text-cyan-400/90 hover:text-cyan-300 flex items-center gap-1.5 mt-0.5 font-mono cursor-pointer transition-colors group"
              title="点击打开日历视图，记录心情与待办"
            >
              <Calendar className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
              <span className="underline decoration-cyan-500/40 underline-offset-2 font-medium">{currentDate}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-sans hidden xs:inline">
                打开日历
              </span>
            </button>
          </div>
        </div>

        {/* 右侧：双核心倒计时胶囊与速记按钮 (已移除12月中期单独倒计时) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* 云端连接状态点 */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            title="点击查看/配置云端数据库"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.08] text-xs text-zinc-400 transition-colors"
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                syncStatus === 'synced' && 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]',
                syncStatus === 'syncing' && 'bg-cyan-400 animate-ping',
                syncStatus === 'error' && 'bg-rose-400',
                syncStatus === 'unconfigured' && 'bg-zinc-500'
              )}
            />
            <span className="hidden sm:inline font-mono">
              {syncStatus === 'synced' ? 'Supabase' : syncStatus === 'syncing' ? '同步中' : '配置云端'}
            </span>
          </button>

          {/* 秋招冲刺倒计时 */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/[0.08] text-xs text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-zinc-400 font-normal hidden md:inline">秋招冲刺:</span>
            <span className="font-mono font-bold text-white">
              {careerDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </div>

          {/* 论文初稿倒计时 */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/[0.08] text-xs text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400 font-normal">论文初稿:</span>
            <span className="font-mono font-bold text-white">
              {thesisDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </div>

          {/* 灵感速记按钮 */}
          <div className="relative">
            <button
              onClick={() => setQuickNoteOpen(!quickNoteOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl linear-btn-primary text-xs sm:text-sm font-medium"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden xs:inline">速记一条</span>
              <span className="inline xs:hidden">速记</span>
            </button>

            {/* 速记弹窗 */}
            {quickNoteOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
                  onClick={() => setQuickNoteOpen(false)}
                />
                <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-12 left-3 sm:left-auto sm:w-84 p-4 bg-[#0d111d] border border-cyan-500/30 shadow-2xl rounded-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> 快速捕获灵感 / 备忘
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">INBOX</span>
                  </div>
                  <textarea
                    value={quickNoteText}
                    onChange={(e) => setQuickNoteText(e.target.value)}
                    placeholder="记录导师交代、面试考点、临时安排..."
                    rows={3}
                    className="w-full text-xs p-3 rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500 resize-none placeholder:text-zinc-500 leading-relaxed"
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
                      className="px-4 py-1.5 text-xs font-semibold linear-btn-primary rounded-xl"
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

      {/* 交互式日历弹窗 (可查看日历、添加心情、记录待办) */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  )
}
