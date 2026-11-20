'use client'

import { useState, useEffect } from 'react'
import { useReducedMotion } from 'framer-motion'
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
import { JobApplication, JobStatus } from '@/types'
import { StorageService } from '@/lib/storage'
import { isJobApplied, hasReachedStage } from '@/lib/feishu-parser'
import { InterviewConversionModal } from '@/components/career/interview-conversion-modal'
import { CAREER_STAGE_COLORS, getCareerStageBadge as getJobStageBadge } from '@/lib/career-theme'
import '../career-theme.css'

export default function CareerAnalyticsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([])
  const [funnelView, setFunnelView] = useState<'overview' | 'rounds'>('overview')
  const [isConversionModalOpen, setIsConversionModalOpen] = useState(false)
  const reducedMotion = useReducedMotion()

  const loadData = () => {
    setJobs(StorageService.getJobs())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('workspace-data-updated', handleUpdate)
    return () => window.removeEventListener('workspace-data-updated', handleUpdate)
  }, [])

  // 严格区分实际已投递与未投递
  const appliedJobs = jobs.filter((j) => isJobApplied(j))
  const notAppliedJobs = jobs.filter((j) => !isJobApplied(j))
  const totalApplied = appliedJobs.length
  const notAppliedCount = notAppliedJobs.length

  const passScreening = jobs.filter(
    (j) => hasReachedStage(j, 'assessment') || hasReachedStage(j, 'round1')
  ).length

  // 各轮技术面试到达（严格包含到达过该轮次但后续流程终止/已挂的企业）
  const round1Jobs = jobs.filter((j) => hasReachedStage(j, 'round1'))
  const round2Jobs = jobs.filter((j) => hasReachedStage(j, 'round2'))
  const round3Jobs = jobs.filter((j) => hasReachedStage(j, 'round3'))
  const reachedFinal = jobs.filter((j) => hasReachedStage(j, 'hr'))
  const offers = jobs.filter((j) => hasReachedStage(j, 'offer')).length

  const rateOverview = totalApplied ? Math.round((round1Jobs.length / totalApplied) * 100) : 0
  const rate1 = totalApplied ? Math.round((round1Jobs.length / totalApplied) * 100) : 0
  const rate2 = totalApplied ? Math.round((round2Jobs.length / totalApplied) * 100) : 0
  const rate3 = totalApplied ? Math.round((round3Jobs.length / totalApplied) * 100) : 0

  const passRate1to2 = round1Jobs.length > 0 ? Math.round((round2Jobs.length / round1Jobs.length) * 100) : 0
  const passRate2to3 = round2Jobs.length > 0 ? Math.round((round3Jobs.length / round2Jobs.length) * 100) : 0

  interface FunnelItem {
    stage: string
    count: number
    rate: string
    detail?: string
    fill: string
  }

  // 1. 全流程主漏斗
  const overviewFunnelData: FunnelItem[] = [
    { stage: '实际已投递', count: totalApplied, rate: '100%', fill: CAREER_STAGE_COLORS.applied },
    { stage: '初筛/笔试通过', count: passScreening, rate: totalApplied ? `${Math.round((passScreening / totalApplied) * 100)}%` : '0%', fill: CAREER_STAGE_COLORS.assessment },
    { stage: '进入技术面试', count: round1Jobs.length, rate: totalApplied ? `${rate1}%` : '0%', fill: CAREER_STAGE_COLORS.interview1 },
    { stage: '终面 / HR面', count: reachedFinal.length, rate: totalApplied ? `${Math.round((reachedFinal.length / totalApplied) * 100)}%` : '0%', fill: CAREER_STAGE_COLORS.hr },
    { stage: '斩获录用 / Offer', count: offers, rate: totalApplied ? `${Math.round((offers / totalApplied) * 100)}%` : '0%', fill: CAREER_STAGE_COLORS.offer },
  ]

  // 2. 技术面试各轮次细分漏斗 (一面 -> 二面 -> 三面 -> 录用)
  const roundsFunnelData: FunnelItem[] = [
    { stage: '实际已投递企业', count: totalApplied, rate: '100%', detail: '基数', fill: CAREER_STAGE_COLORS.applied },
    { stage: '技术一面到达', count: round1Jobs.length, rate: `${rate1}%`, detail: `占投递 ${rate1}%`, fill: CAREER_STAGE_COLORS.interview1 },
    { stage: '技术二面到达', count: round2Jobs.length, rate: `${rate2}%`, detail: `一面通过率 ${passRate1to2}%`, fill: CAREER_STAGE_COLORS.interview2 },
    { stage: '技术三面到达', count: round3Jobs.length, rate: `${rate3}%`, detail: `二面通过率 ${passRate2to3}%`, fill: CAREER_STAGE_COLORS.interview3 },
    { stage: '斩获录用 / Offer', count: offers, rate: totalApplied ? `${Math.round((offers / totalApplied) * 100)}%` : '0%', detail: '录用', fill: CAREER_STAGE_COLORS.offer },
  ]

  const statusCounts: Record<string, { label: string; count: number }> = {
    wishlist: { label: '意向储备(未投)', count: 0 },
    applied: { label: '已投初筛', count: 0 },
    assessment: { label: '笔试测评', count: 0 },
    interview1: { label: '技术一面', count: 0 },
    interview2: { label: '技术二面', count: 0 },
    interview3: { label: '技术三面', count: 0 },
    hr: { label: 'HR面/终面', count: 0 },
    offer: { label: 'Offer', count: 0 },
    rejected: { label: '流程终止', count: 0 },
  }

  jobs.forEach((j) => {
    if (statusCounts[j.status]) {
      statusCounts[j.status].count++
    }
  })

  const statusPieData = Object.entries(statusCounts)
    .map(([status, item]) => ({ ...item, fill: CAREER_STAGE_COLORS[status as JobStatus] }))
    .filter((item) => item.count > 0)

  const cityMap: Record<string, number> = {}
  jobs.forEach((j) => {
    const rawCity = (j.location || '').trim()
    // 排除未填、空值、其他等非实际城市
    if (!rawCity || rawCity === '未填' || rawCity === '其他' || rawCity === '其他/未填' || rawCity === '待定' || rawCity === '全国') {
      return
    }
    cityMap[rawCity] = (cityMap[rawCity] || 0) + 1
  })
  const cityData = Object.entries(cityMap)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const totalQuestionsCount = jobs.reduce((acc, job) => {
    return acc + (job.interviews?.reduce((qAcc, iv) => qAcc + (iv.questions?.length || 0), 0) || 0)
  }, 0)

  // 重点大厂关键词表（覆盖主流互联网大厂、硬科技与知名企业）
  const TOP_TECH_COMPANIES = [
    '腾讯', '阿里', '淘宝', '天猫', '蚂蚁', '字节', '抖音', 'tiktok', '美团', '快手',
    '百度', '华为', '海思', '网易', '拼多多', 'pdd', '京东', '小红书', '米哈游', 'mihoyo',
    '滴滴', 'b站', '哔哩哔哩', 'bilibili', '微众', '大疆', 'dji', 'oppo', 'vivo', '小米',
    '中兴', '荣耀', '深信服', '顺丰', '平安', '招商', '招银', 'shopee', 'shein', '希音',
    '微软', 'microsoft', 'google', 'apple', '特斯拉', 'tesla', '英伟达', 'nvidia', 'intel', 'amd'
  ]

  // 计算重点大厂攻坚列表：排除已挂/终止企业，深圳 Base 优先，大厂优先，且优先展示深入流程的企业
  const focusJobs = [...jobs]
    .filter((job) => {
      // 核心：已挂或流程终止的企业不再参与“攻坚”矩阵
      if (job.status === 'rejected') return false
      const badge = getJobStageBadge(job)
      if (badge.isRejected) return false
      return true
    })
    .map((job) => {
      const compLower = (job.company || '').toLowerCase()
      const locLower = (job.location || '').toLowerCase()

      // 是否匹配知名大厂
      const isTopTier = TOP_TECH_COMPANIES.some((k) => compLower.includes(k.toLowerCase()))
      // 是否在深圳
      const isShenzhen = locLower.includes('深圳') || locLower.includes('shenzhen')

      // 阶段权重（流程越深权重越高：Offer > HR面 > 三面 > 二面 > 一面 > 笔试 > 初筛 > 意向）
      let stageScore = 0
      if (hasReachedStage(job, 'offer')) stageScore = 80
      else if (hasReachedStage(job, 'hr')) stageScore = 70
      else if (hasReachedStage(job, 'round3')) stageScore = 60
      else if (hasReachedStage(job, 'round2')) stageScore = 50
      else if (hasReachedStage(job, 'round1')) stageScore = 40
      else if (hasReachedStage(job, 'assessment')) stageScore = 30
      else if (isJobApplied(job)) stageScore = 20
      else stageScore = 10

      // 综合评分计算：深圳大厂 > 深圳其他 > 非深圳大厂 > 其他
      let priorityScore = stageScore
      if (isTopTier) priorityScore += 1000
      if (isShenzhen) priorityScore += 2000 // 深圳 base 优先加权最高

      return {
        job,
        isTopTier,
        isShenzhen,
        priorityScore,
      }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .map((item) => item.job)

  return (
    <div className="career-theme space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部导航与操作 */}
      <div className="career-hero flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/career"
            className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-zinc-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <p className="career-eyebrow">CAREER WORKSPACE / ANALYTICS</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5 sm:gap-3">
              <div className="career-hero-icon p-2 sm:p-2.5 rounded-2xl border">
                <BarChart3 className="w-5 sm:w-6 h-5 sm:h-6" />
              </div>
              <span>秋招求职量化大屏</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              多维度投递转化率 · 城市分布 · 核心企业推进矩阵
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs bg-emerald-300/10 text-emerald-300 font-semibold px-3 py-1 rounded-full flex items-center gap-1.5 border border-emerald-300/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
            数据实时统计
          </span>
        </div>
      </div>

      {/* 核心指标统计横幅 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
        {/* 实际已投递企业 */}
        <div className="career-metric linear-card p-3.5 sm:p-4 rounded-2xl">
          <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-cyan-300" />
            实际已投递
          </p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-white">{totalApplied}</span>
            <span className="text-xs text-zinc-400">家</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1.5">
            储备未投 <span className="font-mono font-semibold text-amber-300">{notAppliedCount}</span> 家 (共{jobs.length}家)
          </p>
        </div>

        {/* 技术一面转化率 (点击弹窗查看多轮面试全景漏斗) */}
        <div
          data-tone="amber"
          role="button"
          tabIndex={0}
          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setIsConversionModalOpen(true) } }}
          onClick={() => setIsConversionModalOpen(true)}
          className="career-metric linear-card p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all group select-none"
          title="点击弹窗查看一面、二面、三面、终面各阶段全景转化率与企业明细"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="shrink-0 text-xs text-zinc-300 font-medium flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>技术一面转化率</span>
            </p>
            <span className="shrink-0 whitespace-nowrap text-[10px] px-1.5 py-0.5 rounded bg-amber-300/10 text-amber-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              明细 ↗
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">{rate1}%</span>
            <span className="text-xs text-zinc-400">({round1Jobs.length}家)</span>
          </div>
          <p className="flex flex-wrap gap-x-1.5 gap-y-1 text-xs text-zinc-400 mt-1.5 group-hover:text-amber-300/90 transition-colors">
            <span>占已投递 {rate1}%</span><span>· 点击查看转化率</span>
          </p>
        </div>

        {/* 斩获 Offer */}
        <div data-tone="mint" className="career-metric linear-card p-3.5 sm:p-4 rounded-2xl">
          <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-300" />
            斩获 Offer
          </p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-300">{offers}</span>
            <span className="text-xs text-zinc-400">份</span>
          </div>
          <p className="text-xs text-emerald-300 mt-1.5 font-medium">
            全投递录用率 {totalApplied ? Math.round((offers / totalApplied) * 100) : 0}%
          </p>
        </div>

        {/* 沉淀考点真题 */}
        <div data-tone="violet" className="career-metric linear-card p-3.5 sm:p-4 rounded-2xl">
          <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-300" />
            沉淀考点真题
          </p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-violet-300">{totalQuestionsCount}</span>
            <span className="text-xs text-zinc-400">道</span>
          </div>
          <p className="text-xs text-violet-300 mt-1.5 font-medium">专属面经复盘考点库</p>
        </div>
      </div>

      {/* 主图表区：漏斗与状态分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* 投递转化漏斗柱状图 */}
        <div className="lg:col-span-2 linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 border-b border-white/[0.06] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <TrendingUp className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-300" />
                <span>秋招全流程漏斗转化分析</span>
              </h3>

              {/* 漏斗视图切换：全流程 vs 技术面试多轮细分 */}
              <div className="career-tabs flex items-center gap-1.5 p-1 rounded-xl border">
                <button
                  onClick={() => setFunnelView('overview')}
                  aria-pressed={funnelView === 'overview'}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    funnelView === 'overview'
                      ? 'career-tab-active font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  主流程总览
                </button>
                <button
                  onClick={() => setFunnelView('rounds')}
                  aria-pressed={funnelView === 'rounds'}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    funnelView === 'rounds'
                      ? 'career-tab-active font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  一面/二面/三面细分
                </button>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mb-4 sm:mb-6">
              {funnelView === 'overview'
                ? '量化从实际已投递到初筛、技术面试、终面及录用的全流程流转率。'
                : '专门下钻技术面试各轮次（一面、二面、三面、录用）的到达与晋级通过率。'}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5 my-2">
            {(funnelView === 'overview' ? overviewFunnelData : roundsFunnelData).map((item, idx) => (
              <div key={idx} className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-200 font-semibold flex items-center gap-2">
                    <span>{item.stage}</span>
                    {item.detail ? (
                      <span className="text-xs text-zinc-400 font-normal">({item.detail})</span>
                    ) : null}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-zinc-300 font-mono font-medium">{item.count} 家</span>
                    <span className="px-2.5 py-0.5 rounded-md text-xs sm:text-sm bg-white/[0.06] font-bold text-white border border-white/[0.08]">
                      {item.rate}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden p-0.5 border border-white/[0.06]">
                  <div
                    className="career-progress-fill h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(5, (item.count / (totalApplied || 1)) * 100)}%`,
                      backgroundColor: item.fill,
                      backgroundImage: `linear-gradient(90deg, ${item.fill}80, ${item.fill})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs sm:text-sm text-zinc-400 flex-wrap gap-2">
            <span className="text-xs sm:text-sm">
              {funnelView === 'overview'
                ? '💡 建议：一面着手八股算法，二面业务架构，终面系统思考'
                : `💡 一面通过率 ${passRate1to2}% · 二面通过率 ${passRate2to3}%`}
            </span>
            <span className="font-mono text-cyan-300 font-semibold text-xs sm:text-sm">
              终面录用转化: {totalApplied ? Math.round((offers / totalApplied) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* 阶段分布饼图 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-2">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <PieIcon className="w-4 sm:w-5 h-4 sm:h-5 text-indigo-300" />
                当前流程状态占比
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400">各阶段实时比例与分布</p>
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
                  stroke="#101824"
                  strokeWidth={2}
                  isAnimationActive={!reducedMotion}
                  animationDuration={600}
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0]
                      return (
                        <div className="career-chart-tooltip px-3 py-2 rounded-xl backdrop-blur-md">
                          <p className="text-white text-xs font-medium flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                              style={{ backgroundColor: data.payload?.fill || data.color }}
                            />
                            <span className="text-white font-semibold">{data.name} :</span>
                            <span className="font-mono font-bold text-white text-sm">{data.value}</span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm pt-2 border-t border-white/[0.06]">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-zinc-300 text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                <span className="truncate">{item.label}:</span>
                <span className="font-mono font-bold text-white">{item.count}</span>
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
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-300" />
              工作地点 / Base 分布
            </h3>
            <span className="text-xs sm:text-sm text-zinc-400">意向城市</span>
          </div>

          <div className="h-48 sm:h-56 w-full flex items-center justify-center">
            {cityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs><linearGradient id="career-city-bar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a5f3fc" stopOpacity={.95} /><stop offset="100%" stopColor="#67e8f9" stopOpacity={.3} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 5" stroke="rgba(165,243,252,0.07)" vertical={false} />
                  <XAxis dataKey="city" fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} stroke="#94a3b8" axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0]
                        return (
                          <div className="career-chart-tooltip px-3 py-2 rounded-xl backdrop-blur-md">
                            <p className="text-zinc-300 text-[11px] mb-1 font-medium">{label || data.name}</p>
                            <p className="text-white text-xs font-medium flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full inline-block bg-cyan-300 shrink-0 shadow-sm" />
                              <span className="text-white font-semibold">投递数 :</span>
                              <span className="font-mono font-bold text-white text-sm">{data.value}</span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="count" name="投递数" fill="url(#career-city-bar)" radius={[6, 6, 0, 0]} maxBarSize={44} isAnimationActive={!reducedMotion} animationDuration={600} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs sm:text-sm text-zinc-500 text-center">
                暂无具体城市分布数据（已自动过滤未填与其他）
              </div>
            )}
          </div>
        </div>

        {/* 重点企业推进列表 */}
        <div className="linear-card p-4 sm:p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 border-b border-white/[0.06] pb-3">
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Zap className="w-4 sm:w-5 h-4 sm:h-5 text-amber-300" />
                重点大厂攻坚矩阵
              </h3>
              <span className="text-xs sm:text-sm text-zinc-400 font-mono">大厂名单 · 深圳优先</span>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
            {focusJobs.slice(0, 6).map((job) => {
              const isShenzhen = (job.location || '').includes('深圳') || (job.location || '').toLowerCase().includes('shenzhen')

              return (
                <div
                  key={job.id}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3 hover:bg-white/[0.04] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-300/10 text-cyan-300 font-bold flex items-center justify-center text-sm border border-cyan-300/20 shrink-0">
                      {job.company.substring(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-sm sm:text-base text-white truncate">{job.company}</h5>
                        {isShenzhen && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-300/15 text-amber-300 border border-amber-300/30 shrink-0 font-medium">
                            深圳 Base
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 truncate mt-0.5">{job.role} · {job.location || '全国'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {(() => {
                      const badge = getJobStageBadge(job)
                      return (
                        <span className={`text-xs sm:text-sm px-3 py-1 rounded-full font-medium border ${badge.color}`}>
                          {badge.text}
                        </span>
                      )
                    })()}
                    {job.salary && (
                      <p className="text-xs sm:text-sm text-emerald-300 mt-1 font-mono font-semibold">
                        {job.salary}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}

            {focusJobs.length === 0 && (
              <div className="py-8 text-center text-xs sm:text-sm text-zinc-500">
                暂无投递数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 多轮面试转化率全景弹窗 */}
      <InterviewConversionModal
        isOpen={isConversionModalOpen}
        onClose={() => setIsConversionModalOpen(false)}
        jobs={jobs}
      />
    </div>
  )
}
