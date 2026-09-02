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
} from 'lucide-react'
import Link from 'next/link'
import { JobApplication, JobStatus } from '@/types'
import { StorageService } from '@/lib/storage'
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

  const totalCount = jobs.length
  const interviewCount = jobs.filter((j) => ['interview1', 'interview2', 'hr'].includes(j.status)).length
  const offerCount = jobs.filter((j) => j.status === 'offer').length
  const interviewRate = totalCount > 0 ? Math.round(((interviewCount + offerCount) / totalCount) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部标题与操作区 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-medium border border-white/[0.08] transition-all"
          >
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <span>量化大屏</span>
          </Link>

          {/* 飞书导入 */}
          <button
            onClick={() => setIsImporterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium border border-emerald-500/20 transition-colors"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 hover:text-rose-400 text-zinc-400 text-xs font-medium border border-white/[0.08] transition-colors"
              title="一键清空所有投递记录"
            >
              <Trash2 className="w-4 h-4" />
              <span>清空记录</span>
            </button>
          )}

          {/* 新增投递 */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>添加投递</span>
          </button>
        </div>
      </div>

      {/* 核心数据概览 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">总投递企业</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-white mt-0.5">{totalCount}</h3>
          </div>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">面试中流程</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-0.5">{interviewCount}</h3>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">已获 Offer</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-0.5">{offerCount}</h3>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Award className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 sm:p-4 rounded-xl linear-card flex items-center justify-between">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">综合约面率</p>
            <h3 className="text-xl sm:text-2xl font-bold font-mono text-indigo-400 mt-0.5">{interviewRate}%</h3>
          </div>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

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
