'use client'

import { useState, useEffect } from 'react'
import {
  Briefcase,
  Kanban,
  Table as TableIcon,
  Plus,
  FileSpreadsheet,
  BarChart3,
  Layers,
  Award,
  CheckCircle2,
  TrendingUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { JobApplication, JobStatus } from '@/types'
import { StorageService } from '@/lib/storage'
import { isJobApplied, hasReachedStage } from '@/lib/feishu-parser'
import { KanbanBoard } from '@/components/career/kanban-board'
import { JobTable } from '@/components/career/job-table'
import { FeishuImporter } from '@/components/career/feishu-importer'
import { JobDetailModal } from '@/components/career/job-detail-modal'
import { InterviewConversionModal } from '@/components/career/interview-conversion-modal'
import { getLocalDateKey } from '@/lib/utils'
import { getSupabase } from '@/lib/supabase'
import { FeishuSyncModal } from '@/components/career/feishu-sync-modal'
import { Zap } from 'lucide-react'

export default function CareerPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [isImporterOpen, setIsImporterOpen] = useState(false)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadData = () => {
    setJobs(StorageService.getJobs())
  }

  useEffect(() => {
    loadData()
    // 首次进入自动拉取云端最新数据
    StorageService.initCloudSync()

    const handleUpdate = () => loadData()
    window.addEventListener('workspace-data-updated', handleUpdate)

    // 订阅 Supabase Realtime 变更（飞书 Webhook 同步写入后，网页端秒级自动响应刷新）
    const supabase = getSupabase()
    let channel: any = null
    if (supabase) {
      channel = supabase
        .channel('workspace_realtime_jobs_channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'workspace_storage', filter: 'key=eq.workspace_jobs_v4' },
          () => {
            StorageService.initCloudSync()
          }
        )
        .subscribe()
    }

    return () => {
      window.removeEventListener('workspace-data-updated', handleUpdate)
      if (channel && supabase) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  const handleCreateNew = () => {
    const newJob: JobApplication = {
      id: `job-${Date.now()}`,
      company: '',
      role: '',
      applyDate: getLocalDateKey(),
      status: 'applied',
      updatedAt: new Date().toISOString(),
      interviews: [],
    }
    setSelectedJob(newJob)
    setIsDetailOpen(true)
  }

  const handleSaveJob = (job: JobApplication) => {
    const exists = jobs.some((j) => j.id === job.id)
    if (exists) {
      StorageService.updateJob(job)
    } else {
      StorageService.addJob(job)
    }
    loadData()
  }

  const handleDeleteJob = (id: string) => {
    StorageService.deleteJob(id)
    loadData()
  }

  const handleUpdateStatus = (jobId: string, nextStatus: JobStatus) => {
    const job = jobs.find((j) => j.id === jobId)
    if (job) {
      const updatedJob: JobApplication = {
        ...job,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      }

      // 如果流转至流程终止/已挂，且此前在面试或笔试阶段，自动记录其终止前阶段与面试轮次，防止统计丢失
      if (nextStatus === 'rejected' && job.status !== 'rejected') {
        updatedJob.lastStage = job.status
        const stageLabels: Record<string, string> = {
          assessment: '笔试测评',
          interview1: '技术一面',
          interview2: '技术二面',
          interview3: '技术三面',
          hr: 'HR面/终面',
        }
        if (stageLabels[job.status]) {
          const hasRecord = job.interviews?.some((i) => i.round.includes(stageLabels[job.status]))
          if (!hasRecord) {
            updatedJob.interviews = [
              ...(job.interviews || []),
              {
                id: `iv-${Date.now()}`,
                round: stageLabels[job.status],
                date: getLocalDateKey(),
                questions: [],
                feedback: '流程终止已挂',
              },
            ]
          }
        }
      }

      StorageService.updateJob(updatedJob)
      loadData()
    }
  }

  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false)

  const totalCount = jobs.length
  const appliedJobs = jobs.filter((j) => isJobApplied(j))
  const notAppliedJobs = jobs.filter((j) => !isJobApplied(j))
  const appliedCount = appliedJobs.length
  const notAppliedCount = notAppliedJobs.length

  const screeningCount = jobs.filter((j) => j.status === 'applied').length
  const assessmentCount = jobs.filter((j) => j.status === 'assessment').length
  const interviewCount = jobs.filter((j) => ['interview1', 'interview2', 'interview3', 'hr'].includes(j.status)).length
  const offerCount = jobs.filter((j) => j.status === 'offer').length
  const rejectedCount = jobs.filter((j) => j.status === 'rejected').length

  // 各轮次到达企业数（以实际已投递为基数进行转化率分析，严格计入已挂但经历过面试的流程）
  const round1Jobs = jobs.filter((j) => hasReachedStage(j, 'round1'))
  const round2Jobs = jobs.filter((j) => hasReachedStage(j, 'round2'))
  const round3Jobs = jobs.filter((j) => hasReachedStage(j, 'round3'))
  const hrJobs = jobs.filter((j) => hasReachedStage(j, 'hr'))

  const reachedInterviewCount = round1Jobs.length
  const interviewRate = appliedCount > 0 ? Math.round((reachedInterviewCount / appliedCount) * 100) : 0

  // 各轮绝对转化率 (占实际已投递企业比例)
  const rate1 = appliedCount > 0 ? Math.round((round1Jobs.length / appliedCount) * 100) : 0
  const rate2 = appliedCount > 0 ? Math.round((round2Jobs.length / appliedCount) * 100) : 0
  const rate3 = appliedCount > 0 ? Math.round((round3Jobs.length / appliedCount) * 100) : 0
  const rateHr = appliedCount > 0 ? Math.round((hrJobs.length / appliedCount) * 100) : 0

  // 轮次间晋级通过率
  const passRate1to2 = round1Jobs.length > 0 ? Math.round((round2Jobs.length / round1Jobs.length) * 100) : 0
  const passRate2to3 = round2Jobs.length > 0 ? Math.round((round3Jobs.length / round2Jobs.length) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部标题与操作区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5 sm:gap-3 tracking-tight">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-white/[0.08] text-white border border-white/[0.12]">
              <Briefcase className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <span>秋招求职管家</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
            全流程投递跟踪 · 飞书表格自动识别 · 面试复盘考点库
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {/* 大屏跳转 */}
          <Link
            href="/career/analytics"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white text-xs sm:text-sm font-medium border border-white/[0.08] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>量化大屏</span>
          </Link>

          {/* 飞书实时同步 (Webhook) */}
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 text-xs sm:text-sm font-medium border border-cyan-500/30 transition-colors shadow-sm"
            title="配置飞书多维表格自动化 Webhook，实现变更秒级自动同步"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>实时同步</span>
          </button>

          {/* 飞书导入 */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs sm:text-sm font-medium border border-white/[0.08] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>导入飞书</span>
          </button>

          {/* 清空列表 */}
          {jobs.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`确定要清空全部 ${jobs.length} 条投递记录吗？清空后可通过飞书重新导入`)) {
                  StorageService.saveJobs([])
                  setJobs([])
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 text-xs sm:text-sm font-medium border border-white/[0.08] transition-colors"
              title="一键清空所有投递记录"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空记录</span>
            </button>
          )}

          {/* 新增投递 */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full linear-btn-primary text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>添加投递</span>
          </button>
        </div>
      </div>

      {/* 核心数据概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* 实际已投递企业 */}
        <div className="p-4 sm:p-5 rounded-2xl linear-card flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">实际已投递</p>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono">
                已投
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-white">{appliedCount}</h3>
              <span className="text-xs sm:text-sm text-zinc-400">家</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 sm:mt-1.5">
              储备待投 <span className="font-mono font-semibold text-amber-400">{notAppliedCount}</span> 家 (共{totalCount}家)
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* 面试推进中流程 */}
        <div className="p-4 sm:p-5 rounded-2xl linear-card flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">面试推进中</p>
            <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">{interviewCount}</h3>
              <span className="text-xs sm:text-sm text-zinc-400">家</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 sm:mt-1.5">
              待初筛/笔试 {screeningCount + assessmentCount} · 已挂 {rejectedCount}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* 已获 Offer */}
        <div className="p-4 sm:p-5 rounded-2xl linear-card flex items-center justify-between">
          <div>
            <p className="text-xs sm:text-sm text-zinc-300 font-medium">已获 Offer</p>
            <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{offerCount}</h3>
              <span className="text-xs sm:text-sm text-zinc-400">家</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 sm:mt-1.5">
              录用率 {appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0}% · 终止 {rejectedCount}家
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* 技术一面转化率 (点击弹窗查看各阶段详情) */}
        <div
          onClick={() => setIsConversionModalOpen(true)}
          className="p-4 sm:p-5 rounded-2xl linear-card flex items-center justify-between cursor-pointer hover:border-indigo-500/40 hover:bg-white/[0.04] transition-all group relative overflow-hidden"
          title="点击弹窗查看一面、二面、三面、终面各阶段转化率与企业清单"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs sm:text-sm text-zinc-300 font-medium">技术一面转化率</p>
              <span className="text-[11px] sm:text-xs px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                各阶段明细
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-1 sm:mt-1.5">
              <h3 className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">{rate1}%</h3>
              <span className="text-xs sm:text-sm text-zinc-400">({round1Jobs.length}家)</span>
            </div>
            <p className="text-xs text-indigo-300 mt-1 sm:mt-1.5 flex items-center gap-1 group-hover:text-indigo-200 transition-colors">
              <span>点击查看各阶段漏斗转化 ↗</span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 投递全景流转与总数严格核验条 */}
      <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className="text-zinc-300 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            全库求职总览 (共 <span className="font-mono font-bold text-white text-sm sm:text-base">{totalCount}</span> 家) =
          </span>
          <span className="text-zinc-200 font-medium">
            实际已投递 <span className="font-mono font-bold text-blue-400 text-sm sm:text-base">{appliedCount}</span> 家
            <span className="text-zinc-400 ml-1.5">
              [待初筛 <span className="font-mono text-zinc-200 font-semibold">{screeningCount}</span> · 笔试测评 <span className="font-mono text-purple-300 font-semibold">{assessmentCount}</span> · 面试中 <span className="font-mono text-amber-300 font-semibold">{interviewCount}</span> · Offer <span className="font-mono text-emerald-300 font-semibold">{offerCount}</span> · <span className="text-rose-400 font-semibold">已挂/终止 <span className="font-mono">{rejectedCount}</span></span>]
            </span>
          </span>
          <span className="text-zinc-600 font-bold">＋</span>
          <span className="text-zinc-400">
            储备待投 <span className="font-mono font-semibold text-amber-400 text-sm sm:text-base">{notAppliedCount}</span> 家
          </span>
        </div>
        <div className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-semibold">
          总数核验 100% 对齐 ✓
        </div>
      </div>

      {/* 视图切换控制 */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3.5">
        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>看板模式</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>表格模式</span>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-zinc-400 hidden sm:block">
          💡 点击卡片可查看被问考点、记录复盘并打分
        </p>
      </div>

      {/* 视图主体 */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          jobs={jobs}
          onSelectJob={(job) => {
            setSelectedJob(job)
            setIsDetailOpen(true)
          }}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <JobTable
          jobs={jobs}
          onSelectJob={(job) => {
            setSelectedJob(job)
            setIsDetailOpen(true)
          }}
          onDeleteJob={handleDeleteJob}
          onUpdateJob={handleSaveJob}
          onBatchUpdateJobs={(updatedList) => {
            StorageService.saveJobs(updatedList)
            loadData()
          }}
        />
      )}

      {/* 飞书导入模态框 */}
      <FeishuImporter
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={(count) => {
          loadData()
          alert(`成功导入并更新了 ${count} 条求职记录！`)
        }}
      />

      {/* 详情与复盘弹窗 */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false)
          setSelectedJob(null)
        }}
        onSave={handleSaveJob}
        onDelete={handleDeleteJob}
      />

      {/* 多轮面试转化率全景弹窗 */}
      <InterviewConversionModal
        isOpen={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        jobs={jobs}
        onSelectJob={(job) => {
          setIsConversionModalOpen(false)
          setSelectedJob(job)
          setIsDetailOpen(true)
        }}
      />

      {/* 飞书实时同步配置弹窗 */}
      <FeishuSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSyncTriggered={() => loadData()}
      />
    </div>
  )
}
