'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { ArrowUpRight, Bell, BookOpen, Loader2, MessageCircle, Send, Sparkles, Trash2, X } from 'lucide-react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import type { KnowledgeChatMessage, KnowledgeCitation } from '@/types/knowledge-integrations'
import { useKnowledgeIntegrations } from './use-knowledge-integrations'
import { usePlanReminder } from './use-plan-reminder'
const MarkdownReader = dynamic(() => import('./markdown-reader').then((module) => module.MarkdownReader))

export function AssistantWindow() {
  const [open, setOpen] = useState(false)
  const [remindersOpen, setRemindersOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<(KnowledgeChatMessage & { citations?: KnowledgeCitation[] })[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { status, error: statusError, retry } = useKnowledgeIntegrations(open)
  const { reminder, unread } = usePlanReminder(open && remindersOpen)
  const directModel = status?.assistant.directModel
  const configured = status?.assistant.configured
  const pathname = usePathname()
  const documentId = pathname.match(/^\/knowledge\/documents\/([0-9a-f-]{36})$/i)?.[1]
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const controller = useRef<AbortController | null>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (!open) return
    panel.current?.focus()
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !event.defaultPrevented) { setOpen(false); trigger.current?.focus() } }
    document.addEventListener('keydown', escape)
    return () => document.removeEventListener('keydown', escape)
  }, [open])
  useEffect(() => { if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight }, [messages, busy, open])
  useEffect(() => () => controller.current?.abort(), [])

  const send = async () => {
    if (!draft.trim() || !status?.assistant.configured || busyRef.current) return
    const next = [...messages, { role: 'user' as const, content: draft.trim() }]
    busyRef.current = true; setBusy(true); setError(''); setDraft(''); setMessages(next)
    controller.current = new AbortController()
    try {
      const history = next.slice(-6).map(({ role, content }) => ({ role, content: content.slice(0, 4000) }))
      const result = await KnowledgeAPI.chat(history, directModel ? undefined : documentId, controller.current.signal)
      setMessages([...next, { role: 'assistant', content: result.answer, citations: result.citations }])
    } catch (cause) {
      if (!controller.current.signal.aborted) { setMessages(messages); setDraft(next[next.length - 1].content); setError(cause instanceof Error ? cause.message : '发送失败，请重试') }
    } finally { busyRef.current = false; setBusy(false) }
  }

  return <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 sm:bottom-6 sm:right-6">
    {open && <section id="knowledge-assistant" ref={panel} tabIndex={-1} aria-label="AI 助手" className="absolute bottom-16 right-0 flex max-h-[calc(100dvh-7rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-3xl border border-cyan-100/20 bg-[#0c1420]/95 text-white shadow-[0_20px_90px_rgba(0,0,0,0.7)] outline-none backdrop-blur-2xl sm:w-[390px]">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 p-4"><div className="flex items-center gap-2.5"><span className="rounded-xl bg-cyan-200/10 p-2 text-cyan-100"><Sparkles className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold">AI 助手</h2><p className="mt-1 text-[10px] text-zinc-500">{configured ? directModel ? 'DeepSeek' : '知识问答' : status ? '模型待配置' : '正在连接…'}</p></div></div><div className="flex gap-1"><button disabled={busy || !messages.length} aria-label="开启新对话" onClick={() => { setMessages([]); setError('') }} className="rounded-lg p-2 text-zinc-500 hover:text-white disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button><button aria-label="收起 AI 助手" onClick={() => { setOpen(false); trigger.current?.focus() }} className="rounded-lg p-2 text-zinc-400 hover:bg-white/5"><X className="h-4 w-4" /></button></div></header>
      {configured && !directModel && <div className="flex shrink-0 items-center gap-2 border-b border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] text-zinc-500"><BookOpen className="h-3 w-3 text-cyan-200/70" />{documentId ? '当前文档' : '整个知识库'}<Link href="/knowledge/search" className="ml-auto flex items-center text-zinc-400 hover:text-cyan-200">检索工作区<ArrowUpRight className="h-3 w-3" /></Link></div>}
      {reminder && <details open={remindersOpen} onToggle={(event) => setRemindersOpen(event.currentTarget.open)} className="shrink-0 border-b border-white/10 px-4 py-2 text-xs">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-zinc-300"><Bell className="h-3.5 w-3.5 text-amber-200" />周月计划提醒{unread && <span className="h-1.5 w-1.5 rounded-full bg-amber-300" aria-label="未读" />}{reminder.notices.length > 0 && <span className="ml-auto text-amber-200">{reminder.notices.length} 项</span>}</summary>
        <div className="mt-2 max-h-24 space-y-1 overflow-y-auto break-words pl-5 text-[11px] leading-5 text-zinc-300">
          {reminder.summary && <p>{reminder.summary}</p>}
          {reminder.notices.map((notice) => <p key={notice.id}>{notice.text}</p>)}
        </div>
      </details>}
      <div ref={scroll} className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-4">
        {!messages.length && <div className="flex items-center gap-3 py-5 text-sm text-zinc-400"><MessageCircle className="h-5 w-5 text-cyan-200" />{configured ? '有什么想聊的？' : '模型接入后即可开始对话'}</div>}
        {messages.map((message, index) => <div key={index} className={message.role === 'user' ? 'ml-8 rounded-2xl bg-white/10 p-3' : 'mr-2 rounded-2xl border border-white/5 bg-black/15 p-3'}>{message.role === 'assistant' ? <MarkdownReader markdown={message.content} /> : <p className="whitespace-pre-wrap break-words text-xs leading-6 text-zinc-200">{message.content}</p>}{message.citations && message.citations.length > 0 && <div className="mt-3 space-y-1.5 border-t border-white/10 pt-2"><p className="text-[10px] text-zinc-500">参考资料</p>{message.citations.map((citation, citationIndex) => <Link key={citationIndex} href={`/knowledge/documents/${citation.document_id}`} className="block break-words text-[11px] text-cyan-200 hover:underline">[{citationIndex + 1}] {citation.title}{citation.section && ` · ${citation.section}`}</Link>)}</div>}</div>)}
        {busy && <p role="status" className="flex gap-2 text-xs text-cyan-200"><Loader2 className="h-3.5 w-3.5 animate-spin" />正在回复…</p>}
        {(error || statusError) && <div role="alert" className="text-xs leading-6 text-amber-100">{error || statusError}{statusError && <button onClick={retry} className="ml-2 underline">重试连接</button>}</div>}
      </div>
      <form className="shrink-0 border-t border-white/10 p-4" onSubmit={(event) => { event.preventDefault(); send() }}><div className="rounded-2xl border border-white/10 bg-black/20 p-3"><textarea aria-label="向 AI 助手提问" value={draft} maxLength={4000} disabled={busy} onChange={(event) => setDraft(event.target.value)} placeholder="输入消息…" rows={2} className="w-full resize-none bg-transparent text-xs leading-6 outline-none placeholder:text-zinc-600" /><div className="mt-2 flex justify-end"><button aria-label="发送给 AI 助手" disabled={!configured || !draft.trim() || busy} className="rounded-lg bg-cyan-100 p-2 text-black disabled:opacity-25"><Send className="h-3.5 w-3.5" /></button></div></div></form>
    </section>}
    <button ref={trigger} aria-label={unread ? '打开 AI 助手，有未读计划提醒' : '打开 AI 助手'} aria-expanded={open} aria-controls="knowledge-assistant" onClick={() => setOpen(!open)} className="flex h-12 items-center gap-2 rounded-full border border-cyan-100/20 bg-[#152333]/95 px-4 text-xs text-cyan-50 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl hover:border-cyan-100/50"><Sparkles className="h-4 w-4 text-cyan-100" /><span>AI 助手</span>{unread && <span className="h-2 w-2 rounded-full bg-amber-300" />}</button>
  </div>
}
