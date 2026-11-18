'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, FileText, FolderOpen, Loader2, Plus, Search, Star, Trash2, Upload } from 'lucide-react'
import { draftFromMarkdown, KNOWLEDGE_PAGE_SIZE, KnowledgeService, MARKDOWN_MAX_BYTES } from '@/lib/knowledge'
import { KNOWLEDGE_TOPICS } from '@/types/knowledge'
import type { KnowledgeDocumentSummary, KnowledgeTopic } from '@/types/knowledge'

const button = 'flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-zinc-300 hover:bg-white/10 disabled:opacity-40 sm:text-sm'

export function KnowledgeLibrary({ initialSearch = '', initialTopic = 'all' }: { initialSearch?: string; initialTopic?: KnowledgeTopic | 'all' }) {
  const router = useRouter()
  const [documents, setDocuments] = useState<KnowledgeDocumentSummary[]>([])
  const [count, setCount] = useState(0)
  const [search, setSearch] = useState(initialSearch)
  const [query, setQuery] = useState(initialSearch)
  const [topic, setTopic] = useState<KnowledgeTopic | 'all'>(initialTopic)
  const [view, setView] = useState<'all' | 'favorites' | 'trash'>('all')
  const [page, setPage] = useState(0)
  const [refresh, setRefresh] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [importFailures, setImportFailures] = useState<string[]>([])
  const uploadRef = useRef<HTMLInputElement>(null)
  const busyRef = useRef(false)

  useEffect(() => {
    if (search === query) return
    const timer = setTimeout(() => { setQuery(search); setPage(0) }, 300)
    return () => clearTimeout(timer)
  }, [search, query])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    KnowledgeService.list({ search: query, topic, view, page, signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return
      setDocuments(result.documents); setCount(result.count)
      if (page > 0 && result.documents.length === 0) setPage(page - 1)
    }).catch((cause: Error) => { if (!controller.signal.aborted) setError(cause.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [query, topic, view, page, refresh])

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) return
    busyRef.current = true; setBusy(true); setMessage(''); setError(''); setImportFailures([])
    try { await action() } catch (cause) { setError(cause instanceof Error ? cause.message : '操作失败，请重试') }
    finally { busyRef.current = false; setBusy(false) }
  }

  const importFiles = async (files: File[]) => {
    if (files.length > 20) throw new Error('每批最多导入 20 篇 Markdown，请分批上传')
    if (files.reduce((sum, file) => sum + file.size, 0) > 20 * 1024 * 1024) throw new Error('每批文件总大小最多 20 MB，请分批上传')
    const failures: string[] = []
    let imported = 0
    for (const file of files) {
      if (!/\.(md|markdown)$/i.test(file.name) || file.size > MARKDOWN_MAX_BYTES) {
        failures.push(`${file.name}：仅支持 2 MB 以内的 Markdown`); continue
      }
      try {
        const content = await file.text()
        if (content.includes('\u0000')) throw new Error('文件包含二进制内容，请转换为 UTF-8 Markdown')
        if (content.includes('\uFFFD')) throw new Error('文件编码可能不正确，请另存为 UTF-8')
        await KnowledgeService.create(draftFromMarkdown(file.name, content)); imported++
      } catch (cause) { failures.push(`${file.name}：${cause instanceof Error ? cause.message : '导入失败'}`) }
    }
    setMessage(`已导入 ${imported} 篇文档${failures.length ? `；${failures.length} 篇未导入` : '，原始 Markdown 已保留'}`)
    setImportFailures(failures)
    setPage(0); setRefresh((value) => value + 1)
  }

  return <div className="space-y-5">
    <div className="linear-card flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
      <div><p className="mb-2 text-[10px] tracking-[0.2em] text-cyan-200/70">DOCUMENT LIBRARY</p><h2 className="text-xl font-semibold">文档库</h2><p className="mt-2 max-w-xl text-xs leading-6 text-zinc-400">保存原始笔记与阅读资料，为检索、知识关联和复盘积累内容。</p></div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button disabled={busy} className={button} onClick={() => uploadRef.current?.click()}><Upload className="h-4 w-4" />导入 Markdown</button>
        <button disabled={busy} className={`${button} !bg-white !text-black`} onClick={() => run(async () => {
          const created = await KnowledgeService.create({ title: '未命名笔记', markdown: '', topic: '未分类', tags: [], source_kind: 'note', source_name: '' })
          router.push(`/knowledge/documents/${created.id}?edit=1`)
        })}><Plus className="h-4 w-4" />新建笔记</button>
      </div>
      <input ref={uploadRef} aria-label="选择 Markdown 文件" type="file" accept=".md,.markdown,text/markdown" multiple className="hidden" onChange={(event) => { const files = Array.from(event.target.files || []); event.target.value = ''; if (files.length) run(() => importFiles(files)) }} />
    </div>

    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="flex gap-1 self-start rounded-xl border border-white/10 bg-black/20 p-1">
        {([{ key: 'all', label: '全部文档', icon: FolderOpen }, { key: 'favorites', label: '收藏', icon: Star }, { key: 'trash', label: '回收站', icon: Trash2 }] as const).map(({ key, label, icon: Icon }) => <button key={key} aria-pressed={view === key} onClick={() => { setView(key); setPage(0) }} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs ${view === key ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}
      </div>
      <div className="flex min-w-0 flex-1 gap-2">
        <label className="relative min-w-0 flex-1"><span className="sr-only">搜索文档</span><Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题、正文或文件名…" className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-cyan-200/40 sm:text-sm" /></label>
        <select aria-label="筛选知识主题" value={topic} onChange={(event) => { setTopic(event.target.value as KnowledgeTopic | 'all'); setPage(0) }} className="max-w-[120px] rounded-xl border border-white/10 bg-[#10141e] px-3 text-xs text-zinc-300"><option value="all">全部主题</option>{KNOWLEDGE_TOPICS.map((item) => <option key={item}>{item}</option>)}</select>
      </div>
    </div>

    {(message || busy) && <p role="status" className="flex items-center gap-2 text-xs text-cyan-200">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? '正在保存到知识库，请稍候…' : message}</p>}
    {error && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 p-4 text-xs text-rose-200"><p className="whitespace-pre-wrap break-words">{error}</p><button className="shrink-0 underline" onClick={() => setRefresh((value) => value + 1)}>重试加载</button></div>}
    {importFailures.length > 0 && <div role="alert" className="space-y-2 rounded-xl border border-amber-200/15 bg-amber-200/5 p-4 text-xs leading-6 text-amber-100"><p>以下文件未导入，请调整后重新选择：</p><ul className="list-inside list-disc">{importFailures.map((failure, index) => <li key={index} className="break-words">{failure}</li>)}</ul></div>}

    {loading ? <div className="flex justify-center gap-2 py-16 text-sm text-zinc-500"><Loader2 className="h-4 w-4 animate-spin" />正在加载文档…</div> : !error && documents.length === 0 ? (
      <div className="linear-card px-5 py-14 text-center"><BookOpen className="mx-auto mb-4 h-9 w-9 text-zinc-600" /><h3 className="font-medium text-zinc-200">{query || topic !== 'all' ? '没有找到匹配的文档' : view === 'trash' ? '回收站是空的' : view === 'favorites' ? '收藏常用资料，查找更方便' : '从你的第一篇 Markdown 开始'}</h3><p className="mx-auto mt-3 max-w-lg text-xs leading-6 text-zinc-500">{view === 'all' && !query && topic === 'all' ? '可以导入已有笔记，也可以在这里直接写作。PDF 在本地转成 Markdown 后，同样可以导入。' : '尝试调整搜索条件，或返回全部文档。'}</p></div>
    ) : <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => <Link key={document.id} href={`/knowledge/documents/${document.id}`} className="linear-card group flex min-w-0 flex-col p-5 hover:!border-cyan-200/25">
        <div className="mb-4 flex items-center justify-between"><span className="rounded-xl bg-white/5 p-2 text-cyan-200/80"><FileText className="h-4 w-4" /></span><div className="flex items-center gap-2">{document.favorite && <Star aria-label="已收藏" className="h-3.5 w-3.5 fill-amber-200 text-amber-200" />}<span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-zinc-400">{document.topic}</span></div></div>
        <h3 className="break-words text-sm font-semibold leading-6 text-zinc-100 group-hover:text-cyan-100">{document.title}</h3>
        <p className="mt-2 truncate text-[11px] text-zinc-500">{document.source_kind === 'note' ? '工作台笔记' : document.source_name || 'Markdown 文档'}{document.source_kind === 'pdf-markdown' && ' · PDF 转换'}</p>
        <div className="mb-4 mt-3 flex flex-wrap gap-1.5">{document.tags.slice(0, 4).map((tag) => <span key={tag} className="max-w-full truncate rounded-md bg-white/5 px-2 py-1 text-[10px] text-zinc-400">#{tag}</span>)}</div>
        <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-zinc-600"><span>{document.deleted_at ? '移入回收站' : '更新于'} {new Date(document.deleted_at || document.updated_at).toLocaleDateString('zh-CN')}</span><ArrowUpRight className="h-3.5 w-3.5" /></div>
      </Link>)}
    </div>}

    {!loading && count > 0 && <div className="flex items-center justify-between text-xs text-zinc-500"><span>共 {count} 篇 · 第 {page + 1} / {Math.ceil(count / KNOWLEDGE_PAGE_SIZE)} 页</span><div className="flex gap-2"><button aria-label="上一页文档" className={button} disabled={page === 0} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></button><button aria-label="下一页文档" className={button} disabled={(page + 1) * KNOWLEDGE_PAGE_SIZE >= count} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></button></div></div>}
    <p className="text-[11px] leading-6 text-zinc-600">支持 .md / .markdown，每篇最多 2 MB，每批最多 20 篇。同名文件会另存为新文档。图片附件请使用可访问的链接。</p>
  </div>
}
