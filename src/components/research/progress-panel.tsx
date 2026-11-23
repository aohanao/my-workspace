'use client'

import { useEffect, useState, type ChangeEvent } from 'react'
import { Bell, CalendarPlus, FileUp } from 'lucide-react'
import { getPlanPeriod } from '@/lib/plan-period'
import { getLocalDateKey } from '@/lib/utils'
import { StorageService } from '@/lib/storage'
import { getMilestoneReminders, getResearchPlanTask, parseResearchProgress } from '@/lib/research-progress'
import type { ResearchProgress, ResearchProgressItem } from '@/lib/research-progress'
import type { MilestoneItem, PlanTask } from '@/types'

const statusLabels = {
  next: '下一步',
  in_progress: '进行中',
  blocked: '等待前置工作',
  pending: '待开始',
  done: '已完成',
}

const actionClass = 'inline-flex items-center gap-1.5 rounded-lg border border-cyan-200/20 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-200/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:cursor-default disabled:text-zinc-400'

export function ResearchProgressPanel({ milestones }: { milestones: MilestoneItem[] }) {
  const [progress, setProgress] = useState<ResearchProgress | null>(null)
  const [tasks, setTasks] = useState<PlanTask[]>([])
  const [today, setToday] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setProgress(StorageService.getResearchProgress())
      setTasks(StorageService.getPlanTasks())
      setToday(getLocalDateKey())
    }
    refresh()
    window.addEventListener('workspace-data-updated', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('workspace-data-updated', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [])

  const week = today ? getPlanPeriod('week', new Date(today + 'T12:00:00')).start : ''
  const reminders = getMilestoneReminders(milestones, today)

  const importProgress = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    setLoading(true)
    try {
      const updated = file.size <= 64_000 ? parseResearchProgress(JSON.parse(await file.text())) : null
      if (!updated) {
        setNotice('请选择有效的工作台论文进度 JSON。')
        return
      }
      const previous = StorageService.getResearchProgress()
      if (previous && previous.updatedOn > updated.updatedOn) {
        setNotice('该文件的更新日期早于现有进度，请选择最新版。')
        return
      }
      if (JSON.stringify(previous) !== JSON.stringify(updated)) StorageService.saveResearchProgress(updated)
      setNotice('已载入项目进度。')
    } catch {
      setNotice('无法读取进度文件，请检查 JSON 格式。')
    } finally {
      setLoading(false)
    }
  }

  const addToWeek = (item: ResearchProgressItem) => {
    const period = getPlanPeriod('week').start
    const currentTasks = StorageService.getPlanTasks()
    if (getResearchPlanTask(currentTasks, period, item.id)) return
    StorageService.savePlanTasks([...currentTasks, {
      id: `thesis-${period}-${item.id}`,
      researchProgressId: item.id,
      text: `论文｜${item.nextAction ?? item.title}`,
      done: false,
      scope: 'week',
      periodStart: period,
      createdAt: new Date().toISOString(),
    }])
    setNotice('已加入首页的本周任务。')
  }

  return (
    <section id="research-progress" aria-labelledby="research-progress-title" className="workspace-feature scroll-mt-6 rounded-2xl p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="research-progress-title" className="flex items-center gap-2 text-base font-semibold text-white">
            <Bell className="h-4 w-4 text-cyan-300" />论文进度与提醒
          </h2>
          {progress && <p className="mt-1 text-xs text-zinc-400">进度摘要更新于 {progress.updatedOn} · 已完成 {progress.items.filter((item) => item.status === 'done').length} / {progress.items.length} 项</p>}
        </div>
        <label className={actionClass + ' cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-cyan-300'}>
          <FileUp className="h-3.5 w-3.5" />
          导入进度摘要
          <input type="file" accept=".json,application/json" className="sr-only" onChange={importProgress} disabled={loading} />
        </label>
      </div>
      {reminders.length > 0 && (
        <ul aria-label="毕业节点提醒" className="mt-4 flex flex-wrap gap-2">
          {reminders.map(({ id, title, days }) => (
            <li key={id} className="rounded-lg border border-amber-200/20 bg-amber-200/5 px-3 py-1.5 text-xs text-amber-200">
              {title} · {days < 0 ? `逾期 ${-days} 天` : days === 0 ? '今天到期' : `剩 ${days} 天`}
            </li>
          ))}
        </ul>
      )}
      {!progress ? (
        <p className="mt-4 text-sm text-zinc-400">选择论文项目中的「工作台论文进度.json」，载入进展、待办和阻塞事项。</p>
      ) : (
        <ul className="mt-4 divide-y divide-white/10">
          {progress.items.map((item) => {
            const active = item.status === 'next' || item.status === 'in_progress'
            const task = getResearchPlanTask(tasks, week, item.id)
            return (
              <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-sm font-medium text-zinc-100">{item.title}</p>
                  <p className="mt-0.5 text-xs text-cyan-200/80">{item.area} · {statusLabels[item.status]}</p>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-300">{item.detail}</p>
                  {item.nextAction && <p className="mt-1 text-sm leading-relaxed text-zinc-200">{item.nextAction}</p>}
                </div>
                {active && (
                  <button type="button" className={actionClass} onClick={() => addToWeek(item)} disabled={!!task}>
                    <CalendarPlus className="h-3.5 w-3.5" />
                    {task?.done ? '本周任务已完成' : task ? '已在本周计划' : '加入本周计划'}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <p role="status" className={notice ? 'mt-2 text-xs text-cyan-200' : 'sr-only'}>{notice}</p>
    </section>
  )
}
