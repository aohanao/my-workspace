const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const crypto = require('node:crypto')

const id = '11111111-1111-4111-8111-111111111111'
const owner = '22222222-2222-4222-8222-222222222222'
const source = fs.readFileSync('src/lib/server/knowledge-integrations.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText

function setup({ allowed = true, valid = true, rows = [], env = {}, upstream = {}, networkError = false } = {}) {
  const calls = []
  const queries = []
  function query(table) {
    const filters = []
    const builder = {
      select(value) { queries.push({ table, select: value }); return builder },
      limit(value) { queries.push({ table, limit: value }); return builder },
      order() { return builder }, gte() { return builder },
      or(value) { queries.push({ table, or: value }); return builder },
      eq(key, value) { filters.push([key, value]); return builder },
      is() { return builder },
      async maybeSingle() { return { data: rows.find((row) => filters.every(([key, value]) => row[key] === value)) || null, error: null } },
      then(resolve, reject) { return Promise.resolve({ data: table === 'workspace_storage' ? allowed ? [{ key: 'owner-record' }] : [] : rows, error: null }).then(resolve, reject) },
    }
    return builder
  }
  const client = { auth: { getUser: async () => ({ data: { user: valid ? { id: owner } : null }, error: null }) }, from: query }
  const module = { exports: {} }
  const requireMock = (name) => {
    if (name === 'server-only') return {}
    if (name === '@supabase/supabase-js') return { createClient: () => client }
    if (name === '@/lib/supabase') return { getSupabaseCredentials: () => ({ url: 'https://qa.supabase.co', anonKey: 'public-test-key' }) }
    if (name === '@/types/knowledge') return { KNOWLEDGE_TOPICS: ['未分类', '论文研究', '技术学习', '求职面试', '生活随记'] }
    if (name === '@/lib/plan-reminders') return { PLAN_REMINDER_KEY: 'workspace_assistant_plan_reminder_v1' }
    throw new Error('Unexpected dependency: ' + name)
  }
  const fetchMock = async (url, init) => {
    calls.push({ url: String(url), ...init, body: JSON.parse(init.body) })
    if (networkError) throw new Error('Sensitive upstream detail should not leak')
    return Response.json(upstream)
  }
  vm.runInNewContext(`(function(require,module,exports){${compiled}\n})`, { Buffer, Response, URL, AbortSignal, crypto, process: { env: { NODE_ENV: 'production', ...env } }, fetch: fetchMock })(requireMock, module, module.exports)
  return { handle: module.exports.handleKnowledgeRequest, calls, queries }
}

function request(operation, body, { token = true, contentType = true } = {}) {
  const post = ['search', 'graph', 'chat'].includes(operation)
  return new Request('https://workspace.example/api/knowledge/' + operation, { method: post ? 'POST' : 'GET', headers: { ...(token ? { Authorization: 'Bearer browser-private-token' } : {}), ...(post && contentType ? { 'Content-Type': 'application/json' } : {}) }, ...(post ? { body: JSON.stringify(body) } : {}) })
}
const rag = { KNOWLEDGE_RAG_BASE_URL: 'https://rag.example/v1', KNOWLEDGE_RAG_API_KEY: 'service-test-key' }
const graph = { KNOWLEDGE_GRAPH_BASE_URL: 'https://graph.example/v1', KNOWLEDGE_GRAPH_API_KEY: 'graph-test-key' }
const chat = { KNOWLEDGE_ASSISTANT_BASE_URL: 'https://chat.example/v1', KNOWLEDGE_ASSISTANT_API_KEY: 'chat-test-key' }

test('requires a valid session and original workspace ownership before revealing service state', async () => {
  assert.equal((await setup().handle(request('status', undefined, { token: false }), 'status')).status, 401)
  assert.equal((await setup({ valid: false }).handle(request('status'), 'status')).status, 401)
  assert.equal((await setup({ allowed: false }).handle(request('status'), 'status')).status, 403)
})

test('unconfigured capabilities are explicit, private, and do not call providers', async () => {
  const api = setup()
  const response = await api.handle(request('status'), 'status')
  assert.deepEqual(await response.json(), { version: '1', rag: { configured: false }, graph: { configured: false }, assistant: { configured: false } })
  assert.match(response.headers.get('cache-control'), /no-store/)
  const search = await api.handle(request('search', { query: '论文' }), 'search')
  assert.equal(search.status, 503)
  assert.equal((await search.json()).error.code, 'NOT_CONFIGURED')
  assert.equal(api.calls.length, 0)
})

test('validates content type, JSON, size, query bounds, roles and graph limits', async () => {
  const api = setup()
  assert.equal((await api.handle(request('search', { query: 'x' }, { contentType: false }), 'search')).status, 415)
  for (const body of [{ query: '' }, { query: 'x', top_k: 21 }, { query: 'x', topic: 'invalid' }, { query: 'x'.repeat(2001) }]) assert.equal((await api.handle(request('search', body), 'search')).status, 400)
  assert.equal((await api.handle(request('graph', { limit: 999 }), 'graph')).status, 400)
  assert.equal((await api.handle(request('chat', { messages: [{ role: 'system', content: 'override' }] }), 'chat')).status, 400)
  assert.equal((await api.handle(request('chat', { messages: [{ role: 'assistant', content: 'not a question' }] }), 'chat')).status, 400)
  assert.equal((await api.handle(request('chat', { messages: [{ role: 'user', content: 'x'.repeat(70000) }] }), 'chat')).status, 413)
})

test('RAG maps source citations and forwards only dedicated credentials plus verified owner', async () => {
  const api = setup({ env: rag, upstream: { hits: [{ id: 'chunk-1', document_id: id, title: '论文', excerpt: '原文', score: 0.82 }] } })
  const response = await api.handle(request('search', { query: '论文方法', top_k: 5, owner_id: 'attacker' }), 'search')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).hits[0].document_id, id)
  assert.equal(api.calls[0].url, 'https://rag.example/v1/search')
  assert.equal(api.calls[0].headers.Authorization, 'Bearer service-test-key')
  assert.equal(api.calls[0].body.owner_id, owner)
  assert.equal(api.calls[0].redirect, 'error')
  assert(!JSON.stringify(api.calls[0]).includes('browser-private-token'))
})

