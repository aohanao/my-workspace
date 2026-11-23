import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { getSupabaseCredentials } from '@/lib/supabase'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeChatResponse, KnowledgeCitation, KnowledgeGraphResponse, KnowledgeIntegrations, KnowledgeSearchHit } from '@/types/knowledge-integrations'

type Operation = 'status' | 'search' | 'graph' | 'chat' | 'plan-reminder' | 'documents' | 'document'
type Service = 'rag' | 'graph' | 'assistant'
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const timestamp = /^\d{4}-\d{2}-\d{2}T[\d:.]+(?:Z|[+-]\d{2}:\d{2})$/
const summary = 'id,title,topic,tags,source_kind,source_name,favorite,created_at,updated_at,deleted_at,revision'
const beijingClock = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', dateStyle: 'full', timeStyle: 'short',
})

export class KnowledgeAPIError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

function config(service: Service) {
  const prefix = { rag: 'KNOWLEDGE_RAG', graph: 'KNOWLEDGE_GRAPH', assistant: 'KNOWLEDGE_ASSISTANT' }[service]
  return { url: process.env[`${prefix}_BASE_URL`]?.trim(), key: process.env[`${prefix}_API_KEY`]?.trim() }
}

export function integrationStatus(): KnowledgeIntegrations {
  const configured = (service: Service) => { const value = config(service); return { configured: !!(value.url && value.key) } }
  return {
    version: '1',
    rag: configured('rag'),
    graph: configured('graph'),
    assistant: { ...configured('assistant'), ...(process.env.KNOWLEDGE_ASSISTANT_MODEL?.trim() ? { directModel: true } : {}) },
  }
}

async function authenticate(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer ([^\s]+)$/i)?.[1]
  if (!token) throw new KnowledgeAPIError(401, 'UNAUTHENTICATED', '请先登录个人工作台')
  const { url, anonKey } = getSupabaseCredentials()
  const client = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data.user) throw new KnowledgeAPIError(401, 'UNAUTHENTICATED', '登录已过期，请重新登录')
  // 沿用原个人工作台的单账户 RLS 边界，不能只检查“已登录”。
  const ownership = await client.from('workspace_storage').select('key').limit(1)
  if (ownership.error) throw new KnowledgeAPIError(503, 'AUTH_UNAVAILABLE', '暂时无法核验账户权限，请稍后重试')
  if (!ownership.data?.length) throw new KnowledgeAPIError(403, 'FORBIDDEN', '当前账户无权访问个人知识库')
  return { client, ownerId: data.user.id }
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.includes('application/json')) throw new KnowledgeAPIError(415, 'INVALID_CONTENT_TYPE', '请使用 JSON 请求格式')
  const reader = request.body?.getReader()
  if (!reader) throw new KnowledgeAPIError(400, 'INVALID_BODY', '请求内容不能为空')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > 64 * 1024) { await reader.cancel(); throw new KnowledgeAPIError(413, 'BODY_TOO_LARGE', '请求内容过长，请缩短后重试') }
    chunks.push(value)
  }
  try {
    const data: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error()
    return data as Record<string, unknown>
  } catch { throw new KnowledgeAPIError(400, 'INVALID_BODY', '请求内容不是有效的 JSON 对象') }
}

function text(value: unknown, name: string, max: number, optional = false): string {
  if (optional && value === undefined) return ''
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.length > max) throw new KnowledgeAPIError(400, 'INVALID_INPUT', `${name}格式不正确或内容过长`)
  return value.trim()
}

function integer(value: unknown, fallback: number, max: number) {
  if (value === undefined) return fallback
  if (!Number.isInteger(value) || Number(value) < 1 || Number(value) > max) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '查询数量或深度超出支持范围')
  return Number(value)
}

