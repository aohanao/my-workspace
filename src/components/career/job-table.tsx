'use client'

import { useState } from 'react'
import { JobApplication, JobStatus } from '@/types'
import { Search, Download, ExternalLink, Edit3, Trash2, Globe } from 'lucide-react'

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
    <div className="space-y-4">
      {/* 搜索与多维筛选工具条 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl linear-card">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索公司、职位、类型、Base地、行业、备注..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {/* 优先级筛选 */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none"
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
            className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none font-medium"
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
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 rounded-xl border border-white/[0.08] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>导出 CSV</span>
          </button>
        </div>
      </div>

      {/* 完整对齐飞书表头的表格容器 */}
      <div className="border border-white/[0.08] rounded-2xl overflow-hidden linear-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="bg-white/[0.03] text-zinc-400 border-b border-white/[0.08] font-semibold text-[11px]">
              <tr>
                <th className="p-3.5 pl-4">投递公司</th>
                <th className="p-3.5">优先级</th>
                <th className="p-3.5">投递日期</th>
                <th className="p-3.5">投递状态</th>
                <th className="p-3.5">类型与岗位</th>
                <th className="p-3.5">base地</th>
                <th className="p-3.5">职位</th>
                <th className="p-3.5">行业</th>
                <th className="p-3.5">官网</th>
                <th className="p-3.5">状态/进展</th>
                <th className="p-3.5">备注</th>
                <th className="p-3.5 pr-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {filtered.map((job) => {
                const statusMeta = STATUS_LABELS[job.status] || STATUS_LABELS.applied

                return (
                  <tr
                    key={job.id}
                    onClick={() => onSelectJob(job)}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* 投递公司 */}
                    <td className="p-3.5 pl-4 font-semibold text-white whitespace-nowrap">
                      {job.company}
                    </td>

                    {/* 优先级 */}
                    <td className="p-3.5 whitespace-nowrap">
                      {job.priority ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium border ${
                          job.priority === '高'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : job.priority === '中'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                          {job.priority}
                        </span>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* 投递日期 */}
                    <td className="p-3.5 font-mono text-zinc-400 whitespace-nowrap">
                      {job.applyDate}
                    </td>

                    {/* 投递状态 */}
                    <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                      {job.applyStatus || '已投递'}
                    </td>

                    {/* 类型与岗位 */}
                    <td className="p-3.5 text-zinc-400 whitespace-nowrap">
                      {job.category || '-'}
                    </td>

                    {/* base地 */}
                    <td className="p-3.5 text-zinc-300 whitespace-nowrap">
                      {job.location || '-'}
                    </td>

                    {/* 职位 */}
                    <td className="p-3.5 font-medium text-white max-w-[180px] truncate" title={job.role}>
                      {job.role}
                    </td>

                    {/* 行业 */}
                    <td className="p-3.5 text-zinc-400 max-w-[120px] truncate" title={job.industry}>
                      {job.industry || '-'}
                    </td>

                    {/* 官网 */}
                    <td className="p-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {job.jobUrl ? (
                        <a
                          href={job.jobUrl.startsWith('http') ? job.jobUrl : `https://${job.jobUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          <span>访问</span>
                        </a>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>

                    {/* 状态 / 进展 */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusMeta.badge}`}>
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* 备注 */}
                    <td className="p-3.5 text-zinc-400 max-w-[180px] truncate text-[11px]" title={job.notes}>
                      {job.notes || '-'}
                    </td>

                    {/* 操作 */}
                    <td className="p-3.5 pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectJob(job)}
                          className="p-1 text-zinc-400 hover:text-white hover:bg-white/[0.08] rounded-lg transition-colors"
                          title="编辑详情"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteJob && (
                          <button
                            onClick={() => {
                              if (confirm(`确定删除 ${job.company} 的投递记录吗？`)) {
                                onDeleteJob(job.id)
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.08] rounded-lg transition-colors"
                            title="删除记录"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-12 text-center text-zinc-500">
                    <p className="text-sm">暂无投递记录</p>
                    <p className="text-xs mt-1 text-zinc-600">
                      点击右上角「飞书表格导入」一键导入您的求职表格，或点击「新增投递」
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
