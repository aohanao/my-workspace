export const DASHBOARD_MODULES = [
  { id: 'careerCountdown', label: '秋招倒计时', description: '秋招冲刺目标日期' },
  { id: 'thesisCountdown', label: '论文倒计时', description: '初稿完成送审日期' },
  { id: 'tasks', label: '今日安排与核心待办', description: '今日任务、四象限与完成进度' },
  { id: 'plans', label: '周月计划', description: '本周、本月目标与历史归档' },
  { id: 'overview', label: '全系统推进概览', description: '求职、论文与算法题库进度' },
  { id: 'reviews', label: '力扣到期复习', description: '需要复习的算法题目' },
  { id: 'interviews', label: '面试中流程', description: '正在推进的面试记录' },
  { id: 'chapters', label: '学位论文章节进展', description: '各章节字数与完成进度' },
] as const

export type DashboardModuleId = typeof DASHBOARD_MODULES[number]['id']
export type DashboardVisibility = Record<DashboardModuleId, boolean>

export const DEFAULT_DASHBOARD_VISIBILITY = Object.fromEntries(
  DASHBOARD_MODULES.map(({ id }) => [id, true])
) as DashboardVisibility

// 新增模块默认显示；保留明确关闭的选项，兼容旧备份或损坏的偏好数据。
export function normalizeDashboardVisibility(value: unknown): DashboardVisibility {
  const saved = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
  return Object.fromEntries(DASHBOARD_MODULES.map(({ id }) => [
    id, typeof saved[id] === 'boolean' ? saved[id] : true,
  ])) as DashboardVisibility
}
