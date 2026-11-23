import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { makeModelReminder, MODEL_EXPERIMENTS_KEY, MODEL_REMINDER_KEY, readModelExperiments } from '@/lib/model-reminders'
import { chinaDate } from '@/lib/workbench-clock'
import { getSupabaseCredentials } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const supplied = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret}`)
  if (!secret || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return Response.json({ error: 'Missing Supabase server configuration' }, { status: 503 })
  const url = process.env.SUPABASE_URL || getSupabaseCredentials().url
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  const { data, error } = await client.from('workspace_storage')
    .select('key,owner_id,value')
    .in('key', [MODEL_EXPERIMENTS_KEY, MODEL_REMINDER_KEY])
  if (error) return Response.json({ error: 'Could not read model experiments' }, { status: 503 })

  const models = data.find((row) => row.key === MODEL_EXPERIMENTS_KEY)
  const stored = data.find((row) => row.key === MODEL_REMINDER_KEY)
  const now = new Date()
  if (!models?.owner_id || stored?.value?.date === chinaDate(now)) return Response.json({ saved: false })
  const reminder = makeModelReminder(readModelExperiments(models.value), now)
  if (!reminder) return Response.json({ saved: false })
  const { error: writeError } = await client.from('workspace_storage').upsert({
    key: MODEL_REMINDER_KEY, value: reminder, owner_id: models.owner_id, updated_at: now.toISOString(),
  }, { onConflict: 'key' })
  if (writeError) return Response.json({ error: 'Could not save the daily reminder' }, { status: 503 })
  return Response.json({ saved: true })
}