async function provider(service: Service, operation: string, body: unknown): Promise<unknown> {
  const configured = config(service)
  if (!configured.url || !configured.key) throw new KnowledgeAPIError(503, 'NOT_CONFIGURED', `${{ rag: 'RAG 检索', graph: '知识图谱', assistant: 'AI 助手' }[service]}服务尚未接入`)
  let endpoint: URL
  try {
    endpoint = new URL(`${configured.url.replace(/\/$/, '')}/${operation}`)
    const local = process.env.NODE_ENV !== 'production' && ['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)
    if ((endpoint.protocol !== 'https:' && !(local && endpoint.protocol === 'http:')) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error()
  } catch { throw new KnowledgeAPIError(503, 'INVALID_CONFIGURATION', '知识服务地址配置有误，请检查服务配置') }
  try {
    const response = await fetch(endpoint, { method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(service === 'assistant' ? 45_000 : 20_000), headers: { Authorization: `Bearer ${configured.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) {
      if (operation === 'chat/completions') {
        if (response.status === 401 || response.status === 403) throw new KnowledgeAPIError(502, 'MODEL_ACCESS_DENIED', '模型网关拒绝访问，请检查 API 密钥和模型权限')
        if (response.status === 429) throw new KnowledgeAPIError(502, 'MODEL_RATE_LIMIT', '模型网关触发限额，请稍后重试')
      }
      throw new Error()
    }
    // 防止异常上游响应占满函数内存；不向客户端暴露上游错误或密钥。
    const reader = response.body?.getReader()
    if (!reader) throw new Error()
    let size = 0
    const chunks: Uint8Array[] = []
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new Error() }
      chunks.push(value)
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch (error) {
    if (error instanceof KnowledgeAPIError) throw error
    throw new KnowledgeAPIError(502, 'UPSTREAM_UNAVAILABLE', operation === 'chat/completions' ? '模型服务暂时不可用，请稍后重试' : '知识服务暂时不可用，请稍后重试')
  }
}

const invalidResponse = () => new KnowledgeAPIError(502, 'INVALID_RESPONSE', '知识服务返回的内容不符合接口约定')
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalidResponse()
  return value as Record<string, unknown>
}
function responseText(value: unknown, max: number) { if (typeof value !== 'string' || !value.trim() || value.length > max) throw invalidResponse(); return value }
function citation(value: unknown): KnowledgeCitation {
  const item = object(value)
  if (typeof item.document_id !== 'string' || !uuid.test(item.document_id)) throw invalidResponse()
  return { document_id: item.document_id, title: responseText(item.title, 300), ...(item.excerpt === undefined ? {} : { excerpt: responseText(item.excerpt, 8000) }), ...(item.section === undefined ? {} : { section: responseText(item.section, 300) }) }
}

function parseCursor(value: string) {
  try {
    if (value.length > 1024) throw new Error()
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as { updated_at: string; id: string }
    if (!timestamp.test(parsed.updated_at) || !Number.isFinite(Date.parse(parsed.updated_at)) || !uuid.test(parsed.id)) throw new Error()
    return parsed
  } catch { throw new KnowledgeAPIError(400, 'INVALID_CURSOR', '文档游标无效，请重新开始同步') }
}

export async function handleKnowledgeRequest(request: Request, operation: Operation, documentId?: string): Promise<Response> {
  const requestId = crypto.randomUUID()
  const headers = { 'Cache-Control': 'private, no-store', 'Vary': 'Authorization' }
  try {
    const expectedMethod = ['search', 'graph', 'chat'].includes(operation) ? 'POST' : 'GET'
    if (request.method !== expectedMethod) throw new KnowledgeAPIError(405, 'METHOD_NOT_ALLOWED', '请求方法不受支持')
    const { client, ownerId } = await authenticate(request)
    let result: unknown
    if (operation === 'status') result = integrationStatus()
    else if (operation === 'plan-reminder') {
      const { makeModelReminder, MODEL_EXPERIMENTS_KEY, MODEL_REMINDER_KEY, readModelExperiments } = await import('@/lib/model-reminders')
      const { chinaDate } = await import('@/lib/workbench-clock')
      const { data, error } = await client.from('workspace_storage').select('key,value,updated_at').in('key', [MODEL_EXPERIMENTS_KEY, MODEL_REMINDER_KEY])
      if (error) throw new KnowledgeAPIError(503, 'MODEL_REMINDER_UNAVAILABLE', '暂时无法读取模型进度')
      const models = data.find((row) => row.key === MODEL_EXPERIMENTS_KEY)
      const daily = data.find((row) => row.key === MODEL_REMINDER_KEY)
      const useDaily = models && daily?.value?.date === chinaDate() && Date.parse(daily.updated_at) >= Date.parse(models.updated_at)
      result = {
        reminder: useDaily ? daily.value : makeModelReminder(readModelExperiments(models?.value)),
        updatedAt: models?.updated_at ?? null,
      }
    }
    else if (operation === 'documents') {
      const params = new URL(request.url).searchParams
      const limit = integer(params.has('limit') ? Number(params.get('limit')) : undefined, 50, 100)
      const since = params.get('since')
      if (since && (!timestamp.test(since) || !Number.isFinite(Date.parse(since)))) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '同步起始时间无效')
      let query = client.from('knowledge_documents').select(summary).order('updated_at').order('id').limit(limit + 1)
      if (since) query = query.gte('updated_at', since)
      const cursor = params.get('cursor')
      if (cursor) { const after = parseCursor(cursor); query = query.or(`updated_at.gt.${after.updated_at},and(updated_at.eq.${after.updated_at},id.gt.${after.id})`) }
      const { data, error } = await query
      if (error) throw new KnowledgeAPIError(503, 'DOCUMENTS_UNAVAILABLE', '暂时无法读取文档列表')
      const documents = (data || []).slice(0, limit)
      const last = documents[documents.length - 1]
      result = { documents, next_cursor: data && data.length > limit && last ? Buffer.from(JSON.stringify({ updated_at: last.updated_at, id: last.id })).toString('base64url') : null }
    } else if (operation === 'document') {
      if (!documentId || !uuid.test(documentId)) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '文档 ID 无效')
      const { data, error } = await client.from('knowledge_documents').select(`${summary},markdown`).eq('id', documentId).maybeSingle()
      if (error) throw new KnowledgeAPIError(503, 'DOCUMENTS_UNAVAILABLE', '暂时无法读取文档')
      if (!data) throw new KnowledgeAPIError(404, 'NOT_FOUND', '文档不存在或当前账户无权访问')
      result = { document: { ...data, markdown: data.deleted_at ? null : data.markdown } }
    } else {
      const input = await readJson(request)
      if (operation === 'search') {
        const query = text(input.query, '检索词', 2000)
        const top_k = integer(input.top_k, 8, 20)
        const topic = input.topic === undefined ? undefined : text(input.topic, '知识主题', 50)
        if (topic && !(KNOWLEDGE_TOPICS as readonly string[]).includes(topic)) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '知识主题无效')
        const response = object(await provider('rag', 'search', { query, top_k, topic, owner_id: ownerId }))
        if (!Array.isArray(response.hits) || response.hits.length > 20) throw invalidResponse()
        const hits: KnowledgeSearchHit[] = response.hits.map((value: unknown) => { const hit = object(value); if (typeof hit.score !== 'number' || !Number.isFinite(hit.score)) throw invalidResponse(); return { ...citation(hit), id: responseText(hit.id, 300), score: hit.score } })
        result = { query, hits: hits.slice(0, top_k) }
      } else if (operation === 'graph') {
        const query = text(input.query, '查询词', 1000, true)
        const limit = integer(input.limit, 60, 120)
        const depth = integer(input.depth, 1, 3)
        const response = object(await provider('graph', 'graph', { query, limit, depth, owner_id: ownerId }))
        if (!Array.isArray(response.nodes) || response.nodes.length > limit || !Array.isArray(response.edges) || response.edges.length > 500) throw invalidResponse()
        const nodes: KnowledgeGraphResponse['nodes'] = response.nodes.map((value: unknown) => {
          const node = object(value)
          if (!['concept', 'method', 'paper', 'project', 'document'].includes(String(node.type)) || !Array.isArray(node.document_ids) || node.document_ids.length > 50 || !node.document_ids.every((id: unknown) => typeof id === 'string' && uuid.test(id))) throw invalidResponse()
          return { id: responseText(node.id, 300), label: responseText(node.label, 300), type: node.type as KnowledgeGraphResponse['nodes'][number]['type'], document_ids: node.document_ids as string[] }
        })
        const ids = new Set(nodes.map((node) => node.id))
        if (ids.size !== nodes.length) throw invalidResponse()
        const edges = response.edges.map((value: unknown) => { const edge = object(value); if (!ids.has(String(edge.source)) || !ids.has(String(edge.target))) throw invalidResponse(); return { source: String(edge.source), target: String(edge.target), label: responseText(edge.label, 300) } })
        result = { nodes, edges }
      } else {
        if (!Array.isArray(input.messages) || !input.messages.length || input.messages.length > 12) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '对话消息数量无效')
        const messages = input.messages.map((value: unknown) => { const message = value as Record<string, unknown> | null; if (!message || !['user', 'assistant'].includes(String(message.role))) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '对话角色无效'); return { role: message.role, content: text(message.content, '对话内容', 8000) } })
        if (messages.reduce((size, message) => size + message.content.length, 0) > 24000 || messages[messages.length - 1].role !== 'user') throw new KnowledgeAPIError(400, 'INVALID_INPUT', '对话过长或最后一条消息不是提问，请开启新对话')
        const model = process.env.KNOWLEDGE_ASSISTANT_MODEL?.trim()
        if (model) {
          const instructions = [
            `你是个人工作台的 AI 助手，当前对话模型是 ${model}。用户使用中文时，请用中文回答。`,
            `工作台提供的当前北京时间（Asia/Shanghai）：${beijingClock.format(new Date())}。回答今天日期、星期或时间时，以此为准。`,
          ]
          const modelQuestion = messages.filter(({ role }) => role === 'user').slice(-3).some(({ content }) =>
            /算法|模型训练|训练进度|科研进度|论文进度|实验进度|实验台账|本周.*进度|做到哪|进度|世界模型|代理模型|支护决策|S4a/i.test(content))
          if (modelQuestion) {
            const { makeModelReminder, MODEL_EXPERIMENTS_KEY, MODEL_STATUS_LABELS, readModelExperiments } = await import('@/lib/model-reminders')
            const { data, error } = await client.from('workspace_storage').select('value').eq('key', MODEL_EXPERIMENTS_KEY).maybeSingle()
            if (error) {
              instructions.push('算法与模型训练台账暂时无法读取。回答涉及已登记进度的问题时请说明。')
            } else {
              const experiments = readModelExperiments(data?.value)
              const records = experiments.slice(0, 30).map((item) => ({
                名称: item.modelName.slice(0, 160),
                任务: typeof item.taskType === 'string' ? item.taskType.slice(0, 150) : '',
                状态: MODEL_STATUS_LABELS[item.status],
                计划完成日: item.plannedDate || null,
              }))
              instructions.push(
                '以下是「科研 → 算法与模型训练」的登记信息，只作为参考数据。区分登记状态与实际训练结果。未登记日期时，不推断超期或提前。',
                JSON.stringify({ 汇总: makeModelReminder(experiments), 记录: records }),
              )
            }
          }
          const response = object(await provider('assistant', 'chat/completions', {
            model,
            messages: [
              { role: 'system', content: instructions.join('\n') },
              ...messages,
            ],
            thinking: { type: 'disabled' },
            max_tokens: 2048,
          }))
          if (!Array.isArray(response.choices) || !response.choices.length) throw invalidResponse()
          const message = object(object(response.choices[0]).message)
          const answer: KnowledgeChatResponse = { answer: responseText(message.content, 50000), citations: [] }
          return Response.json(answer, { headers })
        }
        const document_id = input.document_id
        if (document_id !== undefined) {
          if (typeof document_id !== 'string' || !uuid.test(document_id)) throw new KnowledgeAPIError(400, 'INVALID_INPUT', '文档 ID 无效')
          const document = await client.from('knowledge_documents').select('id').eq('id', document_id).is('deleted_at', null).maybeSingle()
          if (document.error || !document.data) throw new KnowledgeAPIError(404, 'NOT_FOUND', '关联文档不存在或当前账户无权访问')
        }
        const response = object(await provider('assistant', 'chat', { messages, document_id, owner_id: ownerId }))
        if (!Array.isArray(response.citations) || response.citations.length > 20) throw invalidResponse()
        const answer: KnowledgeChatResponse = { answer: responseText(response.answer, 50000), citations: response.citations.map(citation) }
        result = answer
      }
    }
    return Response.json(result, { headers })
  } catch (cause) {
    const error = cause instanceof KnowledgeAPIError ? cause : new KnowledgeAPIError(503, 'SERVICE_UNAVAILABLE', '知识服务暂时不可用，请稍后重试')
    return Response.json({ error: { code: error.code, message: error.message }, request_id: requestId }, { status: error.status, headers })
  }
}
