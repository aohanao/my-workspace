'use client'

import { useState, useEffect } from 'react'
import {
  Flame,
  Clock,
  Briefcase,
  GraduationCap,
  Brain,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  CalendarDays,
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
  const [top3, setTop3] = useState<DailyTop3Item[]>([])
  const [leetcode, setLeetcode] = useState<LeetCodeItem[]>([])
  const [habits, setHabits] = useState<HabitItem[]>([])
  const [newTop3Text, setNewTop3Text] = useState('')

  useEffect(() => {
    const loadData = () => {
      setJobs(StorageService.getJobs())
      setThesis(StorageService.getThesis())
      setTop3(StorageService.getTop3())
      setLeetcode(StorageService.getLeetCode())
      setHabits(StorageService.getHabits())
    }

    loadData()
    window.addEventListener('workspace-data-updated', loadData)
    return () => window.removeEventListener('workspace-data-updated', loadData)
  }, [])

  const handleToggleTop3 = (id: string) => {
    const updated = top3.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    setTop3(updated)
    StorageService.saveTop3(updated)
  }

  const handleAddTop3 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTop3Text.trim()) return
    const newItem: DailyTop3Item = {
      id: `top-${Date.now()}`,
      text: newTop3Text.trim(),
      done: false,
    }
    const updated = [...top3, newItem]
    setTop3(updated)
    StorageService.saveTop3(updated)
    setNewTop3Text('')
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
  const dueReviews = leetcode.filter((item) => item.nextReview <= today).slice(0, 2)
  const upcomingInterviews = jobs
    .flatMap((job) => (job.interviews || []).map((interview) => ({ job, interview })))
    .filter(({ interview }) => interview.date >= today)
    .sort((a, b) => a.interview.date.localeCompare(b.interview.date))
    .slice(0, 2)
  const openTasks = top3.filter((item) => !item.done).slice(0, 2)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 顶部 Hero 横幅 */}
      <div className="linear-card p-4 sm:p-6 md:p-8 rounded-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-2.5 sm:mb-3 border border-blue-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>多线程攻坚中枢</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
              毕业科研推进 · 秋招求职转化 · 系统复盘
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2 max-w-xl leading-relaxed">
              聚焦核心路径，量化各阶段推进指标，保持从容专注的节奏。
            </p>
          </div>

          {/* 双核心倒计时卡片 (手机端自适应双列) */}
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3 shrink-0 w-full lg:w-auto">
            {/* 秋招倒计时 */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-center sm:min-w-[130px]">
              <span className="text-[11px] font-medium text-blue-400 block mb-1">
                秋招冲刺截止
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {careerCountdown.days} <span className="text-xs font-normal text-zinc-500">天</span>
              </div>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{WORKSPACE_DEADLINES.careerSprint.replaceAll('-', '.')}</span>
            </div>

            {/* 盲审送审倒计时 */}
            <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] text-center sm:min-w-[130px]">
              <span className="text-[11px] font-medium text-indigo-400 block mb-1">
                论文盲审送审
              </span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
                {thesisCountdown.days} <span className="text-xs font-normal text-zinc-500">天</span>
              </div>
              <span className="text-[10px] text-zinc-500 block mt-0.5">{(thesis?.blindReviewDate || WORKSPACE_DEADLINES.blindReview).replaceAll('-', '.')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 今日行动快速清单 */}
      <section className="border-y border-white/[0.06] py-3.5 sm:py-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h2 className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-400" />
            今日行动
          </h2>
          <span className="text-[11px] text-zinc-500">按临近程度整理</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          <Link href="/" className="p-3 rounded-xl border border-white/[0.06] hover:border-white/[0.14] bg-white/[0.02] transition-colors">
            <p className="text-[11px] text-zinc-500 mb-1.5">优先任务</p>
            {openTasks.length > 0 ? openTasks.map((item) => (
              <p key={item.id} className="text-xs text-zinc-200 truncate leading-6">{item.text}</p>
            )) : <p className="text-xs text-zinc-500">今天的三件事已完成</p>}
          </Link>
          <Link href="/study" className="p-3 rounded-xl border border-white/[0.06] hover:border-blue-500/40 bg-white/[0.02] transition-colors">
            <p className="text-[11px] text-zinc-500 mb-1.5">到期复习</p>
            {dueReviews.length > 0 ? dueReviews.map((item) => (
              <p key={item.id} className="text-xs text-zinc-200 truncate leading-6">#{item.number} {item.title}</p>
            )) : <p className="text-xs text-zinc-500">没有到期复习</p>}
          </Link>
          <Link href="/career" className="p-3 rounded-xl border border-white/[0.06] hover:border-amber-500/40 bg-white/[0.02] transition-colors sm:col-span-2 md:col-span-1">
            <p className="text-[11px] text-zinc-500 mb-1.5">近期面试</p>
            {upcomingInterviews.length > 0 ? upcomingInterviews.map(({ job, interview }) => (
              <p key={interview.id} className="text-xs text-zinc-200 truncate leading-6">{interview.date} · {job.company} {interview.round}</p>
            )) : <p className="text-xs text-zinc-500">暂无已排期面试</p>}
          </Link>
        </div>
      </section>

      {/* 第一行：今日核心三件事 (Daily Top 3) 与 进度概览 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 今日核心 Focus */}
        <div className="lg:col-span-2 linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <Flame className="w-4 h-4 text-amber-400" />
              今日核心三件事 (Daily Top 3 Focus)
            </h3>
            <span className="text-[11px] text-zinc-500">最重要的事项</span>
          </div>

          <div className="space-y-2">
            {top3.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleTop3(item.id)}
                className={`p-3 sm:p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  item.done
                    ? 'bg-white/[0.01] border-white/[0.04] opacity-50'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.15] hover:bg-white/[0.04]'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                    item.done
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-zinc-600 bg-transparent'
                  }`}
                >
                  {item.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs flex-1 break-words ${item.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          {/* 新增今日事项 */}
          <form onSubmit={handleAddTop3} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newTop3Text}
              onChange={(e) => setNewTop3Text(e.target.value)}
              placeholder="添加今日重要任务..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-black/30 border border-white/[0.08] text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 linear-btn-primary text-xs rounded-xl shrink-0"
            >
              添加
            </button>
          </form>
        </div>

        {/* 快捷数据指标 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div className="border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <Layers className="w-4 h-4 text-blue-400" />
              进度概览
            </h3>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/career"
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-300">秋招投递企业</span>
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
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-zinc-300">硕士论文进度</span>
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
              className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-300">LeetCode 复习池</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold font-mono text-white">
                  {leetcode.length} 道高频题
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>

          <Link
            href="/career/analytics"
            className="w-full py-2.5 rounded-xl linear-btn-primary text-xs flex items-center justify-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            <span>进入秋招量化大屏</span>
          </Link>
        </div>
      </div>

      {/* 第二行：秋招进行中面试 & 论文章节微缩看板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* 近期紧要面试排期 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <Clock className="w-4 h-4 text-amber-400" />
              面试中流程 ({activeInterviews.length})
            </h3>
            <Link href="/career" className="text-xs text-blue-400 hover:underline">
              查看全部
            </Link>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {activeInterviews.slice(0, 3).map((job) => {
              const latestIv = job.interviews?.[job.interviews.length - 1]

              return (
                <div
                  key={job.id}
                  className="p-3 sm:p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs gap-2"
                >
                  <div className="min-w-0">
                    <h5 className="font-semibold text-white truncate">{job.company}</h5>
                    <p className="text-[11px] text-zinc-400 truncate">{job.role} · {job.location || 'Base 未填'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/20">
                      {latestIv?.round || job.status}
                    </span>
                    {latestIv?.date && (
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{latestIv.date}</p>
                    )}
                  </div>
                </div>
              )
            })}

            {activeInterviews.length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">暂无待面试记录</p>
            )}
          </div>
        </div>

        {/* 论文写作章节概况 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2 tracking-tight">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              学位论文章节进展
            </h3>
            <Link href="/research" className="text-xs text-indigo-400 hover:underline">
              进入科研模块
            </Link>
          </div>

          <div className="space-y-3">
            {thesis?.chapters.slice(0, 4).map((ch, idx) => {
              const p = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-300 truncate max-w-[200px] sm:max-w-[280px]">
                      0{idx + 1}. {ch.title.split(' ')[0]} {ch.title.split(' ')[1] || ''}
                    </span>
                    <span className="font-mono text-zinc-400 shrink-0">{p}% ({ch.currentWords}字)</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-blue-500 rounded-full"
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
