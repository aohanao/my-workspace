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
import { isJobApplied } from '@/lib/feishu-parser'
import { KanbanBoard } from '@/components/career/kanban-board'
import { JobTable } from '@/components/career/job-table'
import { FeishuImporter } from '@/components/career/feishu-importer'
import { JobDetailModal } from '@/components/career/job-detail-modal'
import { getLocalDateKey } from '@/lib/utils'

export default function CareerPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [isImporterOpen, setIsImporterOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobApplication | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const loadData = () => {
    setJobs(StorageService.getJobs())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('workspace-data-updated', handleUpdate)
    return () => window.removeEventListener('workspace-data-updated', handleUpdate)
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
      StorageService.updateJob({ ...job, status: nextStatus, updatedAt: new Date().toISOString() })
      loadData()
    }
  }

  const [showInterviewDrilldown, setShowInterviewDrilldown] = useState(false)

  const totalCount = jobs.length
  const appliedJobs = jobs.filter((j) => isJobApplied(j))
  const notAppliedJobs = jobs.filter((j) => !isJobApplied(j))
  const appliedCount = appliedJobs.length
  const notAppliedCount = notAppliedJobs.length

  const interviewCount = jobs.filter((j) => ['interview1', 'interview2', 'interview3', 'hr'].includes(j.status)).length
  const offerCount = jobs.filter((j) => j.status === 'offer').length

  // 各轮次到达企业数（以实际已投递为基数进行转化率分析）
  const round1Jobs = jobs.filter(
    (j) =>
      ['interview1', 'interview2', 'interview3', 'hr', 'offer'].includes(j.status) ||
      j.interviews?.some((i) => i.round.includes('一面') || i.round.includes('初面'))
  )
  const round2Jobs = jobs.filter(
    (j) =>
      ['interview2', 'interview3', 'hr', 'offer'].includes(j.status) ||
      j.interviews?.some((i) => i.round.includes('二面') || i.round.includes('复面') || i.round.includes('交叉'))
  )
  const round3Jobs = jobs.filter(
    (j) =>
      ['interview3', 'hr', 'offer'].includes(j.status) ||
      j.interviews?.some((i) => i.round.includes('三面') || i.round.includes('主管') || i.round.includes('业务'))
  )
  const hrJobs = jobs.filter(
    (j) =>
      ['hr', 'offer'].includes(j.status) ||
      j.interviews?.some((i) => i.round.includes('HR') || i.round.includes('人事') || i.round.includes('终面'))
  )

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
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-2xl bg-white/[0.08] text-white border border-white/[0.12]">
              <Briefcase className="w-5 h-5" />
            </div>
            <span>秋招求职管家</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            全流程投递跟踪 · 飞书表格自动识别 · 面试复盘考点库
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 大屏跳转 */}
          <Link
            href="/career/analytics"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-white text-xs font-medium border border-white/[0.08] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>量化大屏</span>
          </Link>

          {/* 飞书导入 */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.08] transition-colors"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 text-xs font-medium border border-white/[0.08] transition-colors"
              title="一键清空所有投递记录"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空记录</span>
            </button>
          )}

          {/* 新增投递 */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full linear-btn-primary text-xs font-semibold"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>添加投递</span>
          </button>
        </div>
      </div>

      {/* 核心数据概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* 实际已投递企业 */}
        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-zinc-400 font-medium">实际已投递</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-300 font-mono">
                已投
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <h3 className="text-xl sm:text-2xl font-bold font-mono text-white">{appliedCount}</h3>
              <span className="text-xs text-zinc-500">家</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              储备待投 <span className="font-mono text-amber-400">{notAppliedCount}</span> 家 (共{totalCount}家)
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        {/* 面试中流程 */}
        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">面试中流程</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">{interviewCount}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">正在推进面试轮次</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* 已获 Offer */}
        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">已获 Offer</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">{offerCount}</h3>
            <p className="text-[10px] text-zinc-500 mt-1">
              录用率 {appliedCount > 0 ? Math.round((offerCount / appliedCount) * 100) : 0}%
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Award className="w-4 h-4" />
          </div>
        </div>

        {/* 综合约面率 (交互式点击展开下钻) */}
        <div
          onClick={() => setShowInterviewDrilldown(!showInterviewDrilldown)}
          className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all group relative overflow-hidden"
          title="点击展开/收起技术一面、二面、三面转化率明细"
        >
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] text-zinc-400 font-medium">综合约面率</p>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                点击下钻
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-0.5 flex items-center gap-1">
              <span>{interviewRate}%</span>
              {showInterviewDrilldown ? (
                <ChevronUp className="w-4 h-4 text-indigo-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-300 group-hover:translate-y-0.5 transition-transform" />
              )}
            </h3>
            <p className="text-[10px] text-indigo-300/80 mt-1 flex items-center gap-1">
              <span>一面/二面/三面明细</span>
            </p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 面试各轮次转化率点击下钻透视面板 (一面、二面、三面、终面) */}
      {showInterviewDrilldown && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#090e1c]/90 border border-indigo-500/30 shadow-xl space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>多轮面试转化率下钻透视</span>
                  <span className="text-[10px] bg-white/[0.08] text-zinc-300 px-2 py-0.5 rounded-full font-normal">
                    以实际已投递 {appliedCount} 家企业为计算基准
                  </span>
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  精确量化各轮技术面试达标率与前序晋级淘汰情况
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInterviewDrilldown(false)}
              className="text-xs text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/[0.04] self-end sm:self-auto"
            >
              收起面板 ▲
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 技术一面 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  技术一面转化率
                </span>
                <span className="text-xs font-mono text-zinc-400">{round1Jobs.length} 家到达</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{rate1}%</span>
                <span className="text-[11px] text-zinc-400 font-mono">({round1Jobs.length}/{appliedCount || 1})</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${rate1}%` }} />
              </div>
              <p className="text-[10px] text-zinc-400">已投企业初筛与测评后约面率</p>
            </div>

            {/* 技术二面 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-orange-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-orange-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  技术二面转化率
                </span>
                <span className="text-xs font-mono text-zinc-400">{round2Jobs.length} 家到达</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{rate2}%</span>
                <span className="text-[11px] text-zinc-400 font-mono">({round2Jobs.length}/{appliedCount || 1})</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: `${rate2}%` }} />
              </div>
              <p className="text-[10px] text-orange-300/90 font-medium">
                一面通过率：<span className="font-mono font-bold text-white">{passRate1to2}%</span>
              </p>
            </div>

            {/* 技术三面 / 主管面 */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  技术三面/主管面
                </span>
                <span className="text-xs font-mono text-zinc-400">{round3Jobs.length} 家到达</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{rate3}%</span>
                <span className="text-[11px] text-zinc-400 font-mono">({round3Jobs.length}/{appliedCount || 1})</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${rate3}%` }} />
              </div>
              <p className="text-[10px] text-indigo-300/90 font-medium">
                二面通过率：<span className="font-mono font-bold text-white">{passRate2to3}%</span>
              </p>
            </div>

            {/* HR终面 / Offer */}
            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  终面 / 录用转化
                </span>
                <span className="text-xs font-mono text-zinc-400">{offerCount} 份Offer</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-white">{rateHr}%</span>
                <span className="text-[11px] text-zinc-400 font-mono">({hrJobs.length}/{appliedCount || 1})</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${rateHr}%` }} />
              </div>
              <p className="text-[10px] text-emerald-300/90 font-medium">
                终面转Offer率：<span className="font-mono font-bold text-white">{hrJobs.length > 0 ? Math.round((offerCount / hrJobs.length) * 100) : 0}%</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 视图切换控制 */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'kanban'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>看板模式</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'table'
                ? 'bg-white/[0.08] text-white shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>清单列表</span>
          </button>
        </div>

        <p className="text-xs text-zinc-500 hidden sm:block">
          点击卡片可查看被问考点、记录复盘并打分
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
    </div>
  )
}
