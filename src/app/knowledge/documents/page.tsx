import { KnowledgeLibrary } from '@/components/knowledge/knowledge-library'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeTopic } from '@/types/knowledge'

export default function DocumentsPage({ searchParams }: { searchParams: { q?: string; topic?: string } }) {
  const topic = KNOWLEDGE_TOPICS.includes(searchParams.topic as KnowledgeTopic) ? searchParams.topic as KnowledgeTopic : 'all'
  return <KnowledgeLibrary key={`${searchParams.q || ''}:${topic}`} initialSearch={searchParams.q || ''} initialTopic={topic} />
}
