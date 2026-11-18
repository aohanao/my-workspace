'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Download, Edit3, FileText, Loader2, RotateCcw, Save, Star, Trash2, X } from 'lucide-react'
import { downloadMarkdown, KnowledgeService, validateDraft } from '@/lib/knowledge'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeDocument, KnowledgeDraft, KnowledgeSource, KnowledgeTopic } from '@/types/knowledge'
import { MarkdownReader } from './markdown-reader'

const button = 'flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-40'
const inputClass = 'w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2.5 text-sm outline-none focus:border-cyan-200/40'
const toDraft = (document: KnowledgeDocument): KnowledgeDraft => ({ title: document.title, markdown: document.markdown, tags: [...document.tags], topic: document.topic, source_kind: document.source_kind, source_name: document.source_name })

export function KnowledgeReader({ id, initialEditing = false }: { id: string; initialEditing?: boolean }) {
  const [document, setDocument] = useState<KnowledgeDocument | null>(null)
  const [draft, setDraft] = useState<KnowledgeDraft | null>(null)
  const [baseRevision, setBaseRevision] = useState(1)
  const [editing, setEditing] = useState(initialEditing)
  const [preview, setPreview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [cacheWarning, setCacheWarning] = useState(false)
  const [reload, setReload] = useState(0)
  const busyRef = useRef(false)
  const dirty = !!document && !!draft && JSON.stringify(draft) !== JSON.stringify(toDraft(document))
  const draftKey = document ? `knowledge-draft:${document.owner_id}:${id}` : ''

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    KnowledgeService.get(id, controller.signal).then((loaded) => {
      if (controller.signal.aborted) return
      setDocument(loaded); setDraft(toDraft(loaded)); setBaseRevision(loaded.revision)
      try {
        const saved = sessionStorage.getItem(`knowledge-draft:${loaded.owner_id}:${id}`)
        if (saved && !loaded.deleted_at) {
          const restored = JSON.parse(saved) as { draft: KnowledgeDraft; revision: number }
          if (typeof restored.draft.title === 'string' && typeof restored.draft.markdown === 'string' && Array.isArray(restored.draft.tags) && KNOWLEDGE_TOPICS.includes(restored.draft.topic) && Number.isInteger(restored.revision)) {
            setDraft(restored.draft); setBaseRevision(restored.revision); setEditing(true)
            setMessage(restored.revision === loaded.revision ? '已恢复此标签页中尚未保存的草稿' : '已恢复草稿，但云端已有新版本。请先导出草稿，再重新读取云端版本。')
          }
        }
      } catch { /* 缓存不可用时仍可以阅读和手动保存。 */ }
    }).catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [id, reload])

  useEffect(() => {
    if (!draftKey) return
    if (!dirty || !draft || !editing) { sessionStorage.removeItem(draftKey); return }
    const persist = () => {
      try { sessionStorage.setItem(draftKey, JSON.stringify({ draft, revision: baseRevision })); return true } catch { return false }
    }
    const timer = window.setTimeout(() => setCacheWarning(!persist()), 500)
    const onUnload = (event: BeforeUnloadEvent) => { persist(); event.preventDefault(); event.returnValue = '' }
    const onNavigate = (event: MouseEvent) => {
      if (!(event.target instanceof Element) || !event.target.closest('a[href]')) return
      persist()
      if (!window.confirm('当前修改尚未保存到云端，确定离开吗？可返回此文档继续编辑草稿。')) { event.preventDefault(); event.stopPropagation() }
    }
    window.addEventListener('beforeunload', onUnload)
    window.document.addEventListener('click', onNavigate, true)
    return () => { window.clearTimeout(timer); persist(); window.removeEventListener('beforeunload', onUnload); window.document.removeEventListener('click', onNavigate, true) }
  }, [dirty, draft, draftKey, editing, baseRevision])

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setError(''); setMessage('')
    try { await action() } catch (cause) { setError(cause instanceof Error ? cause.message : '操作失败，请重试') }
    finally { busyRef.current = false; setBusy(false) }
  }
  const accept = (saved: KnowledgeDocument) => {
    setDocument(saved); setDraft(toDraft(saved)); setBaseRevision(saved.revision)
  }
  const discard = () => {
    if (dirty && !window.confirm('确定放弃当前草稿，恢复到已保存的版本吗？')) return
    if (document) setDraft(toDraft(document))
    setEditing(false); setPreview(false); setMessage(''); setError('')
  }

  if (loading) return <div className="flex justify-center gap-2 py-20 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />正在打开文档…</div>
  if (!document || !draft) return <div className="linear-card space-y-4 p-6"><p role="alert" className="text-sm text-rose-200">{error || '文档不存在或当前账户无权访问'}</p><div className="flex gap-3"><Link href="/knowledge/documents" className={button}>返回文档库</Link><button className={button} onClick={() => setReload((value) => value + 1)}>重新加载</button></div></div>

  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/knowledge/documents" className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white"><ArrowLeft className="h-4 w-4" />返回文档库</Link>
      <div className="flex flex-wrap gap-2">
        <button className={button} onClick={() => downloadMarkdown(editing ? draft.title : document.title, editing ? draft.markdown : document.markdown)}><Download className="h-3.5 w-3.5" />导出 Markdown</button>
        {!editing && !document.deleted_at && <><button disabled={busy} className={button} onClick={() => run(async () => { accept(await KnowledgeService.update(document, { favorite: !document.favorite })) })}><Star className={`h-3.5 w-3.5 ${document.favorite ? 'fill-amber-200 text-amber-200' : ''}`} />{document.favorite ? '已收藏' : '收藏'}</button><button className={`${button} !bg-white !text-black`} onClick={() => { setEditing(true); setPreview(false) }}><Edit3 className="h-3.5 w-3.5" />编辑文档</button></>}
        {editing && <><button disabled={busy} className={button} onClick={discard}><X className="h-3.5 w-3.5" />取消编辑</button><button disabled={busy} className={`${button} !bg-white !text-black`} onClick={() => run(async () => {
          const normalized = { ...draft, title: draft.title.trim(), tags: Array.from(new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))) }
          validateDraft(normalized)
          const saved = await KnowledgeService.update({ id, revision: baseRevision }, normalized)
          accept(saved); setEditing(false); setPreview(false); setMessage('文档已保存到云端')
        })}>{busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}保存文档</button></>}
      </div>
    </div>
    {error && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-xs leading-6 text-rose-200">{error}{editing && ' 当前编辑内容仍保留，可重试或导出 Markdown。'}</p>}
    {message && <p role="status" className="flex items-start gap-2 text-xs leading-6 text-cyan-200"><Check className="mt-1 h-3.5 w-3.5 shrink-0" />{message}</p>}
    {cacheWarning && editing && <p className="text-xs text-amber-200">浏览器草稿缓存已满，请及时保存到云端或导出 Markdown。</p>}
    {document.deleted_at && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/15 bg-amber-200/5 p-4 text-xs text-amber-100"><p>这篇文档在回收站中，恢复后可以继续编辑。</p><button disabled={busy} className={button} onClick={() => run(async () => { accept(await KnowledgeService.update(document, { deleted_at: null })); setMessage('文档已恢复') })}><RotateCcw className="h-3.5 w-3.5" />恢复文档</button></div>}

    <article className="linear-card min-w-0 overflow-hidden p-4 sm:p-7">
      {editing ? <fieldset disabled={busy} className="min-w-0 space-y-4">
        <label className="block text-xs text-zinc-400">文档标题<input aria-label="文档标题" maxLength={300} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className={`${inputClass} mt-2 !text-lg font-semibold`} /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-zinc-400">知识主题<select value={draft.topic} onChange={(event) => setDraft({ ...draft, topic: event.target.value as KnowledgeTopic })} className={`${inputClass} mt-2 !bg-[#111723]`}>{KNOWLEDGE_TOPICS.map((topic) => <option key={topic}>{topic}</option>)}</select></label>
          <label className="text-xs text-zinc-400">资料来源<select value={draft.source_kind} onChange={(event) => setDraft({ ...draft, source_kind: event.target.value as KnowledgeSource })} className={`${inputClass} mt-2 !bg-[#111723]`}><option value="note">工作台笔记</option><option value="markdown">Markdown 文件</option><option value="pdf-markdown">PDF 本地转 Markdown</option></select></label>
          <label className="text-xs text-zinc-400">标签（逗号分隔）<input value={draft.tags.join(',')} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(/[,，]/) })} placeholder="例如：隧道, 论文, 算法" className={`${inputClass} mt-2`} /></label>
        </div>
        <label className="block text-xs text-zinc-400">原始文件名 / 来源说明<input value={draft.source_name} maxLength={512} onChange={(event) => setDraft({ ...draft, source_name: event.target.value })} placeholder="例如：论文阅读笔记.md" className={`${inputClass} mt-2`} /></label>
        <div className="flex items-center justify-between border-b border-white/10 pb-2"><div className="flex gap-2"><button type="button" className={`${button} ${!preview ? '!bg-white/10 !text-white' : ''}`} aria-pressed={!preview} onClick={() => setPreview(false)}>Markdown 编辑</button><button type="button" className={`${button} ${preview ? '!bg-white/10 !text-white' : ''}`} aria-pressed={preview} onClick={() => setPreview(true)}>预览效果</button></div><span className="text-[10px] text-zinc-500">{dirty ? '修改尚未保存到云端' : '内容与云端一致'}</span></div>
        {preview ? <div className="min-h-[400px] py-4"><MarkdownReader markdown={draft.markdown || '*开始写下你的第一段内容…*'} /></div> : <textarea aria-label="Markdown 正文" spellCheck={false} value={draft.markdown} onChange={(event) => setDraft({ ...draft, markdown: event.target.value })} placeholder={'# 笔记标题\n\n写下你的理解、摘录或复盘…'} className={`${inputClass} min-h-[50vh] resize-y !font-mono !text-[13px] leading-7`} />}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500"><span>Markdown 原文保存 · 草稿仅在当前浏览器标签页暂存</span><button type="button" className="text-zinc-400 underline" onClick={() => { if (!window.confirm('放弃草稿并重新读取云端版本？请先导出需要保留的内容。')) return; setDraft(toDraft(document)); setEditing(false); sessionStorage.removeItem(draftKey); setReload((value) => value + 1) }}>重新读取云端版本</button></div>
      </fieldset> : <>
        <div className="mb-7 border-b border-white/10 pb-6"><div className="mb-3 flex items-center gap-2 text-xs text-zinc-500"><FileText className="h-4 w-4 text-cyan-200" /><span>{document.topic}</span><span>·</span><span>{document.source_kind === 'note' ? '工作台笔记' : document.source_kind === 'pdf-markdown' ? 'PDF 本地转 Markdown' : 'Markdown 文档'}</span></div><h2 className="break-words text-2xl font-bold leading-relaxed sm:text-3xl">{document.title}</h2><div className="mt-4 flex flex-wrap gap-2">{document.tags.map((tag) => <span key={tag} className="rounded-md bg-white/5 px-2 py-1 text-xs text-zinc-400">#{tag}</span>)}</div><p className="mt-4 break-words text-[11px] leading-6 text-zinc-500">更新于 {new Date(document.updated_at).toLocaleString('zh-CN')}{document.source_name && ` · 来源：${document.source_name}`}</p></div>
        {document.markdown ? <MarkdownReader markdown={document.markdown} /> : <p className="py-16 text-center text-sm text-zinc-500">这篇笔记还没有正文，点击「编辑文档」开始写作。</p>}
      </>}
    </article>
    {!editing && !document.deleted_at && <div className="flex justify-end"><button disabled={busy} className="flex items-center gap-1.5 rounded-lg p-2 text-xs text-zinc-600 hover:text-rose-300" onClick={() => run(async () => { if (!window.confirm('将这篇文档移入回收站？之后可以恢复。')) return; accept(await KnowledgeService.update(document, { deleted_at: new Date().toISOString() })); setMessage('文档已移入回收站') })}><Trash2 className="h-3.5 w-3.5" />移入回收站</button></div>}
  </div>
}
