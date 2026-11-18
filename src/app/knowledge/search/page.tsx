import { KnowledgeSearch } from '@/components/knowledge/knowledge-search'

export default function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  return <KnowledgeSearch key={searchParams.q || ''} initialQuery={searchParams.q || ''} />
}
