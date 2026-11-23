import { handleKnowledgeRequest } from '@/lib/server/knowledge-integrations'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const GET = (request: Request) => handleKnowledgeRequest(request, 'plan-reminder')
