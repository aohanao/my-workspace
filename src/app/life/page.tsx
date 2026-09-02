'use client'

import { useState, useEffect } from 'react'
import {
  Smile,
  Flame,
  CheckCircle2,
  Plus,
  Trash2,
  BatteryCharging,
  ListTodo,
} from 'lucide-react'
import { EnergyMoodLog, HabitItem, QuickCaptureNote } from '@/types'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'

export default function LifePage() {
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [notes, setNotes] = useState<QuickCaptureNote[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false)

  const [mood, setMood] = useState<number>(4)
  const [energy, setEnergy] = useState<number>(4)
  const [dailyJournal, setDailyJournal] = useState('')
  const today = getLocalDateKey()

  useEffect(() => {
    const loadData = () => {
      setHabits(StorageService.getHabits())
      setNotes(StorageService.getNotes())
      const todayLog = StorageService.getEnergyMoodLogs().find((log) => log.date === today)
      setMood(todayLog?.mood ?? 4)
      setEnergy(todayLog?.energy ?? 4)
      setDailyJournal(todayLog?.journal ?? '')
    }

    loadData()
    window.addEventListener('workspace-data-updated', loadData)
    return () => window.removeEventListener('workspace-data-updated', loadData)
  }, [])

  const saveWellbeing = (changes: Partial<EnergyMoodLog>) => {
    const logs = StorageService.getEnergyMoodLogs()
    const existing = logs.find((log) => log.date === today)
    const nextLog: EnergyMoodLog = {
      date: today,
      energy: changes.energy ?? existing?.energy ?? energy,
      mood: changes.mood ?? existing?.mood ?? mood,
      journal: changes.journal ?? existing?.journal ?? dailyJournal,
    }
    StorageService.saveEnergyMoodLogs([nextLog, ...logs.filter((log) => log.date !== today)])
  }

  const past14Days: string[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    past14Days.push(getLocalDateKey(d))
  }

  const handleToggleHabit = (habitId: string, dateStr: string) => {
    const updated = habits.map((h) => {
      if (h.id !== habitId) return h
      const currentVal = !!h.logs[dateStr]
      return {
        ...h,
        logs: { ...h.logs, [dateStr]: !currentVal },
      }
    })
    setHabits(updated)
    StorageService.saveHabits(updated)
  }

  const handleDeleteNote = (noteId: string) => {
    const updated = notes.filter((n) => n.id !== noteId)
    setNotes(updated)
    StorageService.saveNotes(updated)
  }

  const handleConvertNoteToTask = (note: QuickCaptureNote) => {
    const top3 = StorageService.getTop3()
    StorageService.saveTop3([
      ...top3,
      { id: `top-${Date.now()}`, text: note.content, done: false, category: 'life' },
    ])
    handleDeleteNote(note.id)
  }

  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6']
    const item: HabitItem = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      color: colors[habits.length % colors.length],
      icon: 'Flame',
      logs: { [today]: true },
    }
    const updated = [...habits, item]
    setHabits(updated)
    StorageService.saveHabits(updated)
    setNewHabitName('')
    setIsAddHabitOpen(false)
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Smile className="w-5 h-5" />
            </div>
            <span>日常生活与习惯管理</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            高压周期下的习惯打卡 · 精力充能 · 随手灵感速记
          </p>
        </div>

        <button
          onClick={() => setIsAddHabitOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新建打卡习惯</span>
        </button>
      </div>

      {/* 习惯打卡绿墙热力图 */}
      <div className="p-4 sm:p-6 rounded-2xl linear-card space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            近两周日常习惯打卡矩阵
          </h3>
          <span className="text-[11px] text-zinc-500">点击小方格直接切换打卡</span>
        </div>

        <div className="overflow-x-auto pb-1">
          <table className="w-full text-xs min-w-[500px]">
            <thead>
              <tr className="text-zinc-500">
                <th className="text-left py-2 font-normal w-36 sm:w-48">习惯名称</th>
                {past14Days.map((d) => (
                  <th key={d} className="py-2 text-center font-mono font-normal text-[10px]">
                    {d.slice(5)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {habits.map((habit) => (
                <tr key={habit.id}>
                  <td className="py-2.5 sm:py-3 font-medium text-zinc-300 flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
                    <span className="truncate">{habit.name}</span>
                  </td>
                  {past14Days.map((d) => {
                    const isDone = !!habit.logs[d]
                    return (
                      <td key={d} className="py-2.5 sm:py-3 text-center">
                        <button
                          onClick={() => handleToggleHabit(habit.id, d)}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg transition-all mx-auto flex items-center justify-center ${
                            isDone
                              ? 'shadow-sm text-white'
                              : 'bg-white/[0.03] hover:bg-white/[0.08] text-transparent'
                          }`}
                          style={{ backgroundColor: isDone ? habit.color : undefined }}
                          title={`${habit.name} - ${d}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 精力管理与灵感便签 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 今日精力与状态 */}
        <div className="p-4 sm:p-6 rounded-2xl linear-card space-y-4">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              今日精力与情绪状态自测
            </h3>
          </div>

          <div className="space-y-3.5 sm:space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-400 text-[11px]">精力电量:</span>
                <span className="font-bold font-mono text-emerald-400 text-xs">{energy} / 5</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setEnergy(lvl)
                      saveWellbeing({ energy: lvl })
                    }}
                    className={`flex-1 py-2 rounded-xl border text-center font-mono font-medium transition-all text-xs ${
                      energy === lvl
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                    }`}
                  >
                    ⚡ {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-zinc-400 text-[11px]">心理情绪:</span>
                <span className="font-bold font-mono text-indigo-400 text-xs">{mood} / 5</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => {
                      setMood(lvl)
                      saveWellbeing({ mood: lvl })
                    }}
                    className={`flex-1 py-2 rounded-xl border text-center font-mono font-medium transition-all text-xs ${
                      mood === lvl
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-sm'
                        : 'bg-white/[0.02] text-zinc-400 border-white/[0.06]'
                    }`}
                  >
                    💖 {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-zinc-400 block mb-1 text-[11px]">简短日记 / 感恩备忘：</label>
              <textarea
                rows={2}
                value={dailyJournal}
                onChange={(e) => setDailyJournal(e.target.value)}
                onBlur={() => saveWellbeing({ journal: dailyJournal })}
                placeholder="记录今天开心的一刻或一件小收获..."
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white resize-none focus:outline-none focus:border-blue-500 placeholder:text-zinc-600 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 随手灵感便签墙 */}
        <div className="p-4 sm:p-6 rounded-2xl linear-card space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
              <Smile className="w-4 h-4 text-blue-400" />
              随手速记便签墙
            </h3>
            <span className="text-[11px] text-zinc-500">{notes.length} 条备忘</span>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs space-y-2 group relative"
              >
                <p className="text-zinc-300 leading-relaxed break-words">{note.content}</p>
                <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/[0.04]">
                  <span>{note.createdAt}</span>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleConvertNoteToTask(note)}
                      title="转为今日任务"
                      aria-label="转为今日任务"
                      className="text-blue-400 hover:text-blue-300 p-1"
                    >
                      <ListTodo className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      title="删除便签"
                      aria-label="删除便签"
                      className="text-rose-400 hover:text-rose-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {notes.length === 0 && (
              <div className="text-center py-8 text-xs text-zinc-500">
                暂无便签，点击顶栏“速记一条”即可添加
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 新建习惯弹窗 */}
      {isAddHabitOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-sm rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
            <h3 className="font-semibold text-sm text-white">新建打卡习惯</h3>
            <form onSubmit={handleAddHabit} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="例如: 每日刷 2 道题 / 论文写作 1h"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHabitOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl linear-btn-primary"
                >
                  创建习惯
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
