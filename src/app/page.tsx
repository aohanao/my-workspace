'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  Briefcase,
  GraduationCap,
  Brain,
  ArrowRight,
  TrendingUp,
  Layers,
  Edit3,
  Trash2,
  Plus,
  Check,
  Sparkles,
  ListTodo,
  AlertCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { StorageService } from '@/lib/storage'
import { getDaysLeft, getLocalDateKey, WORKSPACE_DEADLINES } from '@/lib/utils'
import {
  JobApplication,
  ThesisInfo,
  DailyTop3Item,
  LeetCodeItem,
  HabitItem,
  TaskPriority,
} from '@/types'

const PRIORITY_OPTIONS: { key: TaskPriority; label: string; desc: string; badgeClass: string; tabClass: string }[] = [
  {
    key: '重急',
    label: '重急',
    desc: '重要且紧急',
    badgeClass: 'bg-rose-950/85 text-rose-300 border-rose-600/70 shadow-[0_0_10px_rgba(244,63,94,0.35)]',
    tabClass: 'hover:bg-rose-950/60 hover:text-rose-300',
  },
  {
    key: '重缓',
    label: '重缓',
    desc: '重要不紧急',
    badgeClass: 'bg-amber-950/75 text-amber-300 border-amber-600/60 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
    tabClass: 'hover:bg-amber-950/50 hover:text-amber-300',
  },
  {
    key: '轻急',
    label: '轻急',
    desc: '紧急不重要',
    badgeClass: 'bg-purple-950/75 text-purple-300 border-purple-600/60 shadow-[0_0_8px_rgba(168,85,247,0.25)]',
    tabClass: 'hover:bg-purple-950/50 hover:text-purple-300',
  },
  {
    key: '轻缓',
    label: '轻缓',
    desc: '不重要不紧急',
    badgeClass: 'bg-zinc-900/85 text-zinc-400 border-zinc-700/60',
    tabClass: 'hover:bg-zinc-800/50 hover:text-zinc-300',
  },
]

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [thesis, setThesis] = useState<ThesisInfo | null>(null)
  const [dailyTasks, setDailyTasks] = useState<DailyTop3Item[]>([])
  const [leetcode, setLeetcode] = useState<LeetCodeItem[]>([])
  const [habits, setHabits] = useState<HabitItem[]>([])
  
  // 待办添加与编辑状态
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('重急')
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all')
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskText, setEditingTaskText] = useState('')

  const loadData = () => {
    setJobs(StorageService.getJobs())
    setThesis(StorageService.getThesis())
    setDailyTasks(StorageService.getTop3())
    setLeetcode(StorageService.getLeetCode())
    setHabits(StorageService.getHabits())
  }

  useEffect(() => {
    loadData()
    window.addEventListener('workspace-data-updated', loadData)
    return () => window.removeEventListener('workspace-data-updated', loadData)
  }, [])

  const handleToggleTask = (id: string) => {
    const updated = dailyTasks.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
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
    const updated = [...dailyTasks, newItem]
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
    setNewTaskText('')
  }

  // 点击标签快速轮转四象限优先级
  const handleCyclePriority = (id: string, current?: TaskPriority) => {
    const cycleMap: Record<TaskPriority, TaskPriority> = {
      重急: '重缓',
      重缓: '轻急',
      轻急: '轻缓',
      轻缓: '重急',
    }
    const nextPriority = cycleMap[current || '重急']
    const updated = dailyTasks.map((item) => (item.id === id ? { ...item, priority: nextPriority } : item))
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
  }

  const handleStartEditTask = (item: DailyTop3Item) => {
    setEditingTaskId(item.id)
    setEditingTaskText(item.text)
  }

  const handleSaveEditTask = (id: string) => {
    if (!editingTaskText.trim()) return
    const updated = dailyTasks.map((item) => (item.id === id ? { ...item, text: editingTaskText.trim() } : item))
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
    setEditingTaskId(null)
  }

  const handleDeleteTask = (id: string) => {
    const updated = dailyTasks.filter((item) => item.id !== id)
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
  }

  const careerCountdown = getDaysLeft(WORKSPACE_DEADLINES.careerSprint)
  const thesisCountdown = getDaysLeft(thesis?.blindReviewDate || WORKSPACE_DEADLINES.blindReview)

  const totalJobs = jobs.length
  const activeInterviews = jobs.filter((j) => ['interview1', 'interview2', 'hr'].includes(j.status))
  const offersCount = jobs.filter((j) => j.status === 'offer').length

  const totalCurrentWords = thesis?.chapters.reduce((acc, ch) => acc + (ch.currentWords || 0), 0) || 0
  const totalTargetWords = thesis?.chapters.reduce((acc, ch) => acc + (ch.targetWords || 0), 0) || 1
  const thesisPercent = Math.round((totalCurrentWords / totalTargetWords) * 100)
  
  const today = getLocalDateKey()
  const dueReviews = leetcode.filter((item) => item.nextReview <= today)

  const completedCount = dailyTasks.filter((t) => t.done).length
  const taskProgress = dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0

  // 过滤后的任务列表
  const filteredTasks = priorityFilter === 'all'
    ? dailyTasks
    : dailyTasks.filter((t) => (t.priority || '重急') === priorityFilter)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部 Hero 横幅 - DeepSeek 风格高级深色大片 */}
      <div className="linear-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              <span className="text-xs font-mono font-medium text-zinc-300 tracking-wider uppercase">
                AI WORKSPACE OS · CONTROL CENTER
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
              控制中枢 · Overview
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-xl leading-relaxed">
              钻爆法隧道全工序机械化施工智能配置硕士攻坚 · 秋招求职管道推进 · 专注一天的核心节奏
            </p>
          </div>

          {/* 双核心关键倒计时胶囊 */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 shrink-0 w-full lg:w-auto">
            {/* 秋招倒计时 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] text-center hover:border-white/[0.18] transition-colors sm:min-w-[155px]">
              <span className="text-xs font-medium text-zinc-400 block mb-1">
                秋招冲刺截止
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                {careerCountdown.days} <span className="text-xs font-normal text-zinc-500">天</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1 font-mono">{WORKSPACE_DEADLINES.careerSprint.replaceAll('-', '.')}</span>
            </div>

            {/* 论文初稿完成送审倒计时 */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/[0.08] text-center hover:border-white/[0.18] transition-colors sm:min-w-[155px]">
              <span className="text-xs font-medium text-zinc-400 block mb-1">
                初稿完成送审
              </span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                {thesisCountdown.days} <span className="text-xs font-normal text-zinc-500">天</span>
              </div>
              <span className="text-[11px] text-zinc-500 block mt-1 font-mono">{(thesis?.blindReviewDate || WORKSPACE_DEADLINES.blindReview).replaceAll('-', '.')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===================== 核心模块：今日全天日程安排与核心待办 (支持四象限级别) ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2 列：今日核心待办大版面 */}
        <div className="lg:col-span-2 linear-card p-6 sm:p-7 rounded-3xl space-y-5 border border-white/[0.08] flex flex-col justify-between">
          <div className="space-y-4">
            {/* 待办顶栏：标题、四象限筛选 Tab、达成度 */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/[0.06] text-white border border-white/[0.1]">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-white tracking-tight flex items-center gap-2.5">
                    <span>今日安排与核心待办</span>
                    <span className="text-xs font-mono font-medium text-zinc-300 bg-white/[0.06] px-2.5 py-0.5 rounded-full border border-white/[0.1]">
                      {completedCount} / {dailyTasks.length} 完成
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">四象限优先级自选（重急 / 轻急 / 重缓 / 轻缓）· 支持点击切换</p>
                </div>
              </div>

              {/* 四象限快速筛选胶囊 */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/[0.08] text-xs">
                <button
                  onClick={() => setPriorityFilter('all')}
                  className={`px-3 py-1 rounded-full font-medium transition-all ${
                    priorityFilter === 'all'
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  全部 ({dailyTasks.length})
                </button>
                {PRIORITY_OPTIONS.map((opt) => {
                  const count = dailyTasks.filter((t) => (t.priority || '重急') === opt.key).length
                  const isActive = priorityFilter === opt.key

                  return (
                    <button
                      key={opt.key}
                      onClick={() => setPriorityFilter(opt.key)}
                      className={`px-2.5 py-1 rounded-full font-medium transition-all ${
                        isActive
                          ? `${opt.badgeClass} font-bold`
                          : `text-zinc-400 ${opt.tabClass}`
                      }`}
                      title={opt.desc}
                    >
                      {opt.label} ({count})
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 达成度进度条 */}
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-zinc-300 to-white rounded-full transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>

            {/* 任务列表：支持四象限标签显示、点击轮转、行内编辑、打勾、删除 */}
            <div className="space-y-2.5 pt-1">
              {filteredTasks.map((task) => {
                const priorityInfo = PRIORITY_OPTIONS.find((p) => p.key === (task.priority || '重急')) || PRIORITY_OPTIONS[0]

                return (
                  <div
                    key={task.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 transition-all group ${
                      task.done
                        ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                        : 'bg-black/40 border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.03]'
                    }`}
                  >
                    {/* 完成勾选方框 */}
                    <div
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                        task.done
                          ? 'bg-white border-white text-black'
                          : 'border-zinc-500 bg-transparent hover:border-zinc-300'
                      }`}
                    >
                      {task.done && <Check className="w-3.5 h-3.5 stroke-[3] text-black" />}
                    </div>

                    {/* 任务文本或编辑框 */}
                    {editingTaskId === task.id ? (
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editingTaskText}
                          onChange={(e) => setEditingTaskText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEditTask(task.id)
                          }}
                          autoFocus
                          className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-black border border-white/30 rounded-xl text-white"
                        />
                        <button
                          onClick={() => handleSaveEditTask(task.id)}
                          className="px-4 py-1.5 linear-btn-primary text-xs font-semibold"
                        >
                          保存
                        </button>
                      </div>
                    ) : (
                      <span
                        onClick={() => handleToggleTask(task.id)}
                        className={`text-xs sm:text-sm flex-1 break-words cursor-pointer leading-relaxed ${
                          task.done ? 'line-through text-zinc-500' : 'text-zinc-200 font-medium'
                        }`}
                      >
                        {task.text}
                      </span>
                    )}

                    {/* 四象限级别徽章：仅显示 重急 / 轻急 / 重缓 / 轻缓，越重要越偏深红 */}
                    <button
                      onClick={() => handleCyclePriority(task.id, task.priority)}
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border transition-transform hover:scale-105 shrink-0 ${priorityInfo.badgeClass}`}
                      title={`当前等级: ${priorityInfo.desc}，点击切换级别`}
                    >
                      {priorityInfo.label}
                    </button>

                    {/* 编辑与删除操作 */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEditTask(task)}
                        className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                        title="编辑任务"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-white/[0.06] transition-colors"
                        title="删除任务"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}

              {filteredTasks.length === 0 && (
                <div className="p-8 text-center text-zinc-500 border border-dashed border-white/[0.08] rounded-2xl">
                  {priorityFilter === 'all'
                    ? '今日暂无安排，在下方输入框添加一天的核心事项'
                    : `暂无【${priorityFilter}】级别的待办任务`}
                </div>
              )}
            </div>
          </div>

          {/* 底部新增待办表单：集成四象限快速选择 */}
          <form onSubmit={handleAddTask} className="pt-3 border-t border-white/[0.08] space-y-2.5">
            <div className="flex gap-2.5">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="安排今日新事项（回车或点击添加）..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-black/40 border border-white/[0.1] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
              />
              <button
                type="submit"
                className="px-5 py-2.5 linear-btn-primary text-xs sm:text-sm rounded-full font-semibold shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>添加安排</span>
              </button>
            </div>

            {/* 选择新增任务所属四象限 */}
            <div className="flex items-center gap-2 text-xs text-zinc-400 flex-wrap">
              <span className="font-mono text-[11px] text-zinc-500">优先级级别:</span>
              <div className="flex items-center gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => {
                  const isSelected = newTaskPriority === opt.key

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setNewTaskPriority(opt.key)}
                      className={`px-3 py-1 rounded-full font-mono text-xs border transition-all ${
                        isSelected
                          ? `${opt.badgeClass} font-bold scale-105`
                          : 'bg-black/30 border-white/[0.08] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {opt.label} ({opt.desc})
                    </button>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        {/* 右侧 1 列：全系统推进概览（带丰富色彩的高级指标） & 力扣算法到期复习速览 */}
        <div className="space-y-6">
          {/* 进度概览卡片 —— 带有精致色彩的品牌化指标 */}
          <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
            <div className="border-b border-white/[0.06] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
                <Layers className="w-4 h-4 text-zinc-300" />
                全系统推进概览
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* 秋招企业卡片 (Sky Blue + Emerald Offer) */}
              <Link
                href="/career"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/25 flex items-center justify-center shadow-sm">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium block">秋招投递企业</span>
                    <span className="text-[11px] text-zinc-500 font-mono">Pipeline Tracking</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                      {totalJobs} 家
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400 ml-1.5">
                      ({offersCount} Offer)
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* 硕士论文卡片 (Indigo + Cyan Accent) */}
              <Link
                href="/research"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shadow-sm">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium block">硕士论文进度</span>
                    <span className="text-[11px] text-zinc-500 font-mono">Thesis & System</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <span className="text-xs sm:text-sm font-bold font-mono text-indigo-300">
                      {thesisPercent}%
                    </span>
                    <span className="text-xs font-mono text-zinc-400 ml-1">
                      ({totalCurrentWords}字)
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* 力扣算法题库卡片 (Amber / Warm Gold) */}
              <Link
                href="/study"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center shadow-sm">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-zinc-200 font-medium block">力扣算法题库</span>
                    <span className="text-[11px] text-zinc-500 font-mono">LeetCode & CS</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="text-xs sm:text-sm font-bold font-mono text-amber-300">
                    {leetcode.length} 道精选题
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>

            <Link
              href="/career/analytics"
              className="w-full py-2.5 rounded-full linear-btn-secondary text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>进入秋招量化大屏</span>
            </Link>
          </div>

          {/* 专属：力扣算法到期复习速览 (与面试完全拆开独立) */}
          <div className="linear-card p-6 rounded-3xl space-y-3.5 border border-white/[0.08] text-xs sm:text-sm">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
              <h4 className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                力扣算法到期复习速览
              </h4>
              <Link href="/study" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1">
                <span>全部题库</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {dueReviews.length > 0 ? (
                dueReviews.slice(0, 4).map((item) => {
                  const diffBadge = item.difficulty === 'Easy'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    : item.difficulty === 'Medium'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/20'

                  return (
                    <Link
                      key={item.id}
                      href="/study"
                      className="p-3 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.14] transition-colors flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-white font-mono font-semibold">#{item.number}</span>
                        <span className="text-zinc-200 truncate group-hover:text-white transition-colors">{item.title}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border shrink-0 ${diffBadge}`}>
                        {item.difficulty === 'Easy' ? '简单' : item.difficulty === 'Medium' ? '中等' : '困难'}
                      </span>
                    </Link>
                  )
                })
              ) : (
                <div className="py-4 text-center text-zinc-500 text-xs">
                  🎉 今日暂无到期 LeetCode 复习题，状态极佳！
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 第二行：秋招进行中面试 & 论文章节进展 (展示全部章节，删除前面的 01. 序号) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 近期紧要面试排期 (专属面试板块) */}
        <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <Clock className="w-4 h-4 text-amber-400" />
              面试中流程 ({activeInterviews.length})
            </h3>
            <Link href="/career" className="text-xs sm:text-sm text-zinc-400 hover:text-white hover:underline">
              进入秋招管家
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeInterviews.slice(0, 4).map((job) => {
              const latestIv = job.interviews?.[job.interviews.length - 1]

              return (
                <div
                  key={job.id}
                  className="p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs sm:text-sm gap-2"
                >
                  <div className="min-w-0">
                    <h5 className="font-bold text-white truncate">{job.company}</h5>
                    <p className="text-xs text-zinc-400 truncate">{job.role} · {job.location || 'Base 未填'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full text-xs border border-amber-500/25">
                      {latestIv?.round || job.status}
                    </span>
                    {latestIv?.date && (
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">{latestIv.date}</p>
                    )}
                  </div>
                </div>
              )
            })}

            {activeInterviews.length === 0 && (
              <p className="text-xs sm:text-sm text-zinc-500 py-8 text-center">暂无待面试记录（可在秋招管家导入或新增）</p>
            )}
          </div>
        </div>

        {/* 论文写作章节进展 (展示全部章节，删除前面的 01. 序号) */}
        <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              学位论文章节进展 ({thesis?.chapters.length || 0}章全景)
            </h3>
            <Link href="/research" className="text-xs sm:text-sm text-zinc-400 hover:text-white hover:underline">
              进入硕士毕业管理
            </Link>
          </div>

          <div className="space-y-3 max-h-[290px] overflow-y-auto pr-1">
            {thesis?.chapters.map((ch) => {
              const p = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="space-y-1.5 text-xs sm:text-sm p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    {/* 直接显示章节标题，删除了前面的 01. 序号 */}
                    <span className="font-medium text-zinc-200 truncate max-w-[240px] sm:max-w-[320px]">
                      {ch.title}
                    </span>
                    <span className="font-mono text-zinc-400 shrink-0 text-xs">
                      <strong className="text-white">{p}%</strong> ({ch.currentWords}字)
                    </span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-400 to-white rounded-full transition-all duration-300"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
