import { KnowledgeReader } from '@/components/knowledge/knowledge-reader'

export default function DocumentPage({ params, searchParams }: { params: { id: string }; searchParams: { edit?: string } }) {
  return <KnowledgeReader id={params.id} initialEditing={searchParams.edit === '1'} />
}
