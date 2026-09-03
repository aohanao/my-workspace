'use client'

import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  BatteryCharging,
  Smile,
  Plus,
  Trash2,
  Save,
  Check,
} from 'lucide-react'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'
import { DailyTop3Item, EnergyMoodLog, TaskPriority } from '@/types'

interface CalendarModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const [currentYear, setCurrentYear] = useState(2026)
  const [currentMonth, setCurrentMonth] = useState(8) // 0-indexed: 8 is September
  const [selectedDate, setSelectedDate] = useState(getLocalDateKey())

  // 心情与精力
  const [energy, setEnergy] = useState(4)
  const [mood, setMood] = useState(4)
  const [journal, setJournal] = useState('')
  const [moodSaved, setMoodSaved] = useState(false)

  // 待办列表
  const [tasks, setTasks] = useState<DailyTop3Item[]>([])
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('重急')

  // 全局数据索引
  const [energyLogs, setEnergyLogs] = useState<EnergyMoodLog[]>([])

  useEffect(() => {
    if (!isOpen) return
    const now = new Date()
    setCurrentYear(now.getFullYear())
    setCurrentMonth(now.getMonth())
    const todayStr = getLocalDateKey()
    setSelectedDate(todayStr)
    loadDateData(todayStr)
  }, [isOpen])

  const loadDateData = (dateStr: string) => {
    const logs = StorageService.getEnergyMoodLogs()
    setEnergyLogs(logs)
    const log = logs.find((l) => l.date === dateStr)
    setEnergy(log?.energy ?? 4)
    setMood(log?.mood ?? 4)
    setJournal(log?.journal ?? '')

    const top3 = StorageService.getTop3()
    setTasks(top3)
  }

  const handleSelectDate = (dateStr: string) => {
    setSelectedDate(dateStr)
    loadDateData(dateStr)
    setMoodSaved(false)
  }

  const handleSaveMood = () => {
    const logs = StorageService.getEnergyMoodLogs()
    const nextLog: EnergyMoodLog = {
      date: selectedDate,
      energy,
      mood,
      journal,
    }
    const updated = [nextLog, ...logs.filter((l) => l.date !== selectedDate)]
    StorageService.saveEnergyMoodLogs(updated)
    setEnergyLogs(updated)
    setMoodSaved(true)
    setTimeout(() => setMoodSaved(false), 2000)
  }

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim()) return
    const newItem: DailyTop3Item = {
      id: `task-${Date.now()}`,
      text: newTaskText.trim(),
      done: false,
      priority: newTaskPriority,
    }
    const updated = [...tasks, newItem]
    setTasks(updated)
    StorageService.saveTop3(updated)
    setNewTaskText('')
  }

  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    setTasks(updated)
    StorageService.saveTop3(updated)
  }

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id)
    setTasks(updated)
    StorageService.saveTop3(updated)
  }

  if (!isOpen) return null

  // 生成当月网格
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const offset = (firstDayOfWeek + 6) % 7

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()
  const days = []

  // 上月余白
  for (let i = offset - 1; i >= 0; i--) {
    days.push({
      day: prevMonthDays - i,
      monthOffset: -1,
      dateStr: '',
    })
  }

  // 当月天数
  for (let d = 1; d <= daysInMonth; d++) {
    const mStr = String(currentMonth + 1).padStart(2, '0')
    const dStr = String(d).padStart(2, '0')
    const dateStr = `${currentYear}-${mStr}-${dStr}`
    days.push({
      day: d,
      monthOffset: 0,
      dateStr,
    })
  }

  // 下月余白补齐
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    days.push({
      day: i,
      monthOffset: 1,
      dateStr: '',
    })
  }

  const monthNames = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月',
  ]

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  const todayStr = getLocalDateKey()

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5">
      <div className="bg-[#0b0e17] border border-white/[0.12] w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* 左侧：DeepSeek 极简月历网格 */}
        <div className="p-5 sm:p-7 border-b md:border-b-0 md:border-r border-white/[0.08] flex-1 flex flex-col justify-between select-none">
          <div>
            {/* 月历标题与切换 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <CalendarIcon className="w-5 h-5 text-white" />
                <h3 className="font-bold text-base sm:text-lg text-white font-mono">
                  {currentYear}年 · {monthNames[currentMonth]}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    const now = new Date()
                    setCurrentYear(now.getFullYear())
                    setCurrentMonth(now.getMonth())
                    handleSelectDate(todayStr)
                  }}
                  className="px-3 py-1 text-xs rounded-full text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.12] transition-colors"
                >
                  今天
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.06] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 星期行 */}
            <div className="grid grid-cols-7 text-center text-xs font-semibold text-zinc-500 mb-2.5 font-mono">
              <div>一</div>
              <div>二</div>
              <div>三</div>
              <div>四</div>
              <div>五</div>
              <div className="text-zinc-300">六</div>
              <div className="text-zinc-300">日</div>
            </div>

            {/* 日期格子网格 */}
            <div className="grid grid-cols-7 gap-2 text-xs sm:text-sm">
              {days.map((item, idx) => {
                if (item.monthOffset !== 0) {
                  return (
                    <div
                      key={idx}
                      className="h-10 sm:h-12 rounded-xl flex items-center justify-center text-zinc-700 font-mono opacity-30"
                    >
                      {item.day}
                    </div>
                  )
                }

                const isToday = item.dateStr === todayStr
                const isSelected = item.dateStr === selectedDate
                const hasMoodLog = energyLogs.some((l) => l.date === item.dateStr)

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectDate(item.dateStr)}
                    className={`h-10 sm:h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-medium transition-all relative border ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-lg font-bold scale-105 z-10'
                        : isToday
                        ? 'bg-white/[0.08] text-white border-white/40 font-bold'
                        : 'bg-black/40 text-zinc-300 border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.15]'
                    }`}
                  >
                    <span>{item.day}</span>
                    {hasMoodLog && (
                      <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-black' : 'bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="pt-4 text-xs text-zinc-400 flex items-center justify-between border-t border-white/[0.06] mt-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)]" />
              <span>当日有状态记录</span>
            </div>
            <span className="text-zinc-500 font-mono text-[11px]">CALENDAR · DEEPSEEK OS</span>
          </div>
        </div>

        {/* 右侧：选中日期的状态心情与待办录入面板 */}
        <div className="p-5 sm:p-7 w-full md:w-[380px] bg-black/40 flex flex-col justify-between space-y-4 overflow-y-auto">
          <div className="space-y-4">
            {/* 顶栏：选中日期标题与关闭按钮 */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
              <div>
                <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider block">SELECTED DATE</span>
                <h4 className="font-bold text-base sm:text-lg text-white font-mono">{selectedDate}</h4>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                title="关闭日历"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. 心情与精力评定 */}
            <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Smile className="w-4 h-4 text-zinc-300" />
                  当日状态与精力记录
                </span>
                {moodSaved && (
                  <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" /> 已保存
                  </span>
                )}
              </div>

              <div>
                <div className="flex justify-between mb-1 text-zinc-300">
                  <span>⚡ 精力等级:</span>
                  <span className="font-mono font-bold text-white">{energy} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1 text-zinc-300">
                  <span>😊 心情指数:</span>
                  <span className="font-mono font-bold text-white">{mood} / 5</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value))}
                  className="w-full accent-white cursor-pointer"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="记录今日心得感悟、随笔..."
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-white/30 resize-none text-xs"
                />
              </div>

              <button
                onClick={handleSaveMood}
                className="w-full py-2 rounded-full linear-btn-primary font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>保存此日状态记录</span>
              </button>
            </div>

            {/* 2. 当日待办事项 */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07] text-xs">
              <span className="font-semibold text-white block">
                📋 核心待办安排 ({tasks.filter((t) => t.done).length}/{tasks.length})
              </span>

              {/* 任务添加 */}
              <form onSubmit={handleAddTask} className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="添加任务项..."
                    className="flex-1 px-3 py-1.5 rounded-full bg-black/50 border border-white/[0.08] text-white text-xs focus:outline-none focus:border-white/30"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 linear-btn-primary rounded-full font-semibold shrink-0"
                  >
                    添加
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[10px]">
                  {(['重急', '重缓', '轻急', '轻缓'] as TaskPriority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewTaskPriority(p)}
                      className={`px-2 py-0.5 rounded-full font-mono transition-all border ${
                        newTaskPriority === p
                          ? p === '重急'
                            ? 'bg-rose-950 text-rose-300 border-rose-600 font-bold'
                            : p === '重缓'
                            ? 'bg-amber-950 text-amber-300 border-amber-600 font-bold'
                            : p === '轻急'
                            ? 'bg-purple-950 text-purple-300 border-purple-600 font-bold'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-600 font-bold'
                          : 'bg-transparent border-white/[0.08] text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </form>

              {/* 任务列表 */}
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                {tasks.map((task) => {
                  const p = task.priority || '重急'
                  const pBadge = p === '重急'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                    : p === '重缓'
                    ? 'bg-amber-950/70 text-amber-300 border-amber-700/50'
                    : p === '轻急'
                    ? 'bg-purple-950/70 text-purple-300 border-purple-700/50'
                    : 'bg-zinc-900/80 text-zinc-400 border-zinc-700/50'

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/30 border border-white/[0.04] group hover:border-white/[0.1]"
                    >
                      <div
                        onClick={() => handleToggleTask(task.id)}
                        className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          className="rounded text-white cursor-pointer accent-white"
                        />
                        <span className={`truncate text-xs ${task.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.text}
                        </span>
                      </div>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono border font-bold shrink-0 ${pBadge}`}>
                        {p}
                      </span>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}

                {tasks.length === 0 && (
                  <p className="text-zinc-500 py-3 text-center text-xs">暂无待办，输入上方即可添加</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-medium transition-colors"
          >
            完成并返回工作台
          </button>
        </div>
      </div>
    </div>
  )
}
