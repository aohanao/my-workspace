export const KNOWLEDGE_TOPICS = ['未分类', '论文研究', '技术学习', '求职面试', '生活随记'] as const
export type KnowledgeTopic = typeof KNOWLEDGE_TOPICS[number]
export type KnowledgeSource = 'note' | 'markdown' | 'pdf-markdown'

export interface KnowledgeDocumentSummary {
  id: string
  title: string
  topic: KnowledgeTopic
  tags: string[]
  source_kind: KnowledgeSource
  source_name: string
  favorite: boolean
  created_at: string
  updated_at: string
  deleted_at: string | null
  revision: number
}

export interface KnowledgeDocument extends KnowledgeDocumentSummary {
  owner_id: string
  markdown: string
}

export type KnowledgeDraft = Pick<KnowledgeDocument, 'title' | 'topic' | 'tags' | 'markdown' | 'source_kind' | 'source_name'>
