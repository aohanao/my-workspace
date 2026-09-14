'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Zap,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Bot,
  Send,
  HelpCircle,
  Database,
  ArrowRight,
} from 'lucide-react'
import { StorageService } from '@/lib/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSyncTriggered?: () => void
}

export function FeishuSyncModal({ isOpen, onClose, onSyncTriggered }: Props) {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/feishu/webhook`)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleCopy = () => {
    if (!webhookUrl) return
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleManualPull = async () => {
    setIsSyncing(true)
    setSyncMessage(null)
    try {
      await StorageService.initCloudSync()
      onSyncTriggered?.()
      setSyncMessage('已成功同步云端最新数据！')
    } catch (e: any) {
      setSyncMessage(`同步失败: ${e.message || '网络异常'}`)
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#10131d] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* 头部 */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base flex items-center gap-2">
                <span>飞书多维表格 · 实时自动同步配置</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/20">
                  全自动推送
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                在飞书修改记录，网站秒级全自动同步，彻底告别手动重复上传
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Webhook 专属接收端点 */}
          <div className="p-4 rounded-xl bg-cyan-500/[0.04] border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-semibold text-xs flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-cyan-400" />
                您专属的 Webhook 实时接收端点 (URL)
              </span>
              <span className="text-[10px] text-zinc-500">已自动适配您当前域名</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full font-mono text-[11px] p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-cyan-200 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors flex items-center gap-1.5 font-medium shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? '已复制' : '复制URL'}</span>
              </button>
            </div>
          </div>

          {/* 3 步保姆级教程 */}
          <div className="space-y-3">
            <h4 className="font-semibold text-zinc-200 text-xs flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-cyan-400" />
              飞书多维表格 3 步配置指南（仅需 1 分钟，一次配置终身免传）：
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-white">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                    1
                  </span>
                  <span>打开飞书多维表格的「自动化」设置</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  在飞书多维表格右上角，找到并点击 <strong className="text-zinc-200">「自动化」</strong>（机器人图标） ➔ 点击 <strong className="text-zinc-200">「新建自动化流程」</strong>。
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-white">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                    2
                  </span>
                  <span>设置触发条件：记录更新或新增</span>
                </div>
                <p className="text-zinc-400 text-[11px] pl-7">
                  触发条件选择：<strong className="text-zinc-200">「当记录变更时」</strong>（或新增记录），选择您当前的秋招投递数据表。
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                <div className="flex items-center gap-2 font-medium text-white">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
                    3
                  </span>
                  <span>设置执行操作：发送 Webhook 请求</span>
                </div>
                <div className="text-zinc-400 text-[11px] pl-7 space-y-1">
                  <p>
                    操作选择 <strong className="text-zinc-200">「发送 Webhook 请求」</strong>（HTTP POST），将上方复制的 URL 粘贴到 <strong className="text-zinc-200">「请求地址」</strong> 中。
                  </p>
                  <p className="text-zinc-500 text-[10px]">
                    ★ 请求体直接选择「包含变更记录的所有字段」即可。点击保存并启用！
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 实时生效说明 */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                配置完成后，您在飞书每修改一条记录（包括多选状态、备注、投递时间），飞书都会毫秒级推送到网站，网页与数据库自动同步！
              </span>
            </div>

            <button
              type="button"
              onClick={handleManualPull}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 border border-white/[0.1] flex items-center gap-1.5 shrink-0 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{isSyncing ? '同步中...' : '手动刷新云端'}</span>
            </button>
          </div>

          {syncMessage && (
            <p className="text-center text-[11px] font-medium text-emerald-400 animate-in fade-in">
              {syncMessage}
            </p>
          )}
        </div>

        {/* 底部 */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>支持飞书桌面端、手机 App 及 Web 版多维表格</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
