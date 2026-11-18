'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowUpRight, BookOpen, Code2, FileText, FolderOpen, History, Layers, Loader2, Network, Search, Sparkles, Star } from 'lucide-react'
import { KnowledgeService } from '@/lib/knowledge'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeDocumentSummary } from '@/types/knowledge'
import { useKnowledgeIntegrations } from './use-knowledge-integrations'

export function KnowledgeOverview() {
  const router = useRouter()
  const [recent, setRecent] = useState<KnowledgeDocumentSummary[]>([])
  const [count, setCount] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<number | null>(null)
  const [review, setReview] = useState({ due: 0, cards: 0 })
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'documents' | 'rag'>('documents')
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const { status, error: statusError, retry } = useKnowledgeIntegrations()

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    Promise.all([KnowledgeService.list({ signal: controller.signal }), KnowledgeService.favoritesCount(controller.signal)]).then(([result, favoriteCount]) => {
      if (!controller.signal.aborted) { setRecent(result.documents.slice(0, 6)); setCount(result.count); setFavorites(favoriteCount) }
    }).catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message) })
    const updateReview = () => setReview({ due: StorageService.getLeetCode().filter((item) => item.nextReview <= getLocalDateKey()).length, cards: StorageService.getFlashcards().length })
    updateReview(); window.addEventListener('workspace-data-updated', updateReview)
    return () => { controller.abort(); window.removeEventListener('workspace-data-updated', updateReview) }
  }, [reload])

  return <div className="space-y-5">
    <section className="relative overflow-hidden rounded-3xl border border-cyan-100/10 bg-gradient-to-br from-[#132737] via-[#101b2c] to-[#111421] p-5 sm:p-7">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full border border-cyan-100/5 shadow-[0_0_100px_rgba(103,232,249,0.04)]" />
      <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div><p className="mb-2 flex items-center gap-2 text-[10px] tracking-[0.2em] text-cyan-100/60"><span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />KNOWLEDGE WORKSPACE</p><h2 className="text-2xl font-semibold leading-relaxed tracking-tight sm:text-3xl">让零散的知识，连接成体系。</h2><p className="mt-2 text-xs leading-6 text-zinc-400">以 Markdown 为积累，连接检索、图谱和日常学习。</p></div><Link href="/knowledge/documents" className="flex self-start items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs text-zinc-200 hover:bg-white/10"><FileText className="h-4 w-4" />管理与导入资料<ArrowUpRight className="h-3.5 w-3.5" /></Link></div>
      <form className="relative mt-6 max-w-3xl rounded-2xl border border-white/15 bg-black/25 p-2" onSubmit={(event) => { event.preventDefault(); router.push(`${mode === 'documents' ? '/knowledge/documents' : '/knowledge/search'}?q=${encodeURIComponent(query.trim())}`) }}>
        <div className="mb-2 flex gap-1 px-1">{([{ key: 'documents', title: '文档检索' }, { key: 'rag', title: 'RAG 语义检索' }] as const).map((item) => <button key={item.key} type="button" aria-pressed={mode === item.key} onClick={() => setMode(item.key)} className={`rounded-lg px-3 py-1.5 text-[11px] ${mode === item.key ? 'bg-white/10 text-cyan-100' : 'text-zinc-600 hover:text-zinc-300'}`}>{item.title}</button>)}</div>
        <div className="flex items-center gap-2"><Search className="ml-2 h-4 w-4 shrink-0 text-cyan-100/50" /><input aria-label="搜索个人知识库" maxLength={2000} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={mode === 'documents' ? '查找标题、正文，或记忆中的一个关键词…' : '用自然语言描述你想查找的知识…'} className="min-w-0 flex-1 bg-transparent py-2.5 text-xs outline-none placeholder:text-zinc-600 sm:text-sm" /><button aria-label="开始检索" type="submit" className="rounded-xl bg-cyan-100 p-2.5 text-[#12202b] hover:bg-white"><ArrowRight className="h-4 w-4" /></button></div>
      </form>
    </section>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[
      { label: '知识文档', value: count, sub: '原文与资料', icon: FileText, color: 'text-cyan-200' },
      { label: '收藏资料', value: favorites, sub: '值得反复阅读', icon: Star, color: 'text-amber-200' },
      { label: '今日算法复习', value: review.due, sub: '保持知识熟悉度', icon: Code2, color: 'text-emerald-200' },
      { label: '知识记忆卡', value: review.cards, sub: '积累与复盘', icon: Layers, color: 'text-violet-200' },
    ].map(({ label, value, sub, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-white/[0.07] bg-[#101620]/70 p-4"><div className="flex items-center justify-between gap-2"><span className="text-[11px] text-zinc-500">{label}</span><Icon className={`h-4 w-4 ${color}`} /></div><p className="my-2 font-mono text-2xl font-semibold text-zinc-100">{value === null ? '—' : value}</p><p className="text-[10px] text-zinc-600">{sub}</p></div>)}</div>
    {error && <p role="alert" className="text-xs text-amber-100">{error}<button onClick={() => setReload((value) => value + 1)} className="ml-2 underline">重新加载资料</button></p>}

    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-5">
        <section className="rounded-3xl border border-white/[0.07] bg-[#0e141e]/80 p-5"><div className="mb-4 flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><FolderOpen className="h-4 w-4 text-cyan-200/80" />按主题探索</h3><span className="text-[10px] text-zinc-600">从资料走向知识</span></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{KNOWLEDGE_TOPICS.filter((topic) => topic !== '未分类').map((topic, index) => <Link key={topic} href={`/knowledge/documents?topic=${encodeURIComponent(topic)}`} className="group flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-3.5 text-xs text-zinc-300 hover:border-cyan-100/20 hover:bg-white/5"><span className="font-mono text-[10px] text-zinc-600">0{index + 1}</span>{topic}<ArrowUpRight className="ml-auto h-3 w-3 text-zinc-700 group-hover:text-cyan-200" /></Link>)}<Link href="/knowledge/documents?topic=未分类" className="flex items-center gap-2.5 rounded-xl border border-dashed border-white/10 px-3 py-3.5 text-xs text-zinc-500"><FolderOpen className="h-3.5 w-3.5" />待整理资料</Link></div></section>
        <section className="overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0e141e]/80"><div className="flex items-center justify-between border-b border-white/5 p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><History className="h-4 w-4 text-zinc-400" />最近更新</h3><Link href="/knowledge/documents" className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-cyan-200">全部文档<ArrowUpRight className="h-3 w-3" /></Link></div>{count === null && !error ? <div className="flex justify-center gap-2 py-12 text-xs text-zinc-600"><Loader2 className="h-4 w-4 animate-spin" />正在读取资料…</div> : recent.length === 0 ? <div className="px-6 py-12 text-center"><BookOpen className="mx-auto mb-3 h-7 w-7 text-zinc-600" /><p className="text-sm text-zinc-400">从一篇笔记开始构建你的知识空间</p><Link href="/knowledge/documents" className="mt-3 inline-flex items-center gap-1 text-xs text-cyan-200/80">导入 Markdown<ArrowRight className="h-3 w-3" /></Link></div> : <div className="divide-y divide-white/5">{recent.map((document) => <Link key={document.id} href={`/knowledge/documents/${document.id}`} className="group flex items-center gap-3 px-5 py-4 hover:bg-white/[0.025]"><span className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-zinc-400"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><h4 className="truncate text-xs font-medium text-zinc-200 group-hover:text-cyan-100">{document.title}</h4><p className="mt-1.5 truncate text-[10px] text-zinc-600">{document.topic} · {document.source_name || '工作台笔记'}</p></div><span className="hidden text-[10px] text-zinc-600 sm:block">{new Date(document.updated_at).toLocaleDateString('zh-CN')}</span><ArrowUpRight className="h-3 w-3 shrink-0 text-zinc-600" /></Link>)}</div>}</section>
      </div>

      <div className="min-w-0 space-y-5">
        <section className="overflow-hidden rounded-3xl border border-violet-200/10 bg-gradient-to-b from-[#191b30] to-[#10141f]"><div className="flex items-center justify-between p-5"><h3 className="flex items-center gap-2 text-sm font-semibold"><Network className="h-4 w-4 text-violet-200" />知识图谱</h3><span className="rounded-full border border-white/10 px-2 py-1 text-[9px] text-zinc-500">{status ? status.graph.configured ? '已配置' : '待接入' : '状态待确认'}</span></div><div className="relative mx-5 flex min-h-[190px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-violet-200/15 bg-[radial-gradient(circle_at_1px_1px,rgba(196,181,253,0.08)_1px,transparent_0)] [background-size:18px_18px] p-5 text-center"><span className="mb-3 rounded-full border border-violet-100/10 bg-violet-200/5 p-4"><Network className="h-7 w-7 text-violet-200/50" /></span><p className="text-xs text-zinc-400">探索概念、方法与文献之间的关系</p><p className="mt-2 text-[10px] leading-5 text-zinc-600">{status?.graph.configured ? '打开图谱工作区，查看知识关联与来源' : '接入图谱服务后，在此进入你的知识网络'}</p></div><Link href="/knowledge/graph" className="m-5 flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs text-violet-100/80 hover:bg-white/10">打开图谱工作区<ArrowUpRight className="h-3.5 w-3.5" /></Link></section>
        <section className="rounded-3xl border border-cyan-200/10 bg-[#101d27]/60 p-5"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><Search className="h-4 w-4 text-cyan-200" />RAG 检索</h3><span className="text-[9px] text-zinc-500">{status ? status.rag.configured ? '已配置' : '待接入' : '状态待确认'}</span></div><p className="mb-4 mt-3 text-xs leading-6 text-zinc-500">用自然语言查找相关内容，保留原文片段、章节和文档出处。</p><Link href="/knowledge/search" className="flex items-center justify-between rounded-xl bg-cyan-100/5 px-3 py-2.5 text-xs text-cyan-100/80">进入检索工作区<ArrowRight className="h-3.5 w-3.5" /></Link></section>
        <Link href="/knowledge/review" className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-[#10151f]/80 p-4"><span className="rounded-xl bg-emerald-100/5 p-2.5 text-emerald-200/80"><Sparkles className="h-4 w-4" /></span><div className="flex-1"><p className="text-xs font-medium text-zinc-300">知识与算法复盘</p><p className="mt-1 text-[10px] text-zinc-600">{review.due > 0 ? `今天有 ${review.due} 道算法题等待复习` : '回顾题解与记忆卡，巩固已有知识'}</p></div><ArrowUpRight className="h-3.5 w-3.5 text-zinc-600" /></Link>
      </div>
    </div>
    {statusError && <p role="alert" className="text-xs text-zinc-500">服务状态暂时无法读取。<button onClick={retry} className="ml-1 underline">重试</button></p>}
  </div>
}
