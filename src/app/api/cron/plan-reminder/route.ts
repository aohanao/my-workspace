import { timingSafeEqual } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { chinaDate, makePlanReminder, PLAN_REMINDER_KEY, PLAN_TASKS_KEY } from '@/lib/plan-reminders'
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
    .in('key', [PLAN_TASKS_KEY, PLAN_REMINDER_KEY])
  if (error) return Response.json({ error: 'Could not read the plan' }, { status: 503 })

  const plan = data.find((row) => row.key === PLAN_TASKS_KEY)
  const stored = data.find((row) => row.key === PLAN_REMINDER_KEY)
  if (!plan?.owner_id || stored?.value?.date === chinaDate()) return Response.json({ saved: false })
  const now = new Date()
  const reminder = makePlanReminder(plan.value, now)
  if (!reminder) return Response.json({ saved: false })
  const { error: writeError } = await client.from('workspace_storage').upsert({
    key: PLAN_REMINDER_KEY, value: reminder, owner_id: plan.owner_id, updated_at: now.toISOString(),
  }, { onConflict: 'key' })
  if (writeError) return Response.json({ error: 'Could not save the daily reminder' }, { status: 503 })
  return Response.json({ saved: true })
}
