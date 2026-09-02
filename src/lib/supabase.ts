import { createClient, SupabaseClient } from '@supabase/supabase-js'

const CUSTOM_URL_KEY = 'workspace_custom_supabase_url'
const CUSTOM_ANON_KEY = 'workspace_custom_supabase_anon_key'

export function getSupabaseCredentials(): { url: string; anonKey: string; isFromEnv: boolean } {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (envUrl && !envUrl.includes('your-project') && envKey && !envKey.includes('your-anon-key')) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), isFromEnv: true }
  }

  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(CUSTOM_URL_KEY) || ''
    const customKey = localStorage.getItem(CUSTOM_ANON_KEY) || ''
    if (customUrl.trim() && customKey.trim()) {
      return { url: customUrl.trim(), anonKey: customKey.trim(), isFromEnv: false }
    }
  }

  return { url: '', anonKey: '', isFromEnv: false }
}

export function saveCustomSupabaseCredentials(url: string, anonKey: string) {
  if (typeof window === 'undefined') return
  if (url.trim() && anonKey.trim()) {
    localStorage.setItem(CUSTOM_URL_KEY, url.trim())
    localStorage.setItem(CUSTOM_ANON_KEY, anonKey.trim())
  } else {
    localStorage.removeItem(CUSTOM_URL_KEY)
    localStorage.removeItem(CUSTOM_ANON_KEY)
  }
  // 重置单例
  supabaseInstance = null
}

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseCredentials()
  return (
    typeof url === 'string' &&
    url.trim().length > 0 &&
    !url.includes('your-project') &&
    typeof anonKey === 'string' &&
    anonKey.trim().length > 0 &&
    !anonKey.includes('your-anon-key')
  )
}

let supabaseInstance: SupabaseClient | null = null

export const getSupabase = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null
  }
  const { url, anonKey } = getSupabaseCredentials()
  if (!supabaseInstance || (supabaseInstance as any)._supabaseUrl !== url) {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    ;(supabaseInstance as any)._supabaseUrl = url
  }
  return supabaseInstance
}
