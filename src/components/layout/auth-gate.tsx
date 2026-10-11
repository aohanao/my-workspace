'use client'

import { useEffect, useState } from 'react'
import { LockKeyhole, Mail, RefreshCw } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { StorageService } from '@/lib/storage'

type AuthState = 'checking' | 'signed-out' | 'syncing' | 'ready' | 'error'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [state, setState] = useState<AuthState>('checking')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const client = getSupabase()
    if (!client) {
      setMessage('云端数据库尚未配置，无法启用账户登录。')
      setState('error')
      return
    }

    let active = true
    client.auth.getUser().then(({ data, error }) => {
      if (active) {
        setUserId(error ? null : data.user?.id ?? null)
        setAuthChecked(true)
      }
    })
    const { data: subscription } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUserId(session?.user?.id ?? null)
        setAuthChecked(true)
      }
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!authChecked) return
    if (userId === null) {
      setState('signed-out')
      return
    }

    let active = true
    setState('syncing')
    StorageService.initCloudSync().then(() => {
      if (!active) return
      if (StorageService.getSyncStatus().status === 'error') {
        setMessage('云端数据同步失败，请检查网络后重试。')
        setState('error')
      } else {
        setMessage('')
        setState('ready')
      }
    })
    return () => { active = false }
  }, [authChecked, userId, retry])

  const signIn = async (event: React.FormEvent) => {
    event.preventDefault()
    const client = getSupabase()
    if (!client) return
    setSubmitting(true)
    setMessage('')
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    if (error) setMessage('登录失败，请检查邮箱、密码或邮箱验证状态。')
    setSubmitting(false)
  }

  if (state === 'ready') return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a12] p-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#101522] p-6 sm:p-8 shadow-2xl">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">登录个人工作台</h1>
        <p className="mt-2 text-sm text-zinc-400">同一个账户可在手机和电脑上使用。</p>

        {state === 'signed-out' ? (
          <form onSubmit={signIn} className="mt-6 space-y-4">
            <label className="block text-sm text-zinc-300">
              邮箱
              <input type="email" required autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-blue-400" />
            </label>
            <label className="block text-sm text-zinc-300">
              密码
              <input type="password" required autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white outline-none focus:border-blue-400" />
            </label>
            {message && <p role="alert" className="text-sm text-rose-300">{message}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-xl bg-blue-500 px-4 py-2.5 font-semibold text-white hover:bg-blue-400 disabled:opacity-50">
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>
        ) : state === 'error' ? (
          <div className="mt-6 space-y-4">
            <p role="alert" className="text-sm text-rose-300">{message}</p>
            {userId && (
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setRetry((value) => value + 1)} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"><RefreshCw className="h-4 w-4" />重试同步</button>
                <button onClick={() => getSupabase()?.auth.signOut({ scope: 'local' })} className="rounded-xl px-4 py-2 text-sm text-zinc-300 hover:bg-white/10">退出当前设备</button>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-6 flex items-center gap-2 text-sm text-zinc-300"><RefreshCw className="h-4 w-4 animate-spin" />{state === 'syncing' ? '正在同步数据...' : '正在检查登录状态...'}</p>
        )}
        <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500"><Mail className="h-3.5 w-3.5" />仅限已创建的账户登录</p>
      </div>
    </div>
  )
}
