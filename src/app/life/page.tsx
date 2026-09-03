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
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  Dumbbell,
  Cpu,
  GraduationCap,
  Edit3,
  Check,
} from 'lucide-react'
import { EnergyMoodLog, HabitItem, QuickCaptureNote, TimeBlockItem } from '@/types'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'

export default function LifePage() {
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockItem[]>([])
  const [notes, setNotes] = useState<QuickCaptureNote[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('技能学习')
  const [isAddHabitOpen, setIsAddHabitOpen] = useState(false)

  // 编辑习惯模态框
  const [editingHabit, setEditingHabit] = useState<HabitItem | null>(null)

  // 编辑时间块模态框
  const [editingTimeBlock, setEditingTimeBlock] = useState<TimeBlockItem | null>(null)

  // 编辑速记模态框
  const [editingNote, setEditingNote] = useState<QuickCaptureNote | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')

  const [mood, setMood] = useState<number>(4)
  const [energy, setEnergy] = useState<number>(4)
  const [dailyJournal, setDailyJournal] = useState('')
  const today = getLocalDateKey()

  useEffect(() => {
    const loadData = () => {
      setHabits(StorageService.getHabits())
      setTimeBlocks(StorageService.getTimeBlocks())
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

  // 过去 7 天打卡时间轴
  const past7Days: { dateStr: string; weekday: string; shortDate: string }[] = []
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = getLocalDateKey(d)
    past7Days.push({
      dateStr,
      weekday: weekdays[d.getDay()],
      shortDate: `${d.getMonth() + 1}.${d.getDate()}`,
    })
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

  // 习惯增删改
  const handleAddHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitName.trim()) return
    const colors = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6']
    const item: HabitItem = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      category: newHabitCategory,
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

  const handleUpdateHabit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingHabit) return
    const updated = habits.map((h) => (h.id === editingHabit.id ? editingHabit : h))
    setHabits(updated)
    StorageService.saveHabits(updated)
    setEditingHabit(null)
  }

  const handleDeleteHabit = (id: string) => {
    if (confirm('确定删除该日常打卡项吗？')) {
      const updated = habits.filter((h) => h.id !== id)
      setHabits(updated)
      StorageService.saveHabits(updated)
    }
  }

  // 时间块修改
  const handleSaveTimeBlock = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTimeBlock) return
    const updated = timeBlocks.map((b) => (b.id === editingTimeBlock.id ? editingTimeBlock : b))
    setTimeBlocks(updated)
    StorageService.saveTimeBlocks(updated)
    setEditingTimeBlock(null)
  }

  const handleUpdateTimeBlockTask = (blockId: string, taskIdx: number, activity: string) => {
    const updated = timeBlocks.map((b) => {
      if (b.id !== blockId) return b
      const newTasks = [...b.tasks]
      newTasks[taskIdx] = { ...newTasks[taskIdx], activity }
      return { ...b, tasks: newTasks }
    })
    setTimeBlocks(updated)
    StorageService.saveTimeBlocks(updated)
  }

  // 速记箱操作
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteContent.trim()) return
    const item: QuickCaptureNote = {
      id: `note-${Date.now()}`,
      content: newNoteContent.trim(),
      createdAt: new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    }
    const updated = [item, ...notes]
    setNotes(updated)
    StorageService.saveNotes(updated)
    setNewNoteContent('')
  }

  const handleSaveEditNote = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingNote) return
    const updated = notes.map((n) => (n.id === editingNote.id ? editingNote : n))
    setNotes(updated)
    StorageService.saveNotes(updated)
    setEditingNote(null)
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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-white/[0.08] text-white border border-white/[0.12]">
              <Smile className="w-5 h-5" />
            </div>
            <span>生活与习惯管理</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            作息时间块结构 · 7大日常打卡矩阵 · 专注精力与状态日志 · 全面支持修改自定义
          </p>
        </div>

        <button
          onClick={() => setIsAddHabitOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 linear-btn-primary text-xs sm:text-sm font-semibold shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新增打卡项目</span>
        </button>
      </div>

      {/* 1. 周计划时间块结构 (Time-Blocking) —— 支持全方位自定义修改 */}
      <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 flex-wrap gap-2">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 tracking-tight">
            <Clock className="w-4 h-4 text-zinc-300" />
            结构化作息时间块 (Time-Blocking)
          </h3>
          <span className="text-xs text-zinc-400">点击各时段右上角图标可随时编辑修改活动安排</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
          {timeBlocks.map((block) => (
            <div key={block.id} className="p-4 rounded-2xl bg-black/40 border border-white/[0.06] space-y-3 flex flex-col justify-between group hover:border-white/[0.14] transition-colors">
              <div>
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <span className="text-white">{block.periodLabel}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-400">{block.timeRange}</span>
                    <button
                      onClick={() => setEditingTimeBlock(block)}
                      className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
                      title="编辑此时段规划"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{block.title}</p>

                <div className="space-y-2">
                  {block.tasks.map((task, tIdx) => (
                    <div key={tIdx} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex justify-between text-[11px] text-zinc-400 font-mono font-medium">
                        <span>{task.time}</span>
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-200 leading-snug">
                        {task.activity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. 日常任务矩阵与 7 天打卡表格 */}
      <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <Flame className="w-4 h-4 text-zinc-300" />
              日常任务打卡矩阵 (Habit Matrix)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">点击方格打卡 / 点击编辑图标随时修改名称与所属分类</p>
          </div>
          <span className="text-xs font-mono text-zinc-300 bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1]">
            共 {habits.length} 项习惯
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[700px]">
            <thead className="bg-[#0c101b] text-zinc-300 border-b border-cyan-500/20 font-semibold">
              <tr>
                <th className="p-3.5 pl-4 w-32">分类</th>
                <th className="p-3.5 w-60">项目清单</th>
                {past7Days.map((d) => (
                  <th key={d.dateStr} className="p-3 text-center w-16">
                    <div className="text-[11px] text-zinc-400">{d.weekday}</div>
                    <div className="font-mono text-zinc-200 font-bold">{d.shortDate}</div>
                  </th>
                ))}
                <th className="p-3 text-right pr-4 w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {habits.map((habit) => (
                <tr key={habit.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-3.5 pl-4 whitespace-nowrap">
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-300 border border-white/[0.08]">
                      {habit.category || '常规'}
                    </span>
                  </td>
                  <td className="p-3.5 font-semibold text-white whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: habit.color, color: habit.color }} />
                      <span className="text-xs sm:text-sm">{habit.name}</span>
                    </div>
                  </td>
                  {past7Days.map((d) => {
                    const isChecked = !!habit.logs[d.dateStr]
                    const isToday = d.dateStr === today

                    return (
                      <td key={d.dateStr} className="p-3 text-center">
                        <button
                          onClick={() => handleToggleHabit(habit.id, d.dateStr)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all mx-auto ${
                            isChecked
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-105'
                              : isToday
                              ? 'bg-white/[0.04] border-cyan-500/40 text-zinc-500 hover:border-emerald-500/50'
                              : 'bg-transparent border-white/[0.08] text-transparent hover:border-white/20'
                          }`}
                        >
                          {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs">•</span>}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setEditingHabit(habit)}
                        className="text-zinc-400 hover:text-cyan-300 p-1 rounded transition-colors"
                        title="修改习惯"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="删除习惯"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 状态能量与速记备忘 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 今日精力与状态日志 */}
        <div className="linear-card p-5 sm:p-6 rounded-2xl space-y-4 border border-cyan-500/20">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <BatteryCharging className="w-4 h-4 text-cyan-400" />
              今日能量与状态自评
            </h3>
            <span className="text-xs font-mono text-cyan-400">{today}</span>
          </div>

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <div className="flex justify-between mb-1.5 text-zinc-300">
                <span>⚡ 专注精力等级:</span>
                <span className="font-mono font-bold text-cyan-400">{energy} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={energy}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setEnergy(val)
                  saveWellbeing({ energy: val })
                }}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 text-zinc-300">
                <span>😊 心情状态指数:</span>
                <span className="font-mono font-bold text-blue-400">{mood} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={mood}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setMood(val)
                  saveWellbeing({ mood: val })
                }}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-zinc-300 block mb-1.5 font-medium">📝 今日心得与复盘笔记：</label>
              <textarea
                rows={3}
                value={dailyJournal}
                onChange={(e) => {
                  setDailyJournal(e.target.value)
                  saveWellbeing({ journal: e.target.value })
                }}
                placeholder="记录今日学习心得、面试感受、算法感悟..."
                className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500 resize-none text-xs sm:text-sm leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 灵感速记与待办转存 */}
        <div className="linear-card p-5 sm:p-6 rounded-2xl space-y-4 border border-cyan-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
                <ListTodo className="w-4 h-4 text-purple-400" />
                灵感速记箱 ({notes.length})
              </h3>
              <span className="text-xs text-zinc-400">可自由编辑 / 转入今日Top3</span>
            </div>

            {/* 新增一条速记 */}
            <form onSubmit={handleAddNote} className="flex gap-2 pt-3">
              <input
                type="text"
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="快速记录一条灵感或导师指导意见..."
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2 linear-btn-primary text-xs sm:text-sm font-medium rounded-xl shrink-0"
              >
                保存
              </button>
            </form>

            <div className="space-y-2.5 overflow-y-auto max-h-[220px] mt-3 pr-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 text-xs sm:text-sm group hover:border-cyan-500/30 transition-colors"
                >
                  <p className="text-zinc-200 leading-relaxed break-words">{note.content}</p>
                  <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
                    <span className="font-mono">{note.createdAt}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConvertNoteToTask(note)}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline"
                      >
                        转为今日待办 ➔
                      </button>
                      <button
                        onClick={() => setEditingNote(note)}
                        className="text-zinc-400 hover:text-white"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-zinc-500 hover:text-rose-400"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {notes.length === 0 && (
                <p className="text-xs text-zinc-500 py-6 text-center">暂无速记，输入上方输入框随时记录</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ================= 编辑习惯弹窗 ================= */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              修改习惯项目
            </h3>
            <form onSubmit={handleUpdateHabit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-zinc-400 block mb-1">所属分类：</label>
                <input
                  type="text"
                  required
                  value={editingHabit.category || '常规'}
                  onChange={(e) => setEditingHabit({ ...editingHabit, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">习惯名称：</label>
                <input
                  type="text"
                  required
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 新增打卡项目弹窗 ================= */}
      {isAddHabitOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              新增日常打卡项目
            </h3>
            <form onSubmit={handleAddHabit} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="text-zinc-400 block mb-1">项目分类：</label>
                <input
                  type="text"
                  required
                  placeholder="学业 / 技能学习 / 个人 / 健身 / English / 阅读"
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">项目名称：</label>
                <input
                  type="text"
                  required
                  placeholder="如: 力扣 2 道真题 / 健身肩胸背腿"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddHabitOpen(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 编辑时间块弹窗 ================= */}
      {editingTimeBlock && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              自定义时间块与作息规划
            </h3>
            <form onSubmit={handleSaveTimeBlock} className="space-y-3.5 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">时段名称：</label>
                  <input
                    type="text"
                    required
                    value={editingTimeBlock.periodLabel}
                    onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, periodLabel: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">时间范围：</label>
                  <input
                    type="text"
                    required
                    value={editingTimeBlock.timeRange}
                    onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, timeRange: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">时段主题说明：</label>
                <input
                  type="text"
                  value={editingTimeBlock.title}
                  onChange={(e) => setEditingTimeBlock({ ...editingTimeBlock, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                />
              </div>

              <div className="space-y-2.5">
                <label className="text-zinc-300 font-semibold block">具体安排条目：</label>
                {editingTimeBlock.tasks.map((t, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={t.time}
                      onChange={(e) => {
                        const newTasks = [...editingTimeBlock.tasks]
                        newTasks[idx].time = e.target.value
                        setEditingTimeBlock({ ...editingTimeBlock, tasks: newTasks })
                      }}
                      className="p-2 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono text-xs"
                    />
                    <input
                      type="text"
                      value={t.activity}
                      onChange={(e) => {
                        const newTasks = [...editingTimeBlock.tasks]
                        newTasks[idx].activity = e.target.value
                        setEditingTimeBlock({ ...editingTimeBlock, tasks: newTasks })
                      }}
                      className="col-span-2 p-2 rounded-xl bg-black/50 border border-white/[0.1] text-white text-xs sm:text-sm"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingTimeBlock(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                >
                  保存时段规划
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= 编辑速记弹窗 ================= */}
      {editingNote && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              修改速记内容
            </h3>
            <form onSubmit={handleSaveEditNote} className="space-y-3.5 text-xs sm:text-sm">
              <textarea
                rows={4}
                required
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.1] text-white leading-relaxed resize-y"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingNote(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
