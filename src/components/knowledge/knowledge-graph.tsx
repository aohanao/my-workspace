'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Focus, Loader2, Network, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { KnowledgeAPI } from '@/lib/knowledge-api'
import type { KnowledgeGraphResponse } from '@/types/knowledge-integrations'
import { useKnowledgeIntegrations } from './use-knowledge-integrations'

const types = { concept: { label: '概念', color: '#a5f3fc' }, method: { label: '方法', color: '#a7f3d0' }, paper: { label: '文献', color: '#ddd6fe' }, project: { label: '项目', color: '#fde68a' }, document: { label: '文档', color: '#94a3b8' } }

export function KnowledgeGraph() {
  const { status, error: statusError, retry } = useKnowledgeIntegrations()
  const [query, setQuery] = useState('')
  const [graph, setGraph] = useState<KnowledgeGraphResponse | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(1)
  const controller = useRef<AbortController | null>(null)
  const busyRef = useRef(false)
  const node = graph?.nodes.find((item) => item.id === selected)
  const positioned = graph?.nodes.map((item, index, all) => {
    const radius = all.length === 1 ? 0 : Math.sqrt(index / (all.length - 1)) * 245
    const angle = index * 2.3999632297
    return { ...item, x: 500 + Math.cos(angle) * radius * 1.55, y: 295 + Math.sin(angle) * radius }
  }) || []
  const positions = new Map(positioned.map((item) => [item.id, item]))
  useEffect(() => () => controller.current?.abort(), [])

  const explore = async () => {
    if (!status?.graph.configured || busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); controller.current = new AbortController()
    try { setGraph(await KnowledgeAPI.graph({ query: query.trim(), limit: 60, depth: 1 }, controller.current.signal)); setSelected(null); setZoom(1) }
    catch (cause) { if (!controller.current.signal.aborted) setError(cause instanceof Error ? cause.message : '图谱读取失败') }
    finally { busyRef.current = false; setBusy(false) }
  }

  return <div className="space-y-4">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><p className="mb-2 text-[10px] tracking-[0.2em] text-violet-200/50">KNOWLEDGE ATLAS</p><h2 className="text-xl font-semibold">知识图谱工作区</h2><p className="mt-2 text-xs leading-6 text-zinc-500">从实体、关系和来源，理解知识之间的连接。</p></div><span className="rounded-full border border-violet-200/15 px-3 py-1.5 text-[10px] text-violet-100/60">{status ? status.graph.configured ? '图谱服务已配置' : '图谱服务待接入' : '状态待确认'}</span></header>
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_270px]">
      <section aria-label="知识图谱画布" className="min-w-0 overflow-hidden rounded-3xl border border-violet-100/10 bg-[#0d1320]"><form onSubmit={(event) => { event.preventDefault(); explore() }} className="flex flex-wrap gap-2 border-b border-white/5 p-4"><label className="relative min-w-0 flex-1"><span className="sr-only">查找图谱实体</span><Search className="absolute left-3 top-3 h-3.5 w-3.5 text-zinc-600" /><input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={1000} placeholder="查找一个概念、方法或主题…" className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-violet-200/30" /></label><button disabled={!status?.graph.configured || busy} className="rounded-xl bg-violet-100 px-4 py-2 text-xs font-medium text-[#21182e] disabled:opacity-25">{busy ? '读取中…' : '探索关联'}</button></form>
        <div className="relative min-h-[440px] overflow-auto bg-[radial-gradient(circle_at_1px_1px,rgba(196,181,253,0.08)_1px,transparent_0)] [background-size:22px_22px]">
          {busy ? <div role="status" className="flex min-h-[440px] items-center justify-center gap-2 text-xs text-violet-200"><Loader2 className="h-4 w-4 animate-spin" />正在读取知识关联…</div> : graph && graph.nodes.length > 0 ? <svg role="img" aria-label="知识实体与关系" viewBox="0 0 1000 600" style={{ width: `${zoom * 100}%`, minWidth: '100%', height: 'auto', minHeight: 440 }}><g>{graph.edges.map((edge, index) => { const from = positions.get(edge.source); const to = positions.get(edge.target); return from && to ? <g key={index}><line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={edge.source === selected || edge.target === selected ? '#c4b5fd80' : '#a5b4fc20'} strokeWidth={1.2} />{(edge.source === selected || edge.target === selected) && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 5} textAnchor="middle" fontSize="10" fill="#a1a1aa">{edge.label.slice(0, 16)}</text>}</g> : null })}{positioned.map((item) => <g key={item.id} role="button" tabIndex={0} aria-label={`查看实体：${item.label}`} onClick={() => setSelected(item.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item.id) } }} className="cursor-pointer outline-none focus:opacity-70"><circle cx={item.x} cy={item.y} r={selected === item.id ? 16 : 10} fill={`${types[item.type].color}18`} stroke={types[item.type].color} strokeWidth={selected === item.id ? 2 : 1} /><circle cx={item.x} cy={item.y} r={3} fill={types[item.type].color} />{(positioned.length < 25 || selected === item.id) && <text x={item.x} y={item.y + 28} textAnchor="middle" fontSize="11" fill="#cbd5e1">{item.label.length > 18 ? item.label.slice(0, 18) + '…' : item.label}</text>}</g>)}</g></svg> : <div className="flex min-h-[440px] flex-col items-center justify-center px-6 text-center"><span className="mb-5 rounded-3xl border border-violet-200/10 bg-violet-200/5 p-6"><Network className="h-12 w-12 text-violet-200/30" /></span><h3 className="text-base text-zinc-300">{graph ? '还没有找到相关的知识实体' : '为知识之间的联系，留出一整张地图'}</h3><p className="mt-3 max-w-md text-xs leading-7 text-zinc-600">{status?.graph.configured ? '搜索一个主题，或直接点击「探索关联」读取图谱。' : '连接图谱服务后，概念、方法、文献及其关系将在这里展示，每条关联都可以追溯来源文档。'}</p></div>}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 p-4"><div className="flex flex-wrap gap-3">{Object.entries(types).map(([key, type]) => <span key={key} className="flex items-center gap-1.5 text-[10px] text-zinc-600"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: type.color }} />{type.label}</span>)}</div><div className="flex items-center gap-2"><button aria-label="缩小图谱" disabled={!graph?.nodes.length || zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - 0.25))} className="rounded-lg p-1.5 text-zinc-500 disabled:opacity-25"><ZoomOut className="h-3.5 w-3.5" /></button><button aria-label="重置图谱缩放" onClick={() => setZoom(1)} className="rounded-lg p-1.5 text-zinc-500"><Focus className="h-3.5 w-3.5" /></button><button aria-label="放大图谱" disabled={!graph?.nodes.length || zoom >= 2.5} onClick={() => setZoom(Math.min(2.5, zoom + 0.25))} className="rounded-lg p-1.5 text-zinc-500 disabled:opacity-25"><ZoomIn className="h-3.5 w-3.5" /></button></div></footer>
      </section>
      <aside className="space-y-4"><section className="rounded-3xl border border-white/10 bg-[#111722]/80 p-5"><h3 className="mb-4 text-xs font-medium text-zinc-300">{node ? '实体详情' : '关联与来源'}</h3>{node ? <div className="space-y-4"><p className="text-[10px] text-violet-200/60">{types[node.type].label}</p><h4 className="break-words text-lg text-zinc-200">{node.label}</h4><div className="border-t border-white/10 pt-4"><p className="mb-3 text-[11px] text-zinc-500">来源文档</p>{node.document_ids.length ? node.document_ids.map((id, index) => <Link key={id} href={`/knowledge/documents/${id}`} className="mb-2 flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-[11px] text-cyan-200/70">查看来源资料 {index + 1}<ArrowUpRight className="h-3 w-3" /></Link>) : <p className="text-xs text-zinc-600">该实体暂未关联原文</p>}</div><p className="text-[10px] leading-6 text-zinc-600">{graph?.edges.filter((edge) => edge.source === node.id || edge.target === node.id).length || 0} 条直接关联</p></div> : <><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/5 bg-white/5"><Network className="h-5 w-5 text-zinc-600" /></div><p className="text-xs leading-7 text-zinc-600">选择一个实体，在这里查看它的类型、直接关联和原始资料。</p></>}</section><div className="rounded-2xl border border-white/5 p-4"><p className="text-[10px] text-zinc-600">当前画布</p><p className="mt-2 text-xs text-zinc-500">{graph ? `${graph.nodes.length} 个实体 · ${graph.edges.length} 条关系` : '等待图谱数据'}</p></div><Link href="/knowledge/documents" className="flex items-center justify-between rounded-2xl border border-white/10 p-4 text-xs text-zinc-500">回到文档库<ArrowUpRight className="h-3 w-3" /></Link></aside>
    </div>
    {(error || statusError) && <p role="alert" className="text-xs text-amber-100">{error || statusError}{statusError && <button onClick={retry} className="ml-2 underline">重试连接</button>}</p>}
  </div>
}
