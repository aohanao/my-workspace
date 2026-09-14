'use client'

import { useState } from 'react'
import { JobApplication, JobStatus } from '@/types'
import { normalizeJobStatus, isJobApplied } from '@/lib/feishu-parser'
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Filter,
} from 'lucide-react'

interface Props {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
  onUpdateStatus: (jobId: string, nextStatus: JobStatus) => void
}

const COLUMNS: {
  id: JobStatus
  title: string
  dotColor: string
  headerBg?: string
  borderColor?: string
}[] = [
  { id: 'wishlist', title: '意向备战(未投)', dotColor: 'bg-zinc-500' },
  { id: 'applied', title: '已投待初筛', dotColor: 'bg-blue-400' },
  { id: 'assessment', title: '笔试 / 测评', dotColor: 'bg-purple-400' },
  { id: 'interview1', title: '技术一面', dotColor: 'bg-amber-400' },
  { id: 'interview2', title: '二面 / 交叉面', dotColor: 'bg-orange-400' },
  { id: 'interview3', title: '技术三面', dotColor: 'bg-indigo-400' },
  { id: 'hr', title: 'HR面 / 谈薪', dotColor: 'bg-pink-400' },
  { id: 'offer', title: '录用 / Offer 🎉', dotColor: 'bg-emerald-400' },
  {
    id: 'rejected',
    title: '流程终止 / 挂了 ❌',
    dotColor: 'bg-rose-500',
    headerBg: 'bg-rose-500/[0.05]',
    borderColor: 'border-rose-500/20',
  },
]

