'use client'

import { useState } from 'react'
import { JobApplication } from '@/types'
import { isJobApplied } from '@/lib/feishu-parser'
import {
  X,
  TrendingUp,
  BarChart3,
  Award,
  Layers,
  Sparkles,
  ArrowRight,
  Building2,
  CheckCircle2,
  Calendar,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  jobs: JobApplication[]
  onSelectJob?: (job: JobApplication) => void
}

export function InterviewConversionModal({ isOpen, onClose, jobs, onSelectJob }: Props) {
  const [activeStageTab, setActiveStageTab] = useState<'round1' | 'round2' | 'round3' | 'hr' | 'offer'>('round1')

  if (!isOpen) return null

  // 严格区分实际已投递与未投递
  const appliedJobs = jobs.filter((j) => isJobApplied(j))
  const notAppliedJobs = jobs.filter((j) => !isJobApplied(j))
  const totalApplied = appliedJobs.length
  const notAppliedCount = notAppliedJobs.length

  // 各阶段达到的企业列表
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
  const offerJobs = jobs.filter((j) => j.status === 'offer')

  // 转化率计算 (以实际已投递数 totalApplied 为分母)
  const rate1 = totalApplied > 0 ? Math.round((round1Jobs.length / totalApplied) * 100) : 0
  const rate2 = totalApplied > 0 ? Math.round((round2Jobs.length / totalApplied) * 100) : 0
  const rate3 = totalApplied > 0 ? Math.round((round3Jobs.length / totalApplied) * 100) : 0
  const rateHr = totalApplied > 0 ? Math.round((hrJobs.length / totalApplied) * 100) : 0
  const rateOffer = totalApplied > 0 ? Math.round((offerJobs.length / totalApplied) * 100) : 0

  // 轮次间晋级通过率
  const passRate1to2 = round1Jobs.length > 0 ? Math.round((round2Jobs.length / round1Jobs.length) * 100) : 0
  const passRate2to3 = round2Jobs.length > 0 ? Math.round((round3Jobs.length / round2Jobs.length) * 100) : 0
  const passRate3toHr = round3Jobs.length > 0 ? Math.round((hrJobs.length / round3Jobs.length) * 100) : (round2Jobs.length > 0 ? Math.round((hrJobs.length / round2Jobs.length) * 100) : 0)
  const passRateHrToOffer = hrJobs.length > 0 ? Math.round((offerJobs.length / hrJobs.length) * 100) : 0

  const STAGES = [
    {
      id: 'round1' as const,
      title: '技术一面',
      jobs: round1Jobs,
      rate: rate1,
      tagColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      barColor: 'bg-amber-400',
      passLabel: '投递约面率',
      passRate: rate1,
    },
    {
      id: 'round2' as const,
      title: '技术二面',
      jobs: round2Jobs,
      rate: rate2,
      tagColor: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
      barColor: 'bg-orange-400',
      passLabel: '一面通过率',
      passRate: passRate1to2,
    },
    {
      id: 'round3' as const,
      title: '技术三面 / 主管面',
      jobs: round3Jobs,
      rate: rate3,
      tagColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
      barColor: 'bg-indigo-400',
      passLabel: '二面通过率',
      passRate: passRate2to3,
    },
    {
      id: 'hr' as const,
      title: '终面 / HR面',
      jobs: hrJobs,
      rate: rateHr,
      tagColor: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
      barColor: 'bg-pink-400',
      passLabel: '技术面通过率',
      passRate: passRate3toHr,
    },
    {
      id: 'offer' as const,
      title: '录用 / Offer 🎉',
      jobs: offerJobs,
      rate: rateOffer,
      tagColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
      barColor: 'bg-emerald-400',
      passLabel: '终面转化率',
      passRate: passRateHrToOffer,
    },
  ]

  const currentStageMeta = STAGES.find((s) => s.id === activeStageTab) || STAGES[0]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#10131d] border border-indigo-500/30 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 头部标题栏 */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <span>技术面试各阶段转化率全景透视</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/20">
                  实际已投 {totalApplied} 家基准
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                覆盖一面、二面、三面、终面及录用全流程到达率与晋级通过率（已排除 {notAppliedCount} 家储备未投企业）
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主体滚动区 */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* 5大阶段水平卡片流水线 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {STAGES.map((stg) => {
              const isActive = activeStageTab === stg.id

              return (
                <div
                  key={stg.id}
                  onClick={() => setActiveStageTab(stg.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    isActive
                      ? `${stg.tagColor} shadow-md scale-[1.02] border-current`
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px] truncate text-white">{stg.title}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl sm:text-2xl font-bold font-mono text-white">{stg.rate}%</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {stg.jobs.length} / {totalApplied || 1} 家
                    </p>
                  </div>

                  <div className="w-full bg-black/40 rounded-full h-1 overflow-hidden">
                    <div className={`h-full ${stg.barColor} rounded-full`} style={{ width: `${Math.min(100, stg.rate)}%` }} />
                  </div>

                  <p className="text-[10px] pt-1 border-t border-white/[0.06] text-zinc-400 flex items-center justify-between">
                    <span>{stg.passLabel}:</span>
                    <span className="font-mono font-bold text-white">{stg.passRate}%</span>
                  </p>
                </div>
              )
            })}
          </div>

          {/* 转化流向导图 */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                秋招漏斗层级流转漏斗
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">
                最终 Offer 转化率: {totalApplied ? Math.round((offerJobs.length / totalApplied) * 100) : 0}%
              </span>
            </div>

            <div className="space-y-2.5">
              {STAGES.map((stg, idx) => (
                <div key={stg.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">{stg.title}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-400 font-mono">{stg.jobs.length} 家到达</span>
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-white bg-white/[0.05] border border-white/[0.08] text-[11px]">
                        {stg.rate}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden p-0.5 border border-white/[0.06]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${stg.barColor}`}
                      style={{ width: `${Math.max(4, stg.rate)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 点击选中阶段对应的企业名单列表 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm">
                  到达「{currentStageMeta.title}」的企业明细清单
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  共 {currentStageMeta.jobs.length} 家
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">点击上方阶段卡片可切换查看各轮名单</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {currentStageMeta.jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => {
                    if (onSelectJob) {
                      onSelectJob(job)
                      onClose()
                    }
                  }}
                  className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-500/20">
                      {job.company.substring(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <h5 className="font-semibold text-white text-xs group-hover:text-indigo-300 transition-colors truncate">
                        {job.company}
                      </h5>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {job.role} · {job.location || '城市未填'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${currentStageMeta.tagColor}`}>
                      {job.status}
                    </span>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">
                      {job.applyDate}
                    </p>
                  </div>
                </div>
              ))}

              {currentStageMeta.jobs.length === 0 && (
                <div className="col-span-2 py-8 text-center text-zinc-500 border border-dashed border-white/[0.06] rounded-xl">
                  暂无到达该阶段的企业记录
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部按钮栏 */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px]">面试转化率根据实际已投递家数动态量化</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium transition-colors"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  )
}
