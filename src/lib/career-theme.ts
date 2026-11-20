import type { JobApplication, JobStatus } from '@/types'
import { getJobStageBadge, getJobDisplayTags } from './feishu-parser'

// 看板与图表使用相同阶段配色，筛选后颜色也保持一致。
export const CAREER_STAGE_COLORS: Record<JobStatus, string> = {
  wishlist: '#94a3b8',
  applied: '#67e8f9',
  assessment: '#a5b4fc',
  interview1: '#fcd34d',
  interview2: '#fdba74',
  interview3: '#c4b5fd',
  hr: '#f0abfc',
  offer: '#6ee7b7',
  rejected: '#fda4af',
}

const BADGE_STYLES: Record<string, string> = {
  zinc: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
  blue: 'bg-cyan-300/10 text-cyan-200 border-cyan-300/20',
  cyan: 'bg-cyan-300/10 text-cyan-200 border-cyan-300/20',
  purple: 'bg-indigo-300/10 text-indigo-300 border-indigo-300/20',
  amber: 'bg-amber-300/10 text-amber-300 border-amber-300/20',
  orange: 'bg-orange-300/10 text-orange-300 border-orange-300/20',
  indigo: 'bg-violet-300/10 text-violet-300 border-violet-300/20',
  pink: 'bg-fuchsia-300/10 text-fuchsia-300 border-fuchsia-300/20',
  emerald: 'bg-emerald-300/10 text-emerald-300 border-emerald-300/20',
  rose: 'bg-rose-300/10 text-rose-300 border-rose-300/20',
}

function softenBadge(color: string): string {
  const hue = color.match(/\btext-([a-z]+)-/)?.[1]
  return hue && BADGE_STYLES[hue] ? BADGE_STYLES[hue] : color
}

// 沿用原有状态与多选标签判定，仅为秋招页面替换视觉样式。
export function getCareerStageBadge(job: JobApplication) {
  const badge = getJobStageBadge(job)
  return { ...badge, color: softenBadge(badge.color) }
}

export function getCareerDisplayTags(job: Partial<JobApplication>) {
  return getJobDisplayTags(job).map((tag) => ({ ...tag, color: softenBadge(tag.color) }))
}
