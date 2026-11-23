'use client'

import { useEffect, useState } from 'react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import { chinaDate, makePlanReminder, PLAN_TASKS_KEY, type PlanReminder } from '@/lib/plan-reminders'
import { StorageService } from '@/lib/storage'

const READ_KEY = 'workspace_assistant_plan_reminder_read_v1'

export function usePlanReminder(viewingReminder: boolean) {
  const [preview, setPreview] = useState<PlanReminder | null>(null)
  const [hasLocalPlan, setHasLocalPlan] = useState(false)
  const [daily, setDaily] = useState<PlanReminder | null>(null)
  const [read, setRead] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    const refresh = () => {
      setPreview(makePlanReminder(StorageService.getPlanTasks()))
      setHasLocalPlan(localStorage.getItem(PLAN_TASKS_KEY) !== null)
      setRead(localStorage.getItem(READ_KEY) ?? '')
    }
    const refreshCloud = async () => {
      if (document.visibilityState === 'hidden') return
      refresh()
      try {
        const result = await KnowledgeAPI.planReminder(controller.signal)
        if (!controller.signal.aborted) setDaily(result.reminder)
      } catch {
        // A cloud sync failure does not prevent showing the locally available plan.
      }
    }
    const onWorkspaceUpdate = (event: Event) => {
      const { key } = (event as CustomEvent<{ key?: string }>).detail ?? {}
      if (!key || key === PLAN_TASKS_KEY) refresh()
    }
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === PLAN_TASKS_KEY || event.key === READ_KEY) refresh()
    }
    void refreshCloud()
    const timer = window.setInterval(refreshCloud, 60_000)
    window.addEventListener('workspace-data-updated', onWorkspaceUpdate)
    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', refreshCloud)
    return () => {
      controller.abort()
      window.clearInterval(timer)
      window.removeEventListener('workspace-data-updated', onWorkspaceUpdate)
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', refreshCloud)
    }
  }, [])

  const reminder = preview ?? (!hasLocalPlan && daily?.date === chinaDate() ? daily : null)
  const signature = reminder ? JSON.stringify([reminder.date, reminder.summary, ...reminder.notices.map(({ id }) => id)]) : ''
  useEffect(() => {
    if (viewingReminder && signature && signature !== read) {
      localStorage.setItem(READ_KEY, signature)
      setRead(signature)
    }
  }, [viewingReminder, read, signature])

  return { reminder, unread: Boolean(signature && read !== signature) }
}
