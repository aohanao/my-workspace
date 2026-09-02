'use client'

import { useState } from 'react'
import { JobApplication, JobStatus } from '@/types'
import { Search, Filter, Download, ExternalLink, MessageSquare, Clock } from 'lucide-react'

interface Props {
  jobs: JobApplication[]
  onSelectJob: (job: JobApplication) => void
}

const STATUS_LABELS: Record<JobStatus, { label: string; badge: string }> = {
  wishlist: { label: '意向备战', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
  applied: { label: '已投递', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  assessment: { label: '笔试/测评', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  interview1: { label: '技术一面', badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  interview2: { label: '技术二面', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  hr: { label: 'HR面', badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  offer: { label: 'Offer 🎉', badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold' },
  rejected: { label: '已归档', badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
}

export function JobTable({ jobs, onSelectJob }: Props) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.company.toLowerCase().includes(search.toLowerCase()) ||
      j.role.toLowerCase().includes(search.toLowerCase()) ||
      (j.location && j.location.toLowerCase().includes(search.toLowerCase())) ||
      (j.notes && j.notes.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const exportCSV = () => {
    const headers = ['公司', '岗位', '部门', '状态', '投递日期', '城市', '薪资', '备注']
    const rows = filtered.map((j) => [
      `"${j.company}"`,
      `"${j.role}"`,
      `"${j.department || ''}"`,
      `"${STATUS_LABELS[j.status]?.label || j.status}"`,
      `"${j.applyDate}"`,
      `"${j.location || ''}"`,
      `"${j.salary || ''}"`,
      `"${(j.notes || '').replace(/"/g, '""')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `秋招投递数据导出-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* 搜索与筛选工具条 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司、岗位、城市、面经考点..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-muted/60 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-muted/60 border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value="all">全部阶段 ({jobs.length})</option>
            <option value="wishlist">意向准备</option>
            <option value="applied">已投递</option>
            <option value="assessment">笔试/测评</option>
            <option value="interview1">技术一面</option>
            <option value="interview2">技术二面</option>
            <option value="hr">HR面</option>
            <option value="offer">已获 Offer</option>
            <option value="rejected">流程终止</option>
          </select>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-xl border border-border transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>
        </div>
      </div>

      {/* 表格容器 */}
      <div className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border font-semibold">
              <tr>
                <th className="p-3.5">公司名称</th>
                <th className="p-3.5">应聘岗位</th>
                <th className="p-3.5">当前状态</th>
                <th className="p-3.5">城市/Base</th>
                <th className="p-3.5">投递日期</th>
                <th className="p-3.5">薪资待遇</th>
                <th className="p-3.5">最新面试/复盘</th>
                <th className="p-3.5 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((job) => {
                const latestInterview = job.interviews?.[job.interviews.length - 1]
                const st = STATUS_LABELS[job.status] || { label: job.status, badge: 'bg-muted text-foreground' }

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5 font-bold text-foreground group-hover:text-primary transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {job.company.substring(0, 1)}
                        </div>
                        <div>
                          <div>{job.company}</div>
                          {job.department && (
                            <div className="text-[10px] text-muted-foreground font-normal">{job.department}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-medium text-foreground">{job.role}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${st.badge}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3.5 text-muted-foreground">{job.location || '-'}</td>
                    <td className="p-3.5 text-muted-foreground font-mono">{job.applyDate}</td>
                    <td className="p-3.5 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {job.salary || '-'}
                    </td>
                    <td className="p-3.5 text-muted-foreground">
                      {latestInterview ? (
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>{latestInterview.round} ({latestInterview.date})</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/60">-</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectJob(job)
                        }}
                        className="px-2.5 py-1 text-xs text-primary font-semibold hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        编辑复盘
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              未找到匹配的求职投递记录
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
