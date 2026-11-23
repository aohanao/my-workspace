import { getPlanPeriod } from './plan-period'
import type { PlanScope, PlanTask } from '@/types'

export const PLAN_TASKS_KEY = 'workspace_plan_tasks_v1'
export const PLAN_REMINDER_KEY = 'workspace_assistant_plan_reminder_v1'

const chinaCalendar = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' })
export const chinaDate = (date = new Date()) => chinaCalendar.format(date)

export interface PlanReminder {
  date: string
  summary: string
  notices: { id: string; text: string }[]
}

export function makePlanReminder(value: unknown, now = new Date()): PlanReminder | null {
  if (!Array.isArray(value)) return null
  const tasks = value.filter((task): task is PlanTask => task && typeof task.id === 'string' && typeof task.text === 'string' &&
    typeof task.done === 'boolean' && (task.scope === 'week' || task.scope === 'month') &&
    typeof task.periodStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.periodStart))
  const date = chinaDate(now)
  const yesterday = chinaDate(new Date(now.getTime() - 86_400_000))
  const tomorrow = chinaDate(new Date(now.getTime() + 86_400_000))
  const carriedIds = new Set(tasks.map((task) => task.carriedFromId))
  const progress: string[] = []
  const notices: (PlanReminder['notices'][number] & { priority: number; due: string })[] = []

  for (const scope of ['week', 'month'] as const satisfies readonly PlanScope[]) {
    const periodStart = getPlanPeriod(scope, new Date(date + 'T12:00:00')).start
    const current = tasks.filter((task) => task.scope === scope && task.periodStart === periodStart)
    if (current.length) {
      const done = current.filter((task) => task.done).length
      progress.push(`${scope === 'week' ? '本周' : '本月'} ${done}/${current.length} 已完成`)
    }
  }

  for (const task of tasks) {
    if (task.periodStart > date || carriedIds.has(task.id)) continue
    const period = getPlanPeriod(task.scope, new Date(task.periodStart + 'T12:00:00'))
    const planned = typeof task.plannedDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.plannedDate) &&
      task.plannedDate >= period.start && task.plannedDate <= period.end ? task.plannedDate : undefined
    const due = planned ?? period.end
    const completed = typeof task.completedDate === 'string' ? task.completedDate : ''
    if (!task.done && due < date) {
      notices.push({ id: `late:${task.id}:${due}`, text: `已超期 · ${task.text}`, priority: 0, due })
    } else if (!task.done && due === date) {
      notices.push({ id: `due:${task.id}:${due}`, text: `今天到期 · ${task.text}`, priority: 1, due })
    } else if (task.done && planned && (completed === date || completed === yesterday) && completed < planned) {
      notices.push({ id: `early:${task.id}:${completed}:${planned}`, text: `提前完成 · ${task.text}`, priority: 2, due })
    } else if (!task.done && due === tomorrow) {
      notices.push({ id: `soon:${task.id}:${due}`, text: `明天到期 · ${task.text}`, priority: 3, due })
    }
  }

  if (!progress.length && !notices.length) return null
  return {
    date,
    summary: progress.join(' · '),
    notices: notices.sort((a, b) => a.priority - b.priority || b.due.localeCompare(a.due)).slice(0, 4)
      .map(({ id, text }) => ({ id, text })),
  }
}
