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
} from 'lucide-react'
import { EnergyMoodLog, HabitItem, QuickCaptureNote } from '@/types'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'

export default function LifePage() {
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [notes, setNotes] = useState<QuickCaptureNote[]>([])
  const [newHabitName, setNewHabitName] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('技能学习')
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
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6', '#ef4444']
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

  const handleDeleteHabit = (id: string) => {
    if (confirm('确定删除该日常打卡项吗？')) {
      const updated = habits.filter((h) => h.id !== id)
      setHabits(updated)
      StorageService.saveHabits(updated)
    }
  }

  // 习惯按类别分组
  const categories = ['学业', '技能学习', '个人', '健身', 'English', '阅读']
  const groupedHabits = categories.map((cat) => ({
    category: cat,
    items: habits.filter((h) => (h.category || '技能学习') === cat),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smile className="w-5 h-5" />
            </div>
            <span>生活与习惯管理</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            时间块结构化作息 · 6大日常任务矩阵 · 能量与心情复盘
          </p>
        </div>

        <button
          onClick={() => setIsAddHabitOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>新增打卡项目</span>
        </button>
      </div>

      {/* 1. 周计划时间块结构 (Time-Blocking) */}
      <div className="linear-card p-4 sm:p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
          <h3 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            周计划时间块结构 (Time-Blocking)
          </h3>
          <span className="text-[11px] text-zinc-500 font-mono">SCHEDULE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* 上午 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between font-semibold text-blue-400">
              <span>🌅 上午 (高效专注)</span>
              <span className="text-[10px] font-mono text-zinc-500">9:30 - 12:00</span>
            </div>
            <div className="space-y-1.5 text-zinc-300 text-[11px]">
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>09:30 - 11:00</span>
                <span className="text-zinc-400">毕业论文写作 / 文献研读</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>11:00 - 12:00</span>
                <span className="text-zinc-400">英语 Vocabulary / 力扣真题</span>
              </div>
            </div>
          </div>

          {/* 下午 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between font-semibold text-amber-400">
              <span>☀️ 下午 (技能与求职)</span>
              <span className="text-[10px] font-mono text-zinc-500">15:30 - 18:00</span>
            </div>
            <div className="space-y-1.5 text-zinc-300 text-[11px]">
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>15:30 - 17:00</span>
                <span className="text-zinc-400">秋招投递 / 选调行测 / 算法八股</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>17:00 - 18:00</span>
                <span className="text-zinc-400">健身锻炼 (肩/胸/背/腿/手臂)</span>
              </div>
            </div>
          </div>

          {/* 晚上 */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between font-semibold text-purple-400">
              <span>🌙 晚上 (实验与复盘)</span>
              <span className="text-[10px] font-mono text-zinc-500">19:00 - 23:00</span>
            </div>
            <div className="space-y-1.5 text-zinc-300 text-[11px]">
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>19:00 - 20:30</span>
                <span className="text-zinc-400">ML/DL 算法与 CAE 仿真模拟</span>
              </div>
              <div className="p-2 rounded-lg bg-black/30 border border-white/[0.04] flex justify-between">
                <span>20:30 - 23:00</span>
                <span className="text-zinc-400">面试复盘 / 阅读《当下的力量》</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 日常任务矩阵与 7 天打卡表格 */}
      <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
            <Flame className="w-4 h-4 text-emerald-400" />
            日常任务打卡矩阵 (Habit Matrix)
          </h3>
          <span className="text-[11px] text-zinc-500">点击方格完成打卡</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[650px]">
            <thead className="bg-white/[0.02] text-zinc-400 border-b border-white/[0.06] font-semibold">
              <tr>
                <th className="p-3 pl-4 w-32">分类</th>
                <th className="p-3 w-52">项目清单</th>
                {past7Days.map((d) => (
                  <th key={d.dateStr} className="p-3 text-center w-16">
                    <div className="text-[10px] text-zinc-500">{d.weekday}</div>
                    <div className="font-mono text-zinc-300 font-semibold">{d.shortDate}</div>
                  </th>
                ))}
                <th className="p-3 text-right pr-4 w-16">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {habits.map((habit) => (
                <tr key={habit.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-3 pl-4 whitespace-nowrap">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400 border border-white/[0.06]">
                      {habit.category || '常规'}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: habit.color }} />
                      <span>{habit.name}</span>
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
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                              : isToday
                              ? 'bg-white/[0.04] border-white/[0.15] text-zinc-600 hover:border-emerald-500/50'
                              : 'bg-transparent border-white/[0.06] text-transparent hover:border-white/20'
                          }`}
                        >
                          {isChecked ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-[10px]">•</span>}
                        </button>
                      </td>
                    )
                  })}
                  <td className="p-3 pr-4 text-right">
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="text-zinc-600 hover:text-rose-400 p-1 transition-colors"
                      title="删除项目"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
        <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              今日能量与状态自评
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">{today}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between mb-1.5 text-zinc-300">
                <span>⚡ 专注精力等级:</span>
                <span className="font-mono font-semibold text-emerald-400">{energy} / 5</span>
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
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-1.5 text-zinc-300">
                <span>😊 心情状态指数:</span>
                <span className="font-mono font-semibold text-blue-400">{mood} / 5</span>
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
              <label className="text-zinc-300 block mb-1.5">📝 今日心得与简短复盘：</label>
              <textarea
                rows={3}
                value={dailyJournal}
                onChange={(e) => {
                  setDailyJournal(e.target.value)
                  saveWellbeing({ journal: e.target.value })
                }}
                placeholder="记录今日学习心得、面试感受、生活感悟..."
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 resize-none text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* 灵感速记与待办转存 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <ListTodo className="w-4 h-4 text-purple-400" />
              灵感速记箱 ({notes.length})
            </h3>
            <span className="text-[11px] text-zinc-500">点击可转入今日 Top3</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-[220px]">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 text-xs"
              >
                <p className="text-zinc-200 leading-relaxed break-words">{note.content}</p>
                <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                  <span>{note.createdAt}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleConvertNoteToTask(note)}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      转为今日待办 ➔
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
              <p className="text-xs text-zinc-500 py-6 text-center">速记箱为空，点击顶栏「速记一条」随时捕获灵感</p>
            )}
          </div>
        </div>
      </div>

      {/* 新增打卡项目弹窗 */}
      {isAddHabitOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4">
            <h3 className="font-semibold text-sm text-white">新增日常打卡项目</h3>
            <form onSubmit={handleAddHabit} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">项目分类：</label>
                <select
                  value={newHabitCategory}
                  onChange={(e) => setNewHabitCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none"
                >
                  <option value="学业" className="bg-[#10131d]">学业 (论文/文献)</option>
                  <option value="技能学习" className="bg-[#10131d]">技能学习 (ML/CAE/力扣)</option>
                  <option value="个人" className="bg-[#10131d]">个人 (秋招/选调)</option>
                  <option value="健身" className="bg-[#10131d]">健身 (肩胸背腿核心)</option>
                  <option value="English" className="bg-[#10131d]">English (词汇/听说)</option>
                  <option value="阅读" className="bg-[#10131d]">阅读 (书单/认知)</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">项目名称：</label>
                <input
                  type="text"
                  required
                  placeholder="如: 力扣 2 道题 / 英语口语 20min"
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
                />
              </div>

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
                  className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                >
                  确认添加
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
