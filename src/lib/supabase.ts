import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 默认内置云端数据库配置（梅傲寒同学的专属 Supabase 实例）
const DEFAULT_SUPABASE_URL = 'https://yepfdgxkfenuercdsvjl.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_zgY8WQh4_df9oW0cY1XK5g_STM5rAuf'

const CUSTOM_URL_KEY = 'workspace_custom_supabase_url'
const CUSTOM_ANON_KEY = 'workspace_custom_supabase_anon_key'

export function getSupabaseCredentials(): { url: string; anonKey: string; isFromEnv: boolean } {
  // 1. 优先读取自定义网页端配置
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem(CUSTOM_URL_KEY) || ''
    const customKey = localStorage.getItem(CUSTOM_ANON_KEY) || ''
    if (customUrl.trim() && customKey.trim()) {
      return { url: customUrl.trim(), anonKey: customKey.trim(), isFromEnv: false }
    }
  }

  // 2. 读取 Vercel 环境变量配置
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  if (envUrl && !envUrl.includes('your-project') && envKey && !envKey.includes('your-anon-key')) {
    return { url: envUrl.trim(), anonKey: envKey.trim(), isFromEnv: true }
  }

  // 3. 默认内置项目实例（开箱即用，免配置）
  return { url: DEFAULT_SUPABASE_URL, anonKey: DEFAULT_SUPABASE_ANON_KEY, isFromEnv: true }
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
