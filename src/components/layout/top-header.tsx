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

    refreshDeadlines()

    const handleOpenCalendar = () => setIsCalendarOpen(true)
    const handleDataUpdate = () => refreshDeadlines()

    window.addEventListener('workspace-open-calendar', handleOpenCalendar)
    window.addEventListener('workspace-data-updated', handleDataUpdate)
    return () => {
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
      <header className="h-16 sm:h-18 border-b border-white/[0.08] bg-black/35 backdrop-blur-2xl px-4 sm:px-7 flex items-center justify-between sticky top-0 z-30 shrink-0">
        {/* 左侧：移动端菜单 + 醒目问候与 DeepSeek 胶囊式日历入口 */}
        <div className="flex items-center gap-3.5 min-w-0">
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
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] inline-block shrink-0" />
              <span>{greeting}</span>
            </h2>

            {/* 可点击日历入口胶囊按钮 */}
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-xs sm:text-sm text-zinc-300 hover:text-white flex items-center gap-1.5 mt-0.5 cursor-pointer transition-colors group"
              title="点击打开日历视图，记录心情与待办"
            >
              <Calendar className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white group-hover:scale-110 transition-transform shrink-0" />
              <span className="font-medium text-zinc-200 group-hover:underline underline-offset-4">{currentDate}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.1] font-sans hidden xs:inline group-hover:bg-white/[0.12] transition-colors">
                打开日历
              </span>
            </button>
          </div>
        </div>

        {/* 右侧：双核心可点击修改日期倒计时胶囊 */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* 秋招冲刺倒计时胶囊 (点击修改目标日期) */}
          <button
            onClick={handleOpenEditCareer}
            title="点击修改秋招冲刺目标日期"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all group cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-zinc-400 group-hover:text-zinc-200 font-normal hidden sm:inline">秋招冲刺:</span>
            <span className="font-mono font-bold text-white">
              {careerDays.days} <span className="text-[11px] font-normal text-zinc-500">天</span>
            </span>
          </button>

          {/* 论文初稿倒计时胶囊 (点击修改目标日期) */}
          <button
            onClick={handleOpenEditThesis}
            title="点击修改论文初稿目标日期"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-xs text-zinc-300 hover:text-white transition-all group cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-colors" />
            <span className="text-zinc-400 group-hover:text-zinc-200 font-normal hidden sm:inline">论文初稿:</span>
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
