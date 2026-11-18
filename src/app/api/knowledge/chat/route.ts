import { handleKnowledgeRequest } from '@/lib/server/knowledge-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60
export const POST = (request: Request) => handleKnowledgeRequest(request, 'chat')

