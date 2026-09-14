'use client'

import { useState, useRef } from 'react'
import { JobApplication, JobStatus } from '@/types'
import { isJobApplied, getJobStageBadge, getJobDisplayTags } from '@/lib/feishu-parser'
import {
  Search,
  Download,
  ExternalLink,
  Edit3,
  Trash2,
  Globe,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Table as TableIcon,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react'

interface Props {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
  onDeleteJob?: (id: string) => void
  onUpdateJob?: (job: JobApplication) => void
  onBatchUpdateJobs?: (jobs: JobApplication[]) => void
}

const STATUS_LABELS: Record<JobStatus, { label: string; badge: string }> = {
  wishlist: { label: '意向备战', badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  applied: { label: '已投递', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  assessment: { label: '笔试/测评', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  interview1: { label: '技术一面', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  interview2: { label: '技术二面', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  interview3: { label: '技术三面', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  hr: { label: 'HR面/谈薪', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  offer: { label: '已获 Offer 🎉', badge: 'bg-emerald-500/15 text-emerald-400 font-bold border-emerald-500/30' },
  rejected: { label: '流程终止', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
}

export function JobTable({ jobs, onSelectJob, onDeleteJob, onUpdateJob, onBatchUpdateJobs }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [applyTab, setApplyTab] = useState<'all' | 'applied' | 'not_applied'>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // 统计已投递与未投递总数
  const appliedCount = jobs.filter((j) => isJobApplied(j)).length
  const notAppliedCount = jobs.length - appliedCount

  const filtered = jobs.filter((j) => {
    // 投递状态 Tab 过滤
    if (applyTab === 'applied' && !isJobApplied(j)) return false
    if (applyTab === 'not_applied' && isJobApplied(j)) return false

    const matchesSearch =
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      (j.category && j.category.toLowerCase().includes(search.toLowerCase())) ||
      (j.location && j.location.toLowerCase().includes(search.toLowerCase())) ||
      (j.industry && j.industry.toLowerCase().includes(search.toLowerCase())) ||
      (j.notes && j.notes.toLowerCase().includes(search.toLowerCase()))

    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || j.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // 行内单项切换投递状态 (已投递 ⇄ 未投递)
  const handleToggleApplyStatus = (job: JobApplication, e: React.MouseEvent) => {
    e.stopPropagation()
    const currentApplied = isJobApplied(job)
    const nextApplied = !currentApplied
    const nextStatus: JobStatus = nextApplied
      ? (job.status === 'wishlist' ? 'applied' : job.status)
      : 'wishlist'

    const updatedJob: JobApplication = {
      ...job,
      applyStatus: nextApplied ? '已投递' : '未投递',
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    }
    onUpdateJob?.(updatedJob)
  }

  // 批量全选/取消
  const handleToggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((j) => j.id)))
    }
  }

  // 单行勾选
  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // 批量设置投递状态
  const handleBatchSetApplyStatus = (nextApplied: boolean) => {
    if (selectedIds.size === 0) return
    const updatedJobs = jobs.map((j) => {
      if (selectedIds.has(j.id)) {
        const nextStatus: JobStatus = nextApplied
          ? (j.status === 'wishlist' ? 'applied' : j.status)
          : 'wishlist'
        return {
          ...j,
          applyStatus: nextApplied ? '已投递' : '未投递',
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        }
      }
      return j
    })

    if (onBatchUpdateJobs) {
      onBatchUpdateJobs(updatedJobs)
    } else if (onUpdateJob) {
      updatedJobs.filter((j) => selectedIds.has(j.id)).forEach((j) => onUpdateJob(j))
    }
    setSelectedIds(new Set())
  }

  // 快捷横向滑动控制
  const handleScrollHorizontally = (offset: number) => {
    if (!scrollContainerRef.current) return
    scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' })
  }

  const handleScrollToEdge = (edge: 'left' | 'right') => {
    if (!scrollContainerRef.current) return
    if (edge === 'left') {
      scrollContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      scrollContainerRef.current.scrollTo({ left: scrollContainerRef.current.scrollWidth, behavior: 'smooth' })
    }
  }

  const exportCSV = () => {
    const headers = ['投递公司', '投递状态', '优先级', '投递日期', '类型与岗位', 'base地', '职位', '行业', '官网', '当前阶段', '备注']
    const rows = filtered.map((j) => [
      `"${j.company}"`,
      `"${isJobApplied(j) ? '已投递' : '未投递'}"`,
      `"${j.priority || ''}"`,
      `"${j.applyDate}"`,
      `"${j.category || ''}"`,
      `"${j.location || ''}"`,
      `"${j.role}"`,
      `"${j.industry || ''}"`,
      `"${j.jobUrl || ''}"`,
      `"${STATUS_LABELS[j.status]?.label || j.status}"`,
      `"${(j.notes || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `秋招投递数据-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-3.5 ${isFullscreen ? 'fixed inset-3 sm:inset-6 z-50 bg-[#070a12]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col' : ''}`}>
      {/* 顶部标签切换栏：已投递 vs 未投递 / 意向储备 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl linear-card shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          <button
            onClick={() => setApplyTab('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              applyTab === 'all'
                ? 'bg-white/[0.12] text-white font-semibold shadow-sm border border-white/[0.15]'
                : 'text-zinc-400 hover:text-white bg-white/[0.02] border border-transparent'
            }`}
          >
            <span>全部岗位</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-white/[0.08] text-zinc-300">
              {jobs.length}
            </span>
          </button>

          <button
            onClick={() => setApplyTab('applied')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              applyTab === 'applied'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-blue-300 bg-white/[0.02] border border-transparent'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>实际已投递</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300">
              {appliedCount}
            </span>
          </button>

          <button
            onClick={() => setApplyTab('not_applied')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              applyTab === 'not_applied'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-amber-300 bg-white/[0.02] border border-transparent'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>未投递 / 意向储备</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300">
              {notAppliedCount}
            </span>
          </button>
        </div>

        {/* 批量操作工具栏 */}
        {selectedIds.size > 0 ? (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-blue-500/10 border border-blue-500/25 px-3 py-1.5 rounded-xl animate-in fade-in duration-150">
            <span className="text-blue-300 font-medium font-mono">已选中 {selectedIds.size} 项:</span>
            <button
              onClick={() => handleBatchSetApplyStatus(true)}
              className="px-2.5 py-1 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-sm"
            >
              设为「已投递」
            </button>
            <button
              onClick={() => handleBatchSetApplyStatus(false)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.08] text-amber-300 hover:bg-white/[0.15] border border-amber-500/30 transition-colors"
            >
              设为「未投递」
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-zinc-400 hover:text-white px-1.5 py-1"
            >
              取消
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 hidden sm:block">
            💡 点击列表「投递状态」微徽章可直接秒切 已投 ⇄ 未投
          </p>
        )}
      </div>

      {/* ===================== 二级终端视窗 (Sub-Window Terminal) ===================== */}
      <div className={`sub-window-terminal rounded-2xl overflow-hidden flex flex-col relative transition-all border border-white/[0.1] ${isFullscreen ? 'flex-1 min-h-0' : 'h-[580px]'}`}>
        {/* 视窗标题栏与控制台 (Sub-window Header) */}
        <div className="px-4 py-2.5 bg-[#090d16]/95 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* 拟物终端小红绿点 */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            </div>

            <div className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-zinc-300" />
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight font-mono">
                [ 投递清单二级视窗 // JOB_PIPELINE_CONSOLE ]
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-mono border border-white/[0.1]">
                已展示 {filtered.length} / 共 {jobs.length} 岗位
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 横向视口快速跳移 */}
            <button
              onClick={() => handleScrollToEdge('left')}
              title="滑动到最左侧首列"
              className="px-2.5 py-1 rounded-full text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">首列</span>
            </button>
            <button
              onClick={() => handleScrollToEdge('right')}
              title="滑动到最右侧流程与操作"
              className="px-2.5 py-1 rounded-full text-xs text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">右滑看全标题</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* 展开全屏视窗 / 还原窗口 */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? '还原窗口' : '全屏展开二级视窗'}
              className="p-1.5 rounded-full text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors ml-1"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* 视窗内部双轴滚动区域 (Header Sticky, Body Scrollable) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative divide-y divide-white/[0.05]"
        >
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[1180px]">
            {/* 表头固定在二级窗口顶部 */}
            <thead className="sticky top-0 z-20 bg-[#090d18]/95 backdrop-blur-md text-zinc-300 border-b border-cyan-500/20 font-semibold shadow-sm">
              <tr>
                {/* 勾选列 */}
                <th className="p-3.5 pl-4 sticky left-0 z-30 bg-[#090d18]/95 backdrop-blur-md shadow-[2px_0_8px_rgba(0,0,0,0.5)] w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={handleToggleSelectAll}
                    className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0 cursor-pointer"
                    title="全选/取消全选"
                  />
                </th>
                <th className="p-3.5 sticky left-10 z-30 bg-[#090d18]/95 backdrop-blur-md shadow-[2px_0_8px_rgba(0,0,0,0.5)] min-w-[160px]">
                  投递公司
                </th>
                <th className="p-3.5 min-w-[110px]">
                  <div className="flex items-center gap-1">
                    <span>投递状态</span>
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>
                <th className="p-3.5 min-w-[80px]">优先级</th>
                <th className="p-3.5 min-w-[110px]">投递日期</th>
                <th className="p-3.5 min-w-[120px]">类型与岗位</th>
                <th className="p-3.5 min-w-[90px]">Base地</th>
                <th className="p-3.5 min-w-[200px]">职位名称</th>
                <th className="p-3.5 min-w-[120px]">所属行业</th>
                <th className="p-3.5 min-w-[80px]">官网</th>
                <th className="p-3.5 min-w-[120px]">当前进展</th>
                <th className="p-3.5 min-w-[220px]">复盘与备注</th>
                <th className="p-3.5 pr-4 text-right min-w-[90px] sticky right-0 z-30 bg-[#090d18]/95 backdrop-blur-md shadow-[-2px_0_8px_rgba(0,0,0,0.5)]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((job) => {
                const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.applied
                const applied = isJobApplied(job)
                const isSelected = selectedIds.has(job.id)

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className={`hover:bg-cyan-500/[0.04] transition-colors cursor-pointer group ${
                      isSelected ? 'bg-blue-500/[0.06]' : ''
                    }`}
                  >
                    {/* 勾选框 */}
                    <td
                      className="p-3.5 pl-4 sticky left-0 z-10 bg-[#070a13]/90 group-hover:bg-[#0c1220] transition-colors shadow-[2px_0_8px_rgba(0,0,0,0.4)] text-center"
                      onClick={(e) => handleToggleSelectRow(job.id, e)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* 投递公司 (左侧固定微粘滞) */}
                    <td className="p-3.5 sticky left-10 z-10 bg-[#070a13]/90 group-hover:bg-[#0c1220] transition-colors shadow-[2px_0_8px_rgba(0,0,0,0.4)] font-bold text-white text-sm sm:text-base whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${applied ? 'bg-cyan-400' : 'bg-amber-400'} group-hover:scale-125 transition-transform`} />
                        <span>{job.company}</span>
                      </div>
                    </td>

                    {/* 投递状态 (交互式徽章，点击直接一键切换) */}
                    <td
                      className="p-3.5 whitespace-nowrap"
                      onClick={(e) => handleToggleApplyStatus(job, e)}
                    >
                      <button
                        type="button"
                        title="点击直接切换状态：已投递 ⇄ 未投递"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:scale-105 active:scale-95 ${
                          applied
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${applied ? 'bg-blue-400' : 'bg-amber-400'}`} />
                        <span>{applied ? '已投递' : '未投递'}</span>
                        <ArrowUpDown className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                      </button>
                    </td>

                    {/* 优先级 */}
                    <td className="p-3.5 whitespace-nowrap">
                      {job.priority ? (
                        <span className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                          job.priority === '高'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/25'
                            : job.priority === '中'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/25'
                        }`}>
                          {job.priority}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* 投递日期 */}
                    <td className="p-3.5 font-mono text-zinc-300 text-xs sm:text-sm whitespace-nowrap">
                      {job.applyDate}
                    </td>

                    {/* 类型与岗位 */}
                    <td className="p-3.5 text-zinc-300 text-xs sm:text-sm whitespace-nowrap">
                      {job.category || '-'}
                    </td>

                    {/* base地 */}
                    <td className="p-3.5 text-zinc-200 text-xs sm:text-sm whitespace-nowrap">
                      {job.location || '-'}
                    </td>

                    {/* 职位 */}
                    <td className="p-3.5 font-bold text-white text-sm sm:text-base max-w-[240px] truncate" title={job.role}>
                      {job.role}
                    </td>

                    {/* 行业 */}
                    <td className="p-3.5 text-zinc-300 text-xs sm:text-sm max-w-[150px] truncate" title={job.industry}>
                      {job.industry || '-'}
                    </td>

                    {/* 官网 */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {job.jobUrl ? (
                        <a
                          href={job.jobUrl.startsWith('http') ? job.jobUrl : `https://${job.jobUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          <span>投递官网</span>
                        </a>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* 状态 / 进展 */}
                    <td className="p-3.5 whitespace-nowrap">
                      {(() => {
                        const tags = getJobDisplayTags(job)
                        return (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-semibold border ${tag.color}`}
                              >
                                {tag.text}
                              </span>
                            ))}
                          </div>
                        )
                      })()}
                    </td>

                    {/* 备注 */}
                    <td className="p-3.5 text-zinc-300 max-w-[260px] truncate text-xs sm:text-sm" title={job.notes}>
                      {job.notes || '-'}
                    </td>

                    {/* 操作 (右侧固定微粘滞) */}
                    <td
                      className="p-3.5 pr-4 text-right whitespace-nowrap sticky right-0 z-10 bg-[#070a13]/90 group-hover:bg-[#0c1220] transition-colors shadow-[-2px_0_8px_rgba(0,0,0,0.4)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="p-1.5 text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.08] rounded-lg transition-colors"
                          title="编辑详情"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {onDeleteJob && (
                          <button
                            onClick={() => {
                              if (confirm(`确定删除 ${job.company} 的投递记录吗？`)) {
                                onDeleteJob(job.id)
                              }
                            }}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.08] rounded-lg transition-colors"
                            title="删除记录"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="p-16 text-center text-zinc-400">
                    <p className="text-base font-medium text-zinc-300">暂无匹配的求职记录</p>
                    <p className="text-xs sm:text-sm mt-1.5 text-zinc-500">
                      可切换上方「全部岗位」/「实际已投递」/「未投递/意向储备」标签
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 视窗底部常驻水平滑动控制条 (解决拉到最下面才能右滑的问题) */}
        <div className="px-4 py-2 bg-[#090d18] border-t border-white/[0.08] flex items-center justify-between gap-3 text-xs text-zinc-400 shrink-0 select-none">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-500 font-mono hidden sm:inline">HORIZONTAL SCROLL:</span>
            <span className="text-[11px] text-zinc-400">可直接在此滑动或拖移右看完整标题</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleScrollHorizontally(-220)}
              className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
              title="向左滑移"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="h-1.5 w-24 sm:w-36 bg-black/40 rounded-full overflow-hidden border border-white/[0.08]">
              <div className="h-full bg-white/40 rounded-full w-2/3" />
            </div>
            <button
              onClick={() => handleScrollHorizontally(220)}
              className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white transition-colors"
              title="向右滑移"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
