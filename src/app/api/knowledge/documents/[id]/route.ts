import { handleKnowledgeRequest } from '@/lib/server/knowledge-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const GET = (request: Request, { params }: { params: { id: string } }) => handleKnowledgeRequest(request, 'document', params.id)
