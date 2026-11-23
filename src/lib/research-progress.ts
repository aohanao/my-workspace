import type { MilestoneItem, PlanTask } from '@/types'

const statuses = ['next', 'in_progress', 'blocked', 'pending', 'done'] as const
type Status = typeof statuses[number]

export interface ResearchProgressItem {
  id: string
  area: string
  title: string
  status: Status
  detail: string
  nextAction?: string
}

export interface ResearchProgress {
  schemaVersion: 1
  project: 'graduation-thesis'
  updatedOn: string
  items: ResearchProgressItem[]
}

const statusSet = new Set<string>(statuses)
const dayMs = 86_400_000

function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function shortText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

function dayNumber(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(value + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
    ? date.getTime() / dayMs
    : null
}

export function parseResearchProgress(value: unknown): ResearchProgress | null {
  if (!record(value) || value.schemaVersion !== 1 || value.project !== 'graduation-thesis' ||
      typeof value.updatedOn !== 'string' || dayNumber(value.updatedOn) === null ||
      !Array.isArray(value.items) || value.items.length === 0 || value.items.length > 40) return null

  const items: ResearchProgressItem[] = []
  const ids = new Set<string>()
  for (const item of value.items) {
    if (!record(item) || typeof item.id !== 'string' || !/^[a-z0-9-]{1,48}$/.test(item.id) ||
        ids.has(item.id) || !shortText(item.area, 40) || !shortText(item.title, 120) ||
        !shortText(item.detail, 480) || typeof item.status !== 'string' || !statusSet.has(item.status) ||
        (item.nextAction !== undefined && !shortText(item.nextAction, 180))) return null
    ids.add(item.id)
    items.push({
      id: item.id,
      area: item.area,
      title: item.title,
      status: item.status as Status,
      detail: item.detail,
      nextAction: item.nextAction,
    })
  }
  return { schemaVersion: 1, project: 'graduation-thesis', updatedOn: value.updatedOn, items }
}

export function getNextResearchItem(progress: ResearchProgress | null) {
  return progress?.items.find((item) => item.status === 'next') ??
    progress?.items.find((item) => item.status === 'in_progress')
}

export function getMilestoneReminders(milestones: MilestoneItem[], today: string) {
  const current = dayNumber(today)
  if (current === null) return []

  return milestones.flatMap((item) => {
    const target = dayNumber(item.targetDate)
    if (item.completed || target === null || target - current > 7) return []
    return [{ id: item.id, title: item.title, days: target - current }]
  }).sort((a, b) => a.days - b.days)
}

export function getResearchPlanTask(tasks: PlanTask[], periodStart: string, itemId: string) {
  return tasks.find((task) => task.scope === 'week' && task.periodStart === periodStart &&
    task.researchProgressId === itemId)
}
