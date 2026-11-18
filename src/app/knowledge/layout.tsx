import { KnowledgeNavigation } from '@/components/knowledge/knowledge-navigation'

export default function KnowledgeLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-7xl space-y-5"><KnowledgeNavigation />{children}</div>
}
