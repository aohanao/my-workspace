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
} from '@/types'

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [thesis, setThesis] = useState<ThesisInfo | null>(null)
  const [dailyTasks, setDailyTasks] = useState<DailyTop3Item[]>([])
  const [leetcode, setLeetcode] = useState<LeetCodeItem[]>([])
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [newTaskText, setNewTaskText] = useState('')
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
    }
    const updated = [...dailyTasks, newItem]
    setDailyTasks(updated)
    StorageService.saveTop3(updated)
    setNewTaskText('')
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
  const upcomingInterviews = jobs
    .flatMap((job) => (job.interviews || []).map((interview) => ({ job, interview })))
    .filter(({ interview }) => interview.date >= today)
    .sort((a, b) => a.interview.date.localeCompare(b.interview.date))

  const completedCount = dailyTasks.filter((t) => t.done).length
  const taskProgress = dailyTasks.length > 0 ? Math.round((completedCount / dailyTasks.length) * 100) : 0

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 顶部 Hero 横幅 - DeepSeek 风格高级深色大片 */}
      <div className="linear-card p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              <span className="text-xs font-mono font-medium text-zinc-300 tracking-wider uppercase">
                AI WORKSPACE OS · DASHBOARD
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

      {/* ===================== 核心模块：今日全天日程安排与核心待办 ===================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 2 列：今日核心待办大版面 */}
        <div className="lg:col-span-2 linear-card p-6 sm:p-7 rounded-3xl space-y-5 border border-white/[0.08] flex flex-col justify-between">
          <div className="space-y-4">
            {/* 顶栏：标题、达成度 */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5 flex-wrap gap-2">
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
                  <p className="text-xs text-zinc-400 mt-0.5">一天的核心工作计划 · 支持自由增减与点击修改</p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-white bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1]">
                {taskProgress}% 达成
              </span>
            </div>

            {/* 进度条 */}
            <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-zinc-300 to-white rounded-full transition-all duration-500"
                style={{ width: `${taskProgress}%` }}
              />
            </div>

            {/* 任务列表 */}
            <div className="space-y-2.5 pt-1">
              {dailyTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 sm:p-4 rounded-2xl border flex items-center gap-3.5 transition-all group ${
                    task.done
                      ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                      : 'bg-black/40 border-white/[0.07] hover:border-white/[0.16] hover:bg-white/[0.03]'
                  }`}
                >
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
              ))}

              {dailyTasks.length === 0 && (
                <div className="p-8 text-center text-zinc-500 border border-dashed border-white/[0.08] rounded-2xl">
                  今日暂无安排，在下方输入框添加一天的核心事项
                </div>
              )}
            </div>
          </div>

          {/* 底部新增待办输入框 */}
          <form onSubmit={handleAddTask} className="flex gap-2.5 pt-3 border-t border-white/[0.08]">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="安排今日新事项（输入后回车或点击添加）..."
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-black/40 border border-white/[0.1] text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              className="px-5 py-2.5 linear-btn-primary text-xs sm:text-sm rounded-full font-semibold shrink-0 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>添加安排</span>
            </button>
          </form>
        </div>

        {/* 右侧 1 列：各系统全局概览 & 临近提醒 */}
        <div className="space-y-6">
          {/* 进度概览卡片 */}
          <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
            <div className="border-b border-white/[0.06] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
                <Layers className="w-4 h-4 text-zinc-300" />
                全系统推进概览
              </h3>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/career"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-xs sm:text-sm text-zinc-200">秋招投递企业</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                    {totalJobs} 家 ({offersCount} Offer)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/research"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-xs sm:text-sm text-zinc-200">硕士论文进度</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                    {thesisPercent}% ({totalCurrentWords}字)
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              <Link
                href="/study"
                className="p-3.5 rounded-2xl bg-black/40 hover:bg-white/[0.04] border border-white/[0.06] flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Brain className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                  <span className="text-xs sm:text-sm text-zinc-200">力扣算法题库</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold font-mono text-white">
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
              <TrendingUp className="w-4 h-4" />
              <span>进入秋招量化大屏</span>
            </Link>
          </div>

          {/* 今日待到期题 & 临近面试提醒 */}
          <div className="linear-card p-6 rounded-3xl space-y-3.5 border border-white/[0.08] text-xs sm:text-sm">
            <h4 className="font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-300" />
              到期算法复习与面试日程
            </h4>

            <div className="space-y-2">
              {dueReviews.length > 0 ? (
                dueReviews.slice(0, 2).map((item) => (
                  <Link
                    key={item.id}
                    href="/study"
                    className="block p-3 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.14] transition-colors"
                  >
                    <span className="text-white font-mono font-semibold">#{item.number}</span>{' '}
                    <span className="text-zinc-300">{item.title}</span>
                  </Link>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">今日暂无到期 LeetCode 复习题</p>
              )}

              {upcomingInterviews.length > 0 ? (
                upcomingInterviews.slice(0, 2).map(({ job, interview }) => (
                  <Link
                    key={interview.id}
                    href="/career"
                    className="block p-3 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-white/[0.14] transition-colors text-zinc-200"
                  >
                    <span>{interview.date}</span> · <span>{job.company}</span> ({interview.round})
                  </Link>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">暂无已排期面试记录</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 第二行：秋招进行中面试 & 论文章节微缩看板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 近期紧要面试排期 */}
        <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <Clock className="w-4 h-4 text-zinc-300" />
              面试中流程 ({activeInterviews.length})
            </h3>
            <Link href="/career" className="text-xs sm:text-sm text-zinc-400 hover:text-white hover:underline">
              进入秋招管家
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeInterviews.slice(0, 3).map((job) => {
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
                    <span className="font-medium text-zinc-200 bg-white/[0.06] px-3 py-1 rounded-full text-xs border border-white/[0.08]">
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

        {/* 论文写作章节进展 */}
        <div className="linear-card p-6 rounded-3xl space-y-4 border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2 tracking-tight">
              <GraduationCap className="w-4 h-4 text-zinc-300" />
              学位论文章节进展
            </h3>
            <Link href="/research" className="text-xs sm:text-sm text-zinc-400 hover:text-white hover:underline">
              进入硕士毕业管理
            </Link>
          </div>

          <div className="space-y-3">
            {thesis?.chapters.slice(0, 4).map((ch, idx) => {
              const p = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-200 truncate max-w-[200px] sm:max-w-[280px]">
                      0{idx + 1}. {ch.title.split(' ')[0]} {ch.title.split(' ')[1] || ''}
                    </span>
                    <span className="font-mono text-zinc-400 shrink-0">{p}% ({ch.currentWords}字)</span>
                  </div>
                  <div className="w-full bg-black/50 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-white rounded-full"
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
