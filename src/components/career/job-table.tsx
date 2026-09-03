'use client'

import { useState, useRef } from 'react'
import { JobApplication, JobStatus } from '@/types'
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
} from 'lucide-react'

interface Props {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
  onDeleteJob?: (id: string) => void
}

const STATUS_LABELS: Record<JobStatus, { label: string; badge: string }> = {
  wishlist: { label: '意向准备', badge: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  applied: { label: '已投递', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  assessment: { label: '笔试/测评', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  interview1: { label: '技术一面', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  interview2: { label: '技术二面', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  hr: { label: 'HR面/谈薪', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  offer: { label: '已获 Offer 🎉', badge: 'bg-emerald-500/15 text-emerald-400 font-bold border-emerald-500/30' },
  rejected: { label: '流程终止', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
}

export function JobTable({ jobs, onSelectJob, onDeleteJob }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  const filtered = jobs.filter((j) => {
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
    const headers = ['投递公司', '优先级', '投递日期', '投递状态', '类型与岗位', 'base地', '职位', '行业', '官网', '当前阶段', '备注']
    const rows = filtered.map((j) => [
      `"${j.company}"`,
      `"${j.priority || ''}"`,
      `"${j.applyDate}"`,
      `"${j.applyStatus || '已投递'}"`,
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
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-3 sm:inset-6 z-50 bg-[#070a12]/95 backdrop-blur-2xl p-4 sm:p-6 rounded-3xl border border-cyan-500/30 shadow-2xl flex flex-col' : ''}`}>
      {/* 搜索与多维筛选工具条 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl linear-card shrink-0">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司、职位、Base地、行业、备注..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* 优先级筛选 */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs sm:text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/60"
          >
            <option value="all" className="bg-[#10131d]">全部优先级</option>
            <option value="高" className="bg-[#10131d]">高优先级</option>
            <option value="中" className="bg-[#10131d]">中优先级</option>
            <option value="低" className="bg-[#10131d]">低优先级</option>
          </select>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs sm:text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500/60 font-medium"
          >
            <option value="all" className="bg-[#10131d]">全部状态 ({jobs.length})</option>
            <option value="wishlist" className="bg-[#10131d]">意向准备</option>
            <option value="applied" className="bg-[#10131d]">已投递</option>
            <option value="assessment" className="bg-[#10131d]">笔试/测评</option>
            <option value="interview1" className="bg-[#10131d]">技术一面</option>
            <option value="interview2" className="bg-[#10131d]">技术二面</option>
            <option value="hr" className="bg-[#10131d]">HR面/终面</option>
            <option value="offer" className="bg-[#10131d]">已获 Offer</option>
            <option value="rejected" className="bg-[#10131d]">流程终止</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 rounded-xl border border-white/[0.08] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>
        </div>
      </div>

      {/* ===================== 二级终端视窗 (Sub-Window Terminal) ===================== */}
      <div className={`sub-window-terminal rounded-2xl overflow-hidden flex flex-col relative transition-all border border-cyan-500/20 ${isFullscreen ? 'flex-1 min-h-0' : 'h-[580px]'}`}>
        {/* 视窗标题栏与控制台 (Sub-window Header) */}
        <div className="px-4 py-2.5 bg-[#0a0d18]/90 border-b border-white/[0.08] flex items-center justify-between gap-3 shrink-0 select-none">
          <div className="flex items-center gap-3">
            {/* 拟物终端小红绿点 */}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block shadow-[0_0_6px_rgba(244,63,94,0.4)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            </div>

            <div className="flex items-center gap-2">
              <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs sm:text-sm font-semibold text-white tracking-tight font-mono">
                [ 投递清单二级视窗 // JOB_PIPELINE_CONSOLE ]
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/25">
                已展示 {filtered.length} / 共 {jobs.length} 岗位
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* 横向视口快速跳移 */}
            <button
              onClick={() => handleScrollToEdge('left')}
              title="滑动到最左侧首列"
              className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">首列</span>
            </button>
            <button
              onClick={() => handleScrollToEdge('right')}
              title="滑动到最右侧流程与操作"
              className="px-2.5 py-1 rounded-lg text-xs text-cyan-400 hover:text-cyan-200 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition-colors flex items-center gap-1"
            >
              <span className="hidden sm:inline">右滑看全标题</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* 展开全屏视窗 / 还原窗口 */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? '还原窗口' : '全屏展开二级视窗'}
              className="p-1.5 rounded-lg text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition-colors ml-1"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          </div>
        </div>

        {/* 视窗内部双轴滚动区域 (Header Sticky, Body Scrollable) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative divide-y divide-white/[0.05]"
        >
          <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[1100px]">
            {/* 表头固定在二级窗口顶部 */}
            <thead className="sticky top-0 z-20 bg-[#090d18]/95 backdrop-blur-md text-zinc-300 border-b border-cyan-500/20 font-semibold shadow-sm">
              <tr>
                <th className="p-3.5 pl-4 sticky left-0 z-30 bg-[#090d18]/95 backdrop-blur-md shadow-[2px_0_8px_rgba(0,0,0,0.5)] min-w-[160px]">
                  投递公司
                </th>
                <th className="p-3.5 min-w-[80px]">优先级</th>
                <th className="p-3.5 min-w-[110px]">投递日期</th>
                <th className="p-3.5 min-w-[90px]">投递状态</th>
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

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-cyan-500/[0.04] transition-colors cursor-pointer group"
                  >
                    {/* 投递公司 (左侧固定微粘滞) */}
                    <td className="p-3.5 pl-4 font-bold text-white text-sm sm:text-base whitespace-nowrap sticky left-0 z-10 bg-[#070a13]/90 group-hover:bg-[#0c1220] transition-colors shadow-[2px_0_8px_rgba(0,0,0,0.4)]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover:scale-125 transition-transform" />
                        <span>{job.company}</span>
                      </div>
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
                    <td className="p-3.5 font-mono text-zinc-300 whitespace-nowrap">
                      {job.applyDate}
                    </td>

                    {/* 投递状态 */}
                    <td className="p-3.5 text-zinc-200 whitespace-nowrap">
                      {job.applyStatus || '已投递'}
                    </td>

                    {/* 类型与岗位 */}
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                      {job.category || '-'}
                    </td>

                    {/* base地 */}
                    <td className="p-3.5 text-zinc-200 whitespace-nowrap">
                      {job.location || '-'}
                    </td>

                    {/* 职位 */}
                    <td className="p-3.5 font-medium text-white max-w-[220px] truncate" title={job.role}>
                      {job.role}
                    </td>

                    {/* 行业 */}
                    <td className="p-3.5 text-zinc-400 max-w-[140px] truncate" title={job.industry}>
                      {job.industry || '-'}
                    </td>

                    {/* 官网 */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {job.jobUrl ? (
                        <a
                          href={job.jobUrl.startsWith('http') ? job.jobUrl : `https://${job.jobUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>投递官网</span>
                        </a>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* 状态 / 进展 */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* 备注 */}
                    <td className="p-3.5 text-zinc-400 max-w-[240px] truncate text-xs sm:text-sm" title={job.notes}>
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
                  <td colSpan={12} className="p-16 text-center text-zinc-400">
                    <p className="text-base font-medium text-zinc-300">暂无匹配的求职记录</p>
                    <p className="text-xs sm:text-sm mt-1.5 text-zinc-500">
                      点击右上角「飞书表格导入」批量导入，或点击「新增投递」创建第一条记录
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
              <div className="h-full bg-cyan-500/60 rounded-full w-2/3" />
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
