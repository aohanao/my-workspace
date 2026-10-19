'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Check, X } from 'lucide-react'
import { HabitItem } from '@/types'
import { getLocalDateKey } from '@/lib/utils'

interface Props {
  habits: HabitItem[]
  today: string
  onClose: () => void
}

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const dateKey = (year: number, month: number, day: number) => getLocalDateKey(new Date(year, month, day))

export default function HabitHistoryModal({ habits, today, onClose }: Props) {
  const recordedDates = useMemo(() => habits.flatMap((habit) => Object.keys(habit.logs || {}).filter((date) => habit.logs[date] && /^\d{4}-\d{2}-\d{2}$/.test(date))), [habits])
  const firstDate = useMemo(() => [...recordedDates, ...habits.map((habit) => habit.createdAt).filter((date): date is string => !!date)].sort()[0] || today, [recordedDates, habits, today])
  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(() => new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1, 1))
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const monthStart = dateKey(year, monthIndex, 1)
  const nextMonthStart = dateKey(year, monthIndex + 1, 1)
  const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const calendarDays = Array.from({ length: offset + daysInMonth }, (_, index) => index < offset ? null : dateKey(year, monthIndex, index - offset + 1))
  const activeHabits = (date: string) => habits.filter((habit) => date >= (habit.createdAt || firstDate) && (!habit.archivedAt || date <= habit.archivedAt))
  const completedCount = (date: string) => activeHabits(date).filter((habit) => !!habit.logs?.[date]).length
  const availableDays = calendarDays.filter((date): date is string => !!date && date >= firstDate && date <= today)
  const totalChecks = availableDays.reduce((total, date) => total + completedCount(date), 0)
  const totalExpected = availableDays.reduce((total, date) => total + activeHabits(date).length, 0)
  const selectedHabits = activeHabits(selectedDate)
  const selectedDone = selectedHabits.filter((habit) => !!habit.logs?.[selectedDate]).length
  const canGoBack = monthStart > firstDate.slice(0, 7) + '-01'
  const canGoForward = nextMonthStart <= today

  const changeMonth = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1)
    setMonth(next)
    const first = dateKey(next.getFullYear(), next.getMonth(), 1)
    const last = dateKey(next.getFullYear(), next.getMonth() + 1, 0)
    setSelectedDate(today >= first && today <= last ? today : last < today ? last : first)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section role="dialog" aria-modal="true" aria-label="历史打卡日历" className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.12] bg-[#0c101c] p-4 sm:p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-white"><CalendarDays className="w-5 h-5 text-cyan-400" />历史打卡日历</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">按日期查看完成情况与缺漏；已有记录从 {firstDate} 起展示。</p>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭历史打卡日历" className="p-2 rounded-xl text-zinc-400 hover:bg-white/[0.08] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)] gap-5">
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2 mb-4">
              <button type="button" onClick={() => changeMonth(-1)} disabled={!canGoBack} aria-label="上个月" className="p-2 rounded-lg text-zinc-300 hover:bg-white/[0.08] disabled:opacity-30"><ChevronLeft className="w-5 h-5" /></button>
              <div className="text-center"><div className="text-white font-bold">{year} 年 {monthIndex + 1} 月</div><div className="text-xs text-zinc-400">本月完成 {totalChecks} / {totalExpected} 次 · {totalExpected ? Math.round(totalChecks / totalExpected * 100) : 0}%</div></div>
              <button type="button" onClick={() => changeMonth(1)} disabled={!canGoForward} aria-label="下个月" className="p-2 rounded-lg text-zinc-300 hover:bg-white/[0.08] disabled:opacity-30"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
              {weekdays.map((day) => <div key={day} className="text-xs text-zinc-500 py-1">周{day}</div>)}
              {calendarDays.map((date, index) => {
                if (!date) return <div key={`empty-${index}`} />
                const active = date >= firstDate && date <= today
                const total = active ? activeHabits(date).length : 0
                const done = active ? completedCount(date) : 0
                const missing = total - done
                return <button key={date} type="button" disabled={!active} onClick={() => setSelectedDate(date)} title={active ? `${date}：完成 ${done}，缺漏 ${missing}` : '无历史记录'} className={`min-h-14 sm:min-h-16 rounded-xl border p-1 flex flex-col items-center justify-center transition-colors ${selectedDate === date ? 'border-cyan-400 bg-cyan-500/15' : active ? missing === 0 && total > 0 ? 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-400' : 'border-white/[0.07] bg-white/[0.025] hover:border-white/25' : 'border-transparent text-zinc-600 cursor-default'}`}>
                  <span className={`text-xs sm:text-sm font-semibold ${date === today ? 'text-cyan-300' : active ? 'text-zinc-100' : 'text-zinc-600'}`}>{Number(date.slice(-2))}</span>
                  {active && <span className={`text-[10px] sm:text-xs ${missing ? 'text-amber-300' : 'text-emerald-300'}`}>{done}/{total}</span>}
                </button>
              })}
            </div>
            <p className="text-[11px] text-zinc-500 mt-3">数字表示当天完成项 / 应打卡项。新项目创建前不计入缺漏。</p>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3 mb-3"><div><h3 className="text-base font-bold text-white">{selectedDate} 打卡矩阵</h3><p className="text-xs text-zinc-400 mt-1">完成 {selectedDone} 项 · 缺漏 {selectedHabits.length - selectedDone} 项</p></div></div>
            {selectedDate < firstDate ? <p className="text-sm text-zinc-500 py-6 text-center">该日期之前没有可用的打卡记录</p> : selectedHabits.length === 0 ? <p className="text-sm text-zinc-500 py-6 text-center">当天没有打卡项目</p> : <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">{selectedHabits.map((habit) => {
              const checked = !!habit.logs?.[selectedDate]
              return <div key={habit.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${checked ? 'border-emerald-500/20 bg-emerald-500/[0.07]' : 'border-amber-500/20 bg-amber-500/[0.06]'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${checked ? 'bg-emerald-500 text-white' : 'bg-amber-500/15 text-amber-300'}`}>{checked ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}</span>
                <div className="min-w-0 flex-1"><div className="text-sm text-zinc-100 truncate">{habit.name}</div><div className="text-[11px] text-zinc-500">{habit.category || '常规'}{habit.archivedAt ? ' · 已归档' : ''}{checked && habit.workoutDetails?.[selectedDate] ? ` · ${habit.workoutDetails[selectedDate]}` : ''}</div></div>
                <span className={`text-xs shrink-0 ${checked ? 'text-emerald-300' : 'text-amber-300'}`}>{checked ? '完成' : '缺漏'}</span>
              </div>
            })}</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
