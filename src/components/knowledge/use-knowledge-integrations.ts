'use client'

import { useEffect, useState } from 'react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import type { KnowledgeIntegrations } from '@/types/knowledge-integrations'

export function useKnowledgeIntegrations(enabled = true) {
  const [status, setStatus] = useState<KnowledgeIntegrations | null>(null)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setError('')
    KnowledgeAPI.status(controller.signal).then((value) => { if (!controller.signal.aborted) setStatus(value) })
      .catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message) })
    return () => controller.abort()
  }, [enabled, reload])
  return { status, error, retry: () => setReload((value) => value + 1) }
}
