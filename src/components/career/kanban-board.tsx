'use client'

import { JobApplication, JobStatus } from '@/types'
import {
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface Props {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
  onUpdateStatus: (jobId: string, nextStatus: JobStatus) => void
}

const COLUMNS: { id: JobStatus; title: string; dotColor: string }[] = [
  { id: 'wishlist', title: '意向备战', dotColor: 'bg-zinc-500' },
  { id: 'applied', title: '已投递', dotColor: 'bg-blue-400' },
  { id: 'assessment', title: '笔试 / 测评', dotColor: 'bg-purple-400' },
  { id: 'interview1', title: '技术一面', dotColor: 'bg-amber-400' },
  { id: 'interview2', title: '二面 / 交叉面', dotColor: 'bg-orange-400' },
  { id: 'hr', title: 'HR面 / 谈薪', dotColor: 'bg-pink-400' },
  { id: 'offer', title: '录用 / Offer 🎉', dotColor: 'bg-emerald-400' },
  { id: 'rejected', title: '已归档', dotColor: 'bg-zinc-600' },
]

export function KanbanBoard({ jobs, onSelectJob, onUpdateStatus }: Props) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 select-none min-h-[calc(100vh-240px)]">
      {COLUMNS.map((col) => {
        const colJobs = jobs.filter((j) => j.status === col.id)

        return (
          <div
            key={col.id}
            className="w-72 shrink-0 flex flex-col rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
          >
            {/* 列头 */}
            <div className="px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${col.dotColor}`} />
                <h4 className="font-medium text-xs text-white tracking-tight">{col.title}</h4>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-500">
                {colJobs.length}
              </span>
            </div>

            {/* 卡片列表 */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
              {colJobs.map((job) => {
                const latestInterview = job.interviews?.[job.interviews.length - 1]
                const columnIndex = COLUMNS.findIndex((item) => item.id === col.id)
                const previousColumn = COLUMNS[columnIndex - 1]
                const nextColumn = COLUMNS[columnIndex + 1]

                return (
                  <div
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="p-3.5 rounded-xl linear-card cursor-pointer group relative overflow-hidden space-y-2.5"
                  >
                    {/* 公司与岗位 */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h5 className="font-semibold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {job.company}
                        </h5>
                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                          {job.role}
                        </p>
                      </div>
                      {job.department && (
                        <span className="text-[10px] bg-white/[0.04] px-1.5 py-0.5 rounded text-zinc-400 shrink-0 max-w-[80px] truncate border border-white/[0.05]">
                          {job.department}
                        </span>
                      )}
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
                      <div className="p-2 rounded-lg bg-white/[0.03] text-[11px] border border-white/[0.06]">
                        <div className="flex items-center justify-between text-zinc-300 font-medium mb-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {latestInterview.round}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {latestInterview.date}
                          </span>
                        </div>
                        {latestInterview.questions && latestInterview.questions.length > 0 && (
                          <p className="text-[10px] text-zinc-500 truncate">
                            已录入 {latestInterview.questions.length} 道面试真题
                          </p>
                        )}
                      </div>
                    )}

                    {/* 底部投递日期与快速流转 */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {job.applyDate}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {previousColumn && (
                          <button
                            type="button"
                            title={`移至${previousColumn.title}`}
                            aria-label={`移至${previousColumn.title}`}
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
                            aria-label={`移至${nextColumn.title}`}
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
  )
}
