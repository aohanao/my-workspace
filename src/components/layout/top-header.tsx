'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Sparkles, Menu, X, Check } from 'lucide-react'
import { getDaysLeft } from '@/lib/utils'
import { StorageService } from '@/lib/storage'
import { CalendarModal } from './calendar-modal'

interface TopHeaderProps {
  onOpenMobileMenu?: () => void
}

export function TopHeader({ onOpenMobileMenu }: TopHeaderProps) {
  const [greeting, setGreeting] = useState('')
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [careerDays, setCareerDays] = useState({ days: 0, isOverdue: false })
  const [thesisDays, setThesisDays] = useState({ days: 0, isOverdue: false })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // 倒计时日期修改弹窗
  const [editingDeadline, setEditingDeadline] = useState<{
    type: 'career' | 'thesis'
    title: string
    currentDate: string
  } | null>(null)
  const [tempDate, setTempDate] = useState('')

  const refreshDeadlines = () => {
    const careerDate = StorageService.getCareerDeadline()
    const thesisDate = StorageService.getThesisDraftDeadline()
    setCareerDays(getDaysLeft(careerDate))
    setThesisDays(getDaysLeft(thesisDate))
  }

  useEffect(() => {
    const updateTime = () => {
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

      const hh = String(hours).padStart(2, '0')
      const mm = String(now.getMinutes()).padStart(2, '0')
      const ss = String(now.getSeconds()).padStart(2, '0')
      setCurrentTime(`${hh}:${mm}:${ss}`)
    }

    updateTime()
    const timer = setInterval(updateTime, 1000)
    refreshDeadlines()

    const handleOpenCalendar = () => setIsCalendarOpen(true)
    const handleDataUpdate = () => refreshDeadlines()

    window.addEventListener('workspace-open-calendar', handleOpenCalendar)
    window.addEventListener('workspace-data-updated', handleDataUpdate)
    return () => {
      clearInterval(timer)
      window.removeEventListener('workspace-open-calendar', handleOpenCalendar)
      window.removeEventListener('workspace-data-updated', handleDataUpdate)
    }
  }, [])

  const handleOpenEditCareer = () => {
    const current = StorageService.getCareerDeadline()
    setTempDate(current)
    setEditingDeadline({
      type: 'career',
      title: '调整秋招冲刺目标日期',
      currentDate: current,
    })
  }

  const handleOpenEditThesis = () => {
    const current = StorageService.getThesisDraftDeadline()
    setTempDate(current)
    setEditingDeadline({
      type: 'thesis',
      title: '调整论文初稿目标日期',
      currentDate: current,
    })
  }

  const handleSaveDeadline = () => {
    if (!tempDate || !editingDeadline) return
    if (editingDeadline.type === 'career') {
      StorageService.saveCareerDeadline(tempDate)
    } else {
      StorageService.saveThesisDraftDeadline(tempDate)
    }
    refreshDeadlines()
    setEditingDeadline(null)
    window.dispatchEvent(new CustomEvent('workspace-data-updated'))
  }

  return (
    <>
      <header className="h-16 border-b border-white/[0.08] bg-black/35 backdrop-blur-2xl px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0 gap-3">
        {/* 左侧：移动端菜单 + 醒目问候与实时日期时间胶囊（同一行无换行堆叠） */}
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors shrink-0"
            title="打开菜单"
            aria-label="打开菜单"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* 醒目问候语 */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] inline-block" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-tight whitespace-nowrap">
              {greeting}
            </h2>
          </div>

          <div className="h-3.5 w-[1px] bg-white/[0.1] hidden md:block shrink-0" />

          {/* 实时日期与时钟入口胶囊按钮 */}
          <button
            onClick={() => setIsCalendarOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer group shrink-0"
            title="点击打开日历视图，记录心情与待办"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-colors shrink-0" />
            <span className="font-medium text-zinc-200">{currentDate}</span>
            {currentTime && (
              <span className="font-mono font-bold text-cyan-400 tracking-wider">
                {currentTime}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08] font-sans group-hover:text-white transition-colors">
              日历
            </span>
          </button>
        </div>

        {/* 右侧：移动端实时时间 + 双核心倒计时胶囊（同一行） */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {currentTime && (
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="sm:hidden flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-cyan-400"
              title="点击打开日历"
            >
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{currentTime}</span>
            </button>
          )}

          {/* 秋招冲刺倒计时胶囊 (点击修改目标日期) */}
          <button
            onClick={handleOpenEditCareer}
            title="点击修改秋招冲刺目标日期"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all group cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
            <span className="text-zinc-400 group-hover:text-zinc-200 font-normal hidden md:inline">秋招冲刺:</span>
            <span className="font-mono font-bold text-white">
              {careerDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </button>

          {/* 论文初稿倒计时胶囊 (点击修改目标日期) */}
          <button
            onClick={handleOpenEditThesis}
            title="点击修改论文初稿目标日期"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all group cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors shrink-0" />
            <span className="text-zinc-400 group-hover:text-zinc-200 font-normal hidden md:inline">论文初稿:</span>
            <span className="font-mono font-bold text-white">
              {thesisDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </button>
        </div>
      </header>

      {/* 修改倒计时目标日期轻量模态框 */}
      {editingDeadline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#0e121a] border border-white/[0.12] rounded-2xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{editingDeadline.title}</span>
              </h3>
              <button
                onClick={() => setEditingDeadline(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-zinc-400 block">选择新的截止/目标日期：</label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-black/50 border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-white/30 font-mono"
              />
              {tempDate && (
                <p className="text-[11px] text-zinc-500 font-mono">
                  设定后距今倒计：{getDaysLeft(tempDate).days} 天
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setEditingDeadline(null)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveDeadline}
                className="px-4 py-1.5 text-xs font-semibold linear-btn-primary rounded-full flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>确认修改</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 交互式日历弹窗 */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />
    </>
  )
}