export function KanbanBoard({ jobs, onSelectJob, onUpdateStatus }: Props) {
  const [filterMode, setFilterMode] = useState<'all' | 'applied_only' | 'rejected_only' | 'wishlist_only'>('all')

  // 对所有岗位进行严格状态归一化，杜绝漏计或状态错位
  const normalizedJobs = jobs.map((j) => ({
    ...j,
    status: normalizeJobStatus(j.status),
  }))

  const totalJobs = normalizedJobs.length
  const appliedJobs = normalizedJobs.filter((j) => isJobApplied(j))
  const appliedCount = appliedJobs.length
  const wishlistCount = totalJobs - appliedCount

  const screeningCount = normalizedJobs.filter((j) => j.status === 'applied').length
  const assessmentCount = normalizedJobs.filter((j) => j.status === 'assessment').length
  const interviewCount = normalizedJobs.filter((j) => ['interview1', 'interview2', 'interview3', 'hr'].includes(j.status)).length
  const offerCount = normalizedJobs.filter((j) => j.status === 'offer').length
  const rejectedCount = normalizedJobs.filter((j) => j.status === 'rejected').length

  // 校验逻辑：所有列之和必须绝对等于全量岗位数
  const visibleColumns = COLUMNS.filter((col) => {
    if (filterMode === 'all') return true
    if (filterMode === 'applied_only') return col.id !== 'wishlist'
    if (filterMode === 'rejected_only') return col.id === 'rejected'
    if (filterMode === 'wishlist_only') return col.id === 'wishlist'
    return true
  })

  return (
    <div className="space-y-3 select-none">
      {/* 看板全景数据核验与快速筛选横条 */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-[#0d121f] border border-white/[0.08] shadow-sm space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 text-xs">
          {/* 左侧总数核验公式 */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              看板总数：
              <span className="font-mono text-blue-400 font-bold text-sm">{totalJobs}</span>
              <span className="text-zinc-400">家</span>
            </span>
            <span className="text-zinc-600">=</span>
            <span className="text-zinc-300 font-medium">
              实际已投 <span className="font-mono font-bold text-white">{appliedCount}</span> 家
            </span>
            <span className="text-zinc-500 text-[10px] sm:text-[11px]">
              (待筛 <span className="font-mono text-zinc-300">{screeningCount}</span> · 笔试 <span className="font-mono text-purple-300">{assessmentCount}</span> · 面试推进 <span className="font-mono text-amber-300">{interviewCount}</span> · Offer <span className="font-mono text-emerald-300">{offerCount}</span> · <span className="text-rose-400 font-semibold">已挂 {rejectedCount}</span>)
            </span>
            <span className="text-zinc-600">+</span>
            <span className="text-zinc-400">
              意向储备 <span className="font-mono font-semibold text-amber-400">{wishlistCount}</span> 家
            </span>
          </div>

          {/* 右侧快速泳道筛选标签 */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline flex items-center gap-1">
              <Filter className="w-3 h-3" />
              泳道视图:
            </span>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterMode === 'all'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              全部泳道 ({totalJobs})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('applied_only')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterMode === 'applied_only'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              已投流程 ({appliedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('rejected_only')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterMode === 'rejected_only'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-rose-500/10'
              }`}
            >
              已挂/终止 ({rejectedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('wishlist_only')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterMode === 'wishlist_only'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              未投意向 ({wishlistCount})
            </button>
          </div>
        </div>
      </div>

      {/* 看板泳道水平滚动区 */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none min-h-[calc(100vh-280px)]">
        {visibleColumns.map((col) => {
          const colJobs = normalizedJobs.filter((j) => j.status === col.id)
          const isRejectedCol = col.id === 'rejected'

          return (
            <div
              key={col.id}
              className={`w-72 shrink-0 flex flex-col rounded-2xl bg-white/[0.02] border overflow-hidden ${
                col.borderColor || 'border-white/[0.06]'
              }`}
            >
              {/* 列头 */}
              <div
                className={`px-4 py-3 border-b border-white/[0.06] flex items-center justify-between ${
                  col.headerBg || 'bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h4
                    className={`font-semibold text-xs tracking-tight ${
                      isRejectedCol ? 'text-rose-300' : 'text-white'
                    }`}
                  >
                    {col.title}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      isRejectedCol
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-white/[0.04] text-zinc-300'
                    }`}
                  >
                    {colJobs.length}
                  </span>
                </div>
              </div>

              {/* 卡片列表 */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-340px)]">
                {colJobs.map((job) => {
                  const latestInterview = job.interviews?.[job.interviews.length - 1]
                  const columnIndex = COLUMNS.findIndex((item) => item.id === col.id)
                  const previousColumn = COLUMNS[columnIndex - 1]
                  const nextColumn = COLUMNS[columnIndex + 1]

                  return (
                    <div
                      key={job.id}
                      onClick={() => onSelectJob(job)}
                      className={`p-3.5 rounded-xl cursor-pointer group relative overflow-hidden space-y-2.5 transition-all border ${
                        isRejectedCol
                          ? 'bg-[#181116]/80 border-rose-500/25 hover:border-rose-500/50'
                          : 'linear-card hover:border-blue-500/40'
                      }`}
                    >
                      {/* 公司与岗位 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h5
                            className={`font-semibold text-sm transition-colors truncate ${
                              isRejectedCol
                                ? 'text-zinc-200 group-hover:text-rose-300'
                                : 'text-white group-hover:text-blue-400'
                            }`}
                            title={job.company}
                          >
                            {job.company}
                          </h5>
                          <p className="text-xs text-zinc-400 truncate mt-0.5" title={job.role}>
                            {job.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {isRejectedCol && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 whitespace-nowrap">
                              已挂
                            </span>
                          )}
                          {job.priority && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium border whitespace-nowrap ${
                                job.priority === '高'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : job.priority === '中'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                  : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                              }`}
                            >
                              {job.priority}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 城市与薪资 */}
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                        {job.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-zinc-500" />
                            {job.location}
                          </span>
                        )}
                        {job.salary && (
                          <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium truncate">
                            <DollarSign className="w-3 h-3" />
                            {job.salary}
                          </span>
                        )}
                      </div>

                      {/* 面试/复盘提示 */}
                      {latestInterview && (
                        <div
                          className={`p-2 rounded-lg text-[11px] border ${
                            isRejectedCol
                              ? 'bg-rose-500/[0.04] border-rose-500/15 text-rose-200/80'
                              : 'bg-white/[0.03] border-white/[0.06] text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-medium mb-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className={`w-3 h-3 ${isRejectedCol ? 'text-rose-400' : 'text-amber-400'}`} />
                              {latestInterview.round}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">{latestInterview.date}</span>
                          </div>
                          {latestInterview.questions && latestInterview.questions.length > 0 && (
                            <p className="text-[10px] text-zinc-500 truncate">
                              已录入 {latestInterview.questions.length} 道面试真题
                            </p>
                          )}
                        </div>
                      )}

                      {/* 备注中若有挂了信息直接呈现 */}
                      {job.notes && (
                        <p className="text-[10px] text-zinc-400 line-clamp-1 italic">
                          {job.notes}
                        </p>
                      )}

                      {/* 底部操作区：投递日期与快速流转按钮 */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {job.applyDate}
                        </span>

                        {/* 快捷操作按钮组 */}
                        <div className="flex items-center gap-1">
                          {/* 如果已挂，提供快速恢复至已投递按钮 */}
                          {isRejectedCol ? (
                            <button
                              type="button"
                              title="移回流程中（恢复为已投递初筛）"
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateStatus(job.id, 'applied')
                              }}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08]"
                            >
                              <RotateCcw className="w-3 h-3 text-blue-400" />
                              <span>恢复</span>
                            </button>
                          ) : (
                            /* 如果未挂，提供一键标记为已挂/终止按钮 */
                            <button
                              type="button"
                              title="一键标记为流程终止 / 已挂"
                              onClick={(e) => {
                                e.stopPropagation()
                                onUpdateStatus(job.id, 'rejected')
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/15"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 前后列微调切换 */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {previousColumn && (
                              <button
                                type="button"
                                title={`移至${previousColumn.title}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onUpdateStatus(job.id, previousColumn.id)
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {nextColumn && (
                              <button
                                type="button"
                                title={`移至${nextColumn.title}`}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onUpdateStatus(job.id, nextColumn.id)
                                }}
                                className="p-1 rounded text-blue-400 hover:text-white hover:bg-blue-500/20"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {colJobs.length === 0 && (
                  <div className="h-20 border border-dashed border-white/[0.06] rounded-xl flex items-center justify-center text-xs text-zinc-600">
                    暂无记录
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