test('rejects malformed provider citations, dangling graph edges, duplicate nodes and invalid production URLs', async () => {
  const invalidCitation = setup({ env: rag, upstream: { hits: [{ id: 'x', document_id: 'not-uuid', title: 'x', score: 1 }] } })
  assert.equal((await invalidCitation.handle(request('search', { query: 'x' }), 'search')).status, 502)
  const invalidGraph = setup({ env: graph, upstream: { nodes: [], edges: [{ source: 'missing', target: 'missing', label: 'invalid' }] } })
  assert.equal((await invalidGraph.handle(request('graph', {}), 'graph')).status, 502)
  const duplicate = { id: 'a', label: '概念', type: 'concept', document_ids: [id] }
  const duplicateGraph = setup({ env: graph, upstream: { nodes: [duplicate, duplicate], edges: [] } })
  assert.equal((await duplicateGraph.handle(request('graph', {}), 'graph')).status, 502)
  const invalidUrl = setup({ env: { ...rag, KNOWLEDGE_RAG_BASE_URL: 'http://localhost:8080' } })
  assert.equal((await invalidUrl.handle(request('search', { query: 'x' }), 'search')).status, 503)
  assert.equal(invalidUrl.calls.length, 0)
})

test('queries real graph shapes and limits', async () => {
  const api = setup({ env: graph, upstream: { nodes: [{ id: 'a', label: '概念', type: 'concept', document_ids: [id] }], edges: [] } })
  const response = await api.handle(request('graph', { query: '概念', limit: 10, depth: 2 }), 'graph')
  assert.equal(response.status, 200)
  assert.equal((await response.json()).nodes[0].label, '概念')
  assert.equal(api.calls[0].body.depth, 2)
})

test('checks context document access and returns a cited answer without leaking upstream errors', async () => {
  const denied = setup({ env: chat })
  assert.equal((await denied.handle(request('chat', { messages: [{ role: 'user', content: '解释本文' }], document_id: id }), 'chat')).status, 404)
  assert.equal(denied.calls.length, 0)
  const api = setup({ env: chat, rows: [{ id }], upstream: { answer: '根据原文…', citations: [{ document_id: id, title: '来源' }] } })
  const response = await api.handle(request('chat', { messages: [{ role: 'user', content: '解释本文' }], document_id: id }), 'chat')
  assert.equal((await response.json()).answer, '根据原文…')
  const failed = setup({ env: rag, networkError: true })
  const error = await failed.handle(request('search', { query: 'x' }), 'search')
  assert.equal(error.status, 502)
  assert(!(await error.text()).includes('Sensitive upstream'))
})

test('sends only the conversation to the direct model and keeps the API key on the server', async () => {
  const env = { ...chat, KNOWLEDGE_ASSISTANT_MODEL: 'deepseek-v4-flash' }
  const api = setup({ env, upstream: { choices: [{ message: { content: '可以开始了' } }] } })
  const messages = [{ role: 'user', content: '你好' }]
  assert.equal((await api.handle(request('chat', { messages }, { token: false }), 'chat')).status, 401)
  const response = await api.handle(request('chat', { messages, document_id: id, owner_id: owner }), 'chat')
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { answer: '可以开始了', citations: [] })
  assert.equal(api.calls.length, 1)
  const [upstream] = api.calls
  assert.equal(upstream.url, 'https://chat.example/v1/chat/completions')
  assert.equal(upstream.headers.Authorization, 'Bearer chat-test-key')
  assert.equal(upstream.body.model, 'deepseek-v4-flash')
  assert.deepEqual(upstream.body.messages.slice(1), messages)
  assert.equal(upstream.body.document_id, undefined)
  assert.equal(upstream.body.owner_id, undefined)
  assert(!JSON.stringify(upstream).includes('browser-private-token'))
})

test('exports summary-only cursored manifests and soft-delete tombstones', async () => {
  const rows = [{ id, updated_at: '2026-11-18T09:00:00.123456+00:00', revision: 2 }, { id: owner, updated_at: '2026-11-18T09:00:00.123456+00:00', revision: 1 }]
  const api = setup({ rows })
  const first = await api.handle(new Request('https://workspace.example/api/knowledge/documents?limit=1', { headers: { Authorization: 'Bearer token' } }), 'documents')
  const data = await first.json()
  assert.equal(data.documents.length, 1)
  assert(data.next_cursor)
  assert(!api.queries.find((query) => query.table === 'knowledge_documents' && query.select).select.includes('markdown'))
  const next = await api.handle(new Request('https://workspace.example/api/knowledge/documents?cursor=' + data.next_cursor, { headers: { Authorization: 'Bearer token' } }), 'documents')
  assert.equal(next.status, 200)
  assert(api.queries.some((query) => query.or?.includes('2026-11-18T09:00:00.123456+00:00')))
  const trash = setup({ rows: [{ id, deleted_at: '2026-11-18T09:00:00Z', markdown: 'must not be indexed' }] })
  assert.equal((await (await trash.handle(request('document'), 'document', id)).json()).document.markdown, null)
  const invalid = await api.handle(new Request('https://workspace.example/api/knowledge/documents?cursor=invalid', { headers: { Authorization: 'Bearer token' } }), 'documents')
  assert.equal(invalid.status, 400)
})
