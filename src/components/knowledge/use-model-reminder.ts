'use client'

import { useEffect, useRef, useState } from 'react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import { makeModelReminder, MODEL_EXPERIMENTS_KEY, type ModelReminder } from '@/lib/model-reminders'
import { StorageService } from '@/lib/storage'

const READ_KEY = 'workspace_assistant_model_reminder_read_v1'

export function useModelReminder(viewingReminder: boolean) {
  const [reminder, setReminder] = useState<ModelReminder | null>(null)
  const [read, setRead] = useState('')
  const editedAt = useRef(0)

  useEffect(() => {
    const controller = new AbortController()
    const refreshLocal = () => setReminder(makeModelReminder(StorageService.getModels()))
    const refreshCloud = async () => {
      if (document.visibilityState === 'hidden') return
      try {
        const result = await KnowledgeAPI.modelReminder(controller.signal)
        if (controller.signal.aborted) return
        if (!editedAt.current || (result.updatedAt && Date.parse(result.updatedAt) >= editedAt.current)) {
          setReminder(result.reminder)
        }
      } catch {
        if (!controller.signal.aborted) refreshLocal()
      }
    }
    const onWorkspaceUpdate = (event: Event) => {
      const { key } = (event as CustomEvent<{ key?: string }>).detail ?? {}
      if (key === MODEL_EXPERIMENTS_KEY) editedAt.current = Date.now()
      if (!key || key === MODEL_EXPERIMENTS_KEY) refreshLocal()
    }
    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === MODEL_EXPERIMENTS_KEY) refreshLocal()
      if (!event.key || event.key === READ_KEY) setRead(localStorage.getItem(READ_KEY) ?? '')
    }
    refreshLocal()
    setRead(localStorage.getItem(READ_KEY) ?? '')
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

  const signature = reminder ? JSON.stringify([reminder.date, reminder.summary, ...reminder.notices.map(({ id }) => id)]) : ''
  useEffect(() => {
    if (viewingReminder && signature && signature !== read) {
      localStorage.setItem(READ_KEY, signature)
      setRead(signature)
    }
  }, [viewingReminder, read, signature])

  return { reminder, unread: Boolean(signature && read !== signature) }
}
