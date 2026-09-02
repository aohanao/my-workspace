'use client'

import { useState, useEffect } from 'react'
import { Cloud, X, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ExternalLink } from 'lucide-react'
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
  getSupabase,
} from '@/lib/supabase'
import { StorageService } from '@/lib/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function CloudConfigModal({ isOpen, onClose }: Props) {
  const [url, setUrl] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [isFromEnv, setIsFromEnv] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    if (isOpen) {
      const creds = getSupabaseCredentials()
      setUrl(creds.url)
      setAnonKey(creds.anonKey)
      setIsFromEnv(creds.isFromEnv)
      setTestResult(null)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || !anonKey.trim()) {
      alert('请填写完整的 Project URL 与 anon key')
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      // 临时写入并实例化测试
      saveCustomSupabaseCredentials(url.trim(), anonKey.trim())
      const client = getSupabase()
      if (!client) {
        throw new Error('Supabase 客户端初始化失败')
      }

      // 测试查询表是否存在且可读写
      const { data, error } = await client.from('workspace_storage').select('key').limit(1)
      if (error) {
        throw new Error(error.message)
      }

      setTestResult({
        success: true,
        message: '连接成功！数据库表已就绪，正在同步数据...',
      })

      // 立即触发拉取与同步
      await StorageService.initCloudSync()

      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `连接失败: ${err.message || '请检查 URL、Key 及 SQL 建表是否已执行'}`,
      })
    } finally {
      setTesting(false)
    }
  }

  const handleClear = () => {
    saveCustomSupabaseCredentials('', '')
    setUrl('')
    setAnonKey('')
    setIsFromEnv(false)
    setTestResult({ success: true, message: '已切换为纯本地模式' })
    StorageService.getSyncStatus()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* 头部 */}
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Supabase 云端数据库配置</h3>
              <p className="text-[11px] text-zinc-400">支持网页端直接配置或通过 Vercel 环境变量自动注入</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <form onSubmit={handleTestAndSave} className="p-5 space-y-4 text-xs">
          {isFromEnv && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>已检测到 Vercel 环境变量配置，正在使用生产云数据库。</span>
            </div>
          )}

          <div>
            <label className="text-zinc-300 font-medium block mb-1">
              Supabase Project URL：
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xxxxxxxx.supabase.co"
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-medium block mb-1">
              Supabase anon public key：
            </label>
            <textarea
              rows={3}
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 font-mono text-xs resize-none"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="leading-relaxed">{testResult.message}</span>
            </div>
          )}

          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              重置为本地模式
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={testing}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl linear-btn-primary font-medium disabled:opacity-50"
              >
                {testing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{testing ? '测试连接中...' : '测试并保存连接'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
