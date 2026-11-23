export interface KnowledgeIntegrations {
  version: '1'
  rag: { configured: boolean }
  graph: { configured: boolean }
  assistant: { configured: boolean; directModel?: boolean }
}

export interface KnowledgeCitation {
  document_id: string
  title: string
  excerpt?: string
  section?: string
}

export interface KnowledgeSearchHit extends KnowledgeCitation {
  id: string
  score: number
}

export interface KnowledgeSearchRequest {
  query: string
  top_k: number
  topic?: string
}

export interface KnowledgeSearchResponse {
  query: string
  hits: KnowledgeSearchHit[]
}

export interface KnowledgeGraphNode {
  id: string
  label: string
  type: 'concept' | 'method' | 'paper' | 'project' | 'document'
  document_ids: string[]
}

export interface KnowledgeGraphResponse {
  nodes: KnowledgeGraphNode[]
  edges: { source: string; target: string; label: string }[]
}

export interface KnowledgeChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface KnowledgeChatResponse {
  answer: string
  citations: KnowledgeCitation[]
}
