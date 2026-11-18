'use client'

import { getSupabase } from './supabase'
import type { KnowledgeDocument, KnowledgeDocumentSummary, KnowledgeDraft, KnowledgeTopic } from '@/types/knowledge'

export const KNOWLEDGE_PAGE_SIZE = 20
export const MARKDOWN_MAX_BYTES = 2 * 1024 * 1024
const summaryColumns = 'id,title,topic,tags,source_kind,source_name,favorite,created_at,updated_at,deleted_at,revision'

function client() {
  const supabase = getSupabase()
  if (!supabase) throw new Error('请先连接工作台的云端数据库')
  return supabase
}

function checkError(error: { message: string; code?: string } | null) {
  if (!error) return
  if (error.code === '42P01' || error.code === 'PGRST205') throw new Error('知识库数据表尚未就绪，请稍后重试')
  throw new Error('云端读写失败，请检查网络后重试。')
}

export const KnowledgeService = {
  async favoritesCount(signal?: AbortSignal) {
    let query = client().from('knowledge_documents').select('id', { count: 'exact', head: true }).is('deleted_at', null).eq('favorite', true)
    if (signal) query = query.abortSignal(signal)
    const { count, error } = await query
    checkError(error)
    return count || 0
  },
  async list({ search = '', topic = 'all', view = 'all', page = 0, signal }: {
    search?: string; topic?: KnowledgeTopic | 'all'; view?: 'all' | 'favorites' | 'trash'; page?: number; signal?: AbortSignal
  }) {
    let query = client().from('knowledge_documents').select(summaryColumns, { count: 'exact' })
    query = view === 'trash' ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null)
    if (view === 'favorites') query = query.eq('favorite', true)
    if (topic !== 'all') query = query.eq('topic', topic)
    if (search.trim()) query = query.ilike('search_text', `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`)
    query = query.order('updated_at', { ascending: false }).order('id').range(page * KNOWLEDGE_PAGE_SIZE, (page + 1) * KNOWLEDGE_PAGE_SIZE - 1)
    if (signal) query = query.abortSignal(signal)
    const { data, count, error } = await query
    checkError(error)
    return { documents: (data || []) as KnowledgeDocumentSummary[], count: count || 0 }
  },

  async get(id: string, signal?: AbortSignal) {
    let query = client().from('knowledge_documents').select(`${summaryColumns},owner_id,markdown`).eq('id', id)
    if (signal) query = query.abortSignal(signal)
    const { data, error } = await query.single()
    checkError(error)
    return data as KnowledgeDocument
  },

  async create(draft: KnowledgeDraft) {
    validateDraft(draft)
    const { data, error } = await client().from('knowledge_documents').insert(draft).select(`${summaryColumns},owner_id,markdown`).single()
    checkError(error)
    return data as KnowledgeDocument
  },

  async update(document: Pick<KnowledgeDocument, 'id' | 'revision'>, changes: Partial<KnowledgeDraft & { favorite: boolean; deleted_at: string | null }>) {
    const { data, error } = await client().from('knowledge_documents')
      .update({ ...changes, revision: document.revision + 1, updated_at: new Date().toISOString() })
      .eq('id', document.id).eq('revision', document.revision).select(`${summaryColumns},owner_id,markdown`).maybeSingle()
    checkError(error)
    if (!data) throw new Error('这篇文档已在其他页面或设备修改。请先导出当前内容，再重新打开最新版本。')
    return data as KnowledgeDocument
  },
}

export function validateDraft(draft: KnowledgeDraft) {
  if (!draft.title.trim() || draft.title.length > 300) throw new Error('请填写标题（最多 300 字）')
  if (new TextEncoder().encode(draft.markdown).length > MARKDOWN_MAX_BYTES) throw new Error('单篇 Markdown 暂支持最多 2 MB，请拆分后导入')
  if (draft.tags.length > 32) throw new Error('每篇文档最多添加 32 个标签')
}

export function draftFromMarkdown(name: string, content: string): KnowledgeDraft {
  const markdown = content.replace(/^\uFEFF/, '')
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim()
  return { title: (heading || name.replace(/\.(md|markdown)$/i, '')).slice(0, 300), markdown, topic: '未分类', tags: [], source_kind: 'markdown', source_name: name.slice(0, 512) }
}

export function downloadMarkdown(title: string, markdown: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${title.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim() || '未命名文档'}.md`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
