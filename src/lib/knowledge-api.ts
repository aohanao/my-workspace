'use client'

import { getSupabase } from './supabase'
import type { PlanReminder } from './plan-reminders'
import type { KnowledgeChatMessage, KnowledgeChatResponse, KnowledgeGraphResponse, KnowledgeIntegrations, KnowledgeSearchRequest, KnowledgeSearchResponse } from '@/types/knowledge-integrations'

async function request<T>(operation: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const { data } = await getSupabase()!.auth.getSession()
  if (!data.session) throw new Error('登录已过期，请重新登录')
  const response = await fetch(`/api/knowledge/${operation}`, {
    method: body === undefined ? 'GET' : 'POST', signal, cache: 'no-store',
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error?.message || '知识服务暂时不可用，请稍后重试')
  return result as T
}

export const KnowledgeAPI = {
  status: (signal?: AbortSignal) => request<KnowledgeIntegrations>('status', undefined, signal),
  planReminder: (signal?: AbortSignal) => request<{ reminder: PlanReminder | null }>('plan-reminder', undefined, signal),
  search: (query: KnowledgeSearchRequest, signal?: AbortSignal) => request<KnowledgeSearchResponse>('search', query, signal),
  graph: (query: { query?: string; limit?: number; depth?: number }, signal?: AbortSignal) => request<KnowledgeGraphResponse>('graph', query, signal),
  chat: (messages: KnowledgeChatMessage[], document_id?: string, signal?: AbortSignal) => request<KnowledgeChatResponse>('chat', { messages, document_id }, signal),
}
