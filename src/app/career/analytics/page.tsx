'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  TrendingUp,
  Award,
  PieChart as PieIcon,
  MapPin,
  Building2,
  ArrowLeft,
  Sparkles,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { JobApplication } from '@/types'
import { StorageService } from '@/lib/storage'

const PALETTE = ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#64748b', '#ef4444']

export default function CareerAnalyticsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])

  const loadData = () => {
    setJobs(StorageService.getJobs())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('workspace-data-updated', handleUpdate)
    return () => window.removeEventListener('workspace-data-updated', handleUpdate)
  }, [])

  const totalApplied = jobs.length
  const passScreening = jobs.filter((j) => j.status !== 'applied' && j.status !== 'wishlist').length
  const reachedInterview = jobs.filter((j) => ['interview1', 'interview2', 'hr', 'offer'].includes(j.status)).length
  const reachedFinal = jobs.filter((j) => ['interview2', 'hr', 'offer'].includes(j.status)).length
  const offers = jobs.filter((j) => j.status === 'offer').length

  const funnelData = [
    { stage: '总投递企业', count: totalApplied, rate: '100%', fill: '#3b82f6' },
    { stage: '初筛/笔试通过', count: passScreening, rate: totalApplied ? `${Math.round((passScreening / totalApplied) * 100)}%` : '0%', fill: '#8b5cf6' },
    { stage: '技术面试阶段', count: reachedInterview, rate: totalApplied ? `${Math.round((reachedInterview / totalApplied) * 100)}%` : '0%', fill: '#f59e0b' },
    { stage: '终面 / HR面', count: reachedFinal, rate: totalApplied ? `${Math.round((reachedFinal / totalApplied) * 100)}%` : '0%', fill: '#ec4899' },
    { stage: '录用 / Offer', count: offers, rate: totalApplied ? `${Math.round((offers / totalApplied) * 100)}%` : '0%', fill: '#10b981' },
  ]

  const statusCounts: Record<string, { label: string; count: number }> = {
    wishlist: { label: '意向备战', count: 0 },
    applied: { label: '已投初筛', count: 0 },
    assessment: { label: '笔试测评', count: 0 },
    interview1: { label: '技术一面', count: 0 },
    interview2: { label: '二面/终面', count: 0 },
    hr: { label: 'HR面', count: 0 },
    offer: { label: 'Offer', count: 0 },
    rejected: { label: '已归档', count: 0 },
  }

  jobs.forEach((j) => {
    if (statusCounts[j.status]) {
      statusCounts[j.status].count++
    }
  })

  const statusPieData = Object.values(statusCounts).filter((item) => item.count > 0)

  const cityMap: Record<string, number> = {}
  jobs.forEach((j) => {
    const city = j.location || '其他/未填'
    cityMap[city] = (cityMap[city] || 0) + 1
  })
  const cityData = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const totalQuestionsCount = jobs.reduce((acc, job) => {
    return acc + (job.interviews?.reduce((qAcc, iv) => qAcc + (iv.questions?.length || 0), 0) || 0)
  }, 0)

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部导航与操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/career"
            className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart3 className="w-4 sm:w-5 h-4 sm:h-5" />
              </div>
              <span>秋招求职量化大屏</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5">
              多维度投递转化率 · 城市分布 · 核心企业推进矩阵
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] bg-emerald-500/10 text-emerald-400 font-medium px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            数据实时统计
          </span>
        </div>
      </div>

      {/* 核心指标统计横幅 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="linear-card p-3.5 sm:p-5 rounded-2xl">
          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-400" />
            累计投递企业
          </p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalApplied}</span>
            <span className="text-xs text-zinc-500">家</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-blue-400 mt-1.5 sm:mt-2">覆盖核心梯队</p>
        </div>

        <div className="linear-card p-3.5 sm:p-5 rounded-2xl">
          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            约面转化率
          </p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {totalApplied ? Math.round((reachedInterview / totalApplied) * 100) : 0}%
            </span>
            <span className="text-xs text-zinc-500">优秀</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1.5 sm:mt-2">行业均值 ~25%</p>
        </div>

        <div className="linear-card p-3.5 sm:p-5 rounded-2xl">
          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Award className="w-4 h-4 text-emerald-400" />
            斩获 Offer
          </p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">{offers}</span>
            <span className="text-xs text-zinc-500">份</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-400 mt-1.5 sm:mt-2">包含核心意向</p>
        </div>

        <div className="linear-card p-3.5 sm:p-5 rounded-2xl">
          <p className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            沉淀考点真题
          </p>
          <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-indigo-400">{totalQuestionsCount}</span>
            <span className="text-xs text-zinc-500">道</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-indigo-400 mt-1.5 sm:mt-2">专属面经复盘库</p>
        </div>
      </div>

      {/* 主图表区：漏斗与状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 投递转化漏斗柱状图 */}
        <div className="lg:col-span-2 linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 border-b border-white/[0.06] pb-3">
              <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                秋招全流程漏斗转化分析
              </h3>
              <span className="text-xs text-zinc-500">转化率统计</span>
            </div>
            <p className="text-xs text-zinc-400 mb-4 sm:mb-6">
              量化各环节通过与流失情况，帮助精准定位复盘攻坚方向。
            </p>
          </div>

          <div className="space-y-3.5 sm:space-y-4 my-2">
            {funnelData.map((item, idx) => (
              <div key={idx} className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300 font-medium">{item.stage}</span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-zinc-400 font-mono">{item.count} 家</span>
                    <span className="px-2 py-0.5 rounded text-[11px] bg-white/[0.04] font-semibold text-white border border-white/[0.06]">
                      {item.rate}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, (item.count / (totalApplied || 1)) * 100)}%`,
                      backgroundColor: item.fill,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs text-zinc-400 flex-wrap gap-2">
            <span className="text-[11px]">💡 建议：终面阶段重点复盘系统架构与业务深度</span>
            <span className="font-mono text-blue-400 font-medium text-xs">总转化率: {totalApplied ? Math.round((offers / totalApplied) * 100) : 0}%</span>
          </div>
        </div>

        {/* 阶段分布饼图 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-2">
              <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-purple-400" />
                当前流程状态占比
              </h3>
            </div>
            <p className="text-xs text-zinc-400">各阶段实时比例</p>
          </div>

          <div className="h-48 sm:h-56 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#12151f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-white/[0.06]">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-400 text-[11px]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PALETTE[idx % PALETTE.length] }} />
                <span className="truncate">{item.label}:</span>
                <span className="font-mono font-semibold text-white">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 次级图表区：城市分布与重点企业推进 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* 城市分布柱状图 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between mb-2 border-b border-white/[0.06] pb-3">
            <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              工作地点 / Base 分布
            </h3>
            <span className="text-xs text-zinc-500">意向城市</span>
          </div>

          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="city" fontSize={11} stroke="#71717a" />
                <YAxis allowDecimals={false} fontSize={11} stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#12151f', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="count" name="投递数" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 重点企业推进列表 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 border-b border-white/[0.06] pb-3">
              <h3 className="font-semibold text-xs sm:text-sm text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                重点大厂攻坚矩阵
              </h3>
              <span className="text-xs text-zinc-500">核心意向</span>
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-56 pr-1">
            {jobs.slice(0, 5).map((job) => (
              <div
                key={job.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 font-bold flex items-center justify-center text-xs border border-blue-500/20 shrink-0">
                    {job.company.substring(0, 1)}
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-xs text-white truncate">{job.company}</h5>
                    <p className="text-[11px] text-zinc-400 truncate">{job.role} · {job.location || '全国'}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {job.status}
                  </span>
                  {job.salary && (
                    <p className="text-[11px] text-emerald-400 mt-1 font-mono font-medium">
                      {job.salary}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-500">
                暂无投递数据
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
