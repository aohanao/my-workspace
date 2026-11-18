'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, FileSearch, FileText, Layers, Loader2, Search } from 'lucide-react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeSearchResponse } from '@/types/knowledge-integrations'
import { useKnowledgeIntegrations } from './use-knowledge-integrations'

export function KnowledgeSearch({ initialQuery = '' }: { initialQuery?: string }) {
  const { status, error: statusError, retry } = useKnowledgeIntegrations()
  const [query, setQuery] = useState(initialQuery)
  const [topic, setTopic] = useState('')
  const [topK, setTopK] = useState(8)
  const [result, setResult] = useState<KnowledgeSearchResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const controller = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  useEffect(() => () => controller.current?.abort(), [])

  const search = async () => {
    if (!query.trim() || !status?.rag.configured || busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); controller.current = new AbortController()
    try { setResult(await KnowledgeAPI.search({ query: query.trim(), top_k: topK, ...(topic ? { topic } : {}) }, controller.current.signal)) }
    catch (cause) { if (!controller.current.signal.aborted) setError(cause instanceof Error ? cause.message : '检索失败，请重试') }
    finally { busyRef.current = false; setBusy(false) }
  }

  return <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
    <div className="min-w-0 space-y-4">
      <section className="rounded-3xl border border-cyan-100/15 bg-gradient-to-br from-[#142735] to-[#111722] p-5 sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] tracking-[0.18em] text-cyan-100/50">RETRIEVAL WORKSPACE</p><h2 className="mb-2 mt-2 text-xl font-semibold">RAG 检索工作区</h2><p className="text-xs leading-6 text-zinc-500">用问题找到相关知识，让每个结果都能回到原文。</p></div><span className="shrink-0 rounded-full border border-white/10 px-2.5 py-1.5 text-[10px] text-zinc-500">{status ? status.rag.configured ? '服务已配置' : '服务待接入' : '状态待确认'}</span></div>
        <form onSubmit={(event) => { event.preventDefault(); search() }}><label className="block rounded-2xl border border-white/10 bg-black/25 p-3"><span className="sr-only">RAG 检索问题</span><textarea value={query} maxLength={2000} onChange={(event) => setQuery(event.target.value)} placeholder="例如：找出笔记中与围岩分级、支护参数预测有关的方法和实验…" rows={3} className="w-full resize-none bg-transparent text-sm leading-7 outline-none placeholder:text-zinc-600" /></label><div className="mt-3 flex flex-wrap items-center gap-2"><select aria-label="RAG 知识主题" value={topic} onChange={(event) => setTopic(event.target.value)} className="rounded-xl border border-white/10 bg-[#111a27] px-3 py-2.5 text-xs text-zinc-400"><option value="">全部主题</option>{KNOWLEDGE_TOPICS.map((item) => <option key={item}>{item}</option>)}</select><select aria-label="返回片段数量" value={topK} onChange={(event) => setTopK(Number(event.target.value))} className="rounded-xl border border-white/10 bg-[#111a27] px-3 py-2.5 text-xs text-zinc-400">{[5, 8, 12, 20].map((value) => <option key={value} value={value}>{value} 条结果</option>)}</select><button type="submit" disabled={!status?.rag.configured || !query.trim() || busy} className="ml-auto flex items-center gap-2 rounded-xl bg-cyan-100 px-4 py-2.5 text-xs font-semibold text-[#10212c] disabled:opacity-30">{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}检索知识</button></div></form>
      </section>
      {(error || statusError) && <p role="alert" className="text-xs leading-6 text-amber-100">{error || statusError}{statusError && <button onClick={retry} className="ml-2 underline">重试连接</button>}</p>}
      <section aria-label="RAG 检索结果" className="overflow-hidden rounded-3xl border border-white/10 bg-[#0e141f]/70"><div className="flex items-center justify-between border-b border-white/5 p-5"><h3 className="flex items-center gap-2 text-sm"><Layers className="h-4 w-4 text-cyan-200/60" />相关片段与来源</h3><span className="text-[10px] text-zinc-600">{busy ? '正在检索…' : result ? `${result.hits.length} 条结果` : '等待检索'}</span></div>
        {busy ? <p role="status" className="flex justify-center gap-2 py-16 text-xs text-cyan-200"><Loader2 className="h-4 w-4 animate-spin" />正在检索相关资料…</p> : result ? <div className="space-y-3 p-4">{result.hits.length === 0 ? <p className="py-12 text-center text-xs text-zinc-500">没有找到相关片段，尝试更换问题或扩大主题范围。</p> : <><p className="mb-3 break-words text-[11px] text-zinc-500">检索问题：{result.query}</p>{result.hits.map((hit, index) => <article key={`${hit.id}:${index}`} className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><Link href={`/knowledge/documents/${hit.document_id}`} className="flex min-w-0 items-start gap-2 text-sm text-cyan-100 hover:underline"><FileText className="mt-0.5 h-4 w-4 shrink-0" /><span className="break-words">{hit.title}</span></Link><span className="shrink-0 font-mono text-[10px] text-zinc-600">得分 {hit.score.toFixed(3)}</span></div>{hit.section && <p className="mt-2 text-[10px] text-zinc-500">{hit.section}</p>}<p className="my-4 whitespace-pre-wrap break-words text-xs leading-7 text-zinc-400">{hit.excerpt || '该片段暂无摘要，请打开原文查看。'}</p><Link href={`/knowledge/documents/${hit.document_id}`} className="inline-flex items-center gap-1 text-[11px] text-cyan-100/70">查看原文<ArrowUpRight className="h-3 w-3" /></Link></article>)}</>}</div> : <div className="flex min-h-[290px] flex-col items-center justify-center px-6 py-10 text-center"><FileSearch className="mb-4 h-10 w-10 text-cyan-200/25" /><h4 className="text-sm text-zinc-300">{status?.rag.configured ? '描述一个问题，开始探索相关知识' : '为你的 RAG 检索系统留好工作区'}</h4><p className="mt-3 max-w-md text-xs leading-7 text-zinc-600">{status?.rag.configured ? '检索结果会展示原文片段、章节及出处。' : '服务接入后，真实检索结果会在这里呈现。现在可以先在文档库整理和查找资料。'}</p><Link href="/knowledge/documents" className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs text-zinc-400">打开文档库<ArrowRight className="h-3.5 w-3.5" /></Link></div>}
      </section>
    </div>
    <aside className="space-y-4"><div className="rounded-3xl border border-white/[0.07] bg-[#101722]/80 p-5"><h3 className="mb-5 text-xs font-medium text-zinc-300">从问题回到知识</h3><ol className="space-y-6">{[{ title: '描述问题', detail: '用关键词或自然语言说明需求' }, { title: '匹配资料', detail: '在你的知识库里找到相关内容' }, { title: '阅读片段', detail: '查看与问题相关的原始内容' }, { title: '追溯原文', detail: '回到文档继续阅读和整理' }].map((step, index) => <li key={step.title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-cyan-100/10 text-[10px] text-cyan-100/60">{index + 1}</span><div><p className="text-xs text-zinc-400">{step.title}</p><p className="mt-1 text-[10px] leading-6 text-zinc-600">{step.detail}</p></div></li>)}</ol></div><Link href="/knowledge/graph" className="flex items-center justify-between rounded-2xl border border-violet-100/10 bg-violet-100/[0.03] p-4 text-xs text-violet-200/70">换个角度，从图谱探索知识<ArrowUpRight className="h-3.5 w-3.5" /></Link></aside>
  </div>
}
