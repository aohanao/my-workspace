import type { PlanScope, PlanTask } from '@/types'
import { getLocalDateKey } from './utils'

// 使用本地日历计算，避免 UTC 日期与跨年周编号造成归档错位。
export function getPlanPeriod(scope: PlanScope, date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  if (scope === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7)
  else start.setDate(1)
  const end = new Date(start)
  if (scope === 'week') end.setDate(end.getDate() + 6)
  else end.setMonth(end.getMonth() + 1, 0)
  return { start: getLocalDateKey(start), end: getLocalDateKey(end) }
}

export function shiftPlanPeriod(scope: PlanScope, start: string, direction: number) {
  const date = new Date(`${start}T12:00:00`)
  if (scope === 'week') date.setDate(date.getDate() + direction * 7)
  else date.setMonth(date.getMonth() + direction)
  return getPlanPeriod(scope, date)
}

export function getCarryoverTasks(tasks: PlanTask[], scope: PlanScope, currentStart: string) {
  const carriedIds = new Set(tasks.map((task) => task.carriedFromId).filter(Boolean))
  return tasks.filter((task) => task.scope === scope && task.periodStart < currentStart && !task.done && !carriedIds.has(task.id))
}
