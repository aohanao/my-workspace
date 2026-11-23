import type { ModelExperiment } from '@/types'
import { LEGACY_MODELS } from './legacy-research-plan'
import { RESEARCH_MODELS } from './research-plan'
import { upgradeResearchDefaults } from './storage'
import { chinaDate } from './workbench-clock'

export const MODEL_EXPERIMENTS_KEY = 'workspace_models_v4'
export const MODEL_REMINDER_KEY = 'workspace_assistant_model_reminder_v1'
export const MODEL_STATUS_LABELS = {
  not_started: '规划启动阶段', training: '训练中', completed: '已完成', failed: '失败', aborted: '已中止',
} satisfies Record<ModelExperiment['status'], string>

export interface ModelReminder {
  date: string
  summary: string
  notices: { id: string; text: string }[]
}

export function readModelExperiments(value: unknown): ModelExperiment[] {
  if (!Array.isArray(value)) return RESEARCH_MODELS
  const experiments = value.filter((item): item is ModelExperiment => item && typeof item.id === 'string' &&
    typeof item.modelName === 'string' && typeof item.status === 'string' && Object.hasOwn(MODEL_STATUS_LABELS, item.status))
  return upgradeResearchDefaults(experiments, LEGACY_MODELS, RESEARCH_MODELS)
}

export function makeModelReminder(experiments: ModelExperiment[], now = new Date()): ModelReminder | null {
  if (!experiments.length) return null
  const date = chinaDate(now)
  const tomorrow = chinaDate(new Date(now.getTime() + 86_400_000))
  const notices: (ModelReminder['notices'][number] & { priority: number })[] = []
  const completed = experiments.filter(({ status }) => status === 'completed').length
  const training = experiments.filter(({ status }) => status === 'training').length

  for (const { id, modelName, status, plannedDate } of experiments) {
    if (status === 'completed') {
      if (plannedDate && date < plannedDate) {
        notices.push({ id: `early:${id}:${plannedDate}`, text: `提前完成 · ${modelName}`, priority: 3 })
      }
    } else if (status === 'failed' || status === 'aborted') {
      notices.push({ id: `blocked:${id}:${status}`, text: `待跟进 · ${modelName}（${MODEL_STATUS_LABELS[status]}）`, priority: 0 })
    } else if (plannedDate && plannedDate < date) {
      notices.push({ id: `late:${id}:${plannedDate}`, text: `已超期 · ${modelName}`, priority: 1 })
    } else if (plannedDate === date || plannedDate === tomorrow) {
      notices.push({ id: `due:${id}:${plannedDate}`, text: `${plannedDate === date ? '今天' : '明天'}到期 · ${modelName}`, priority: 2 })
    }
  }

  if (!notices.length) {
    const next = experiments.find(({ status }) => status === 'training') ?? experiments.find(({ status }) => status === 'not_started')
    if (next) notices.push({ id: `next:${next.id}:${next.status}`, text: `${next.status === 'training' ? '当前训练' : '首个待启动'} · ${next.modelName}`, priority: 4 })
  }

  return {
    date,
    summary: `${completed}/${experiments.length} 已完成 · ${training} 项训练中`,
    notices: notices.sort((a, b) => a.priority - b.priority).slice(0, 4).map(({ id, text }) => ({ id, text })),
  }
}
