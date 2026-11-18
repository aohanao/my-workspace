'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Library, LockKeyhole } from 'lucide-react'
import { KNOWLEDGE_SECTIONS, knowledgeSectionActive } from './knowledge-sections'

export function KnowledgeNavigation() {
  const pathname = usePathname()
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-2xl border border-cyan-100/15 bg-cyan-100/5 p-3"><Library className="h-6 w-6 text-cyan-200" /></span><div><p className="mb-1 text-[9px] tracking-[0.2em] text-zinc-500">PERSONAL KNOWLEDGE SPACE</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">个人知识库</h1><p className="mt-1 text-xs text-zinc-500">检索、阅读、关联、复盘，在这里连接你的知识。</p></div></div><span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] text-zinc-500 sm:flex"><LockKeyhole className="h-3 w-3" />个人资料空间</span></div>
    <nav aria-label="知识库栏目" className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
      {KNOWLEDGE_SECTIONS.map(({ href, label, icon: Icon }) => { const active = knowledgeSectionActive(pathname, href); return <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-medium ${active ? 'border-cyan-100/20 bg-cyan-100/10 text-cyan-100' : 'border-transparent text-zinc-500 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</Link> })}
    </nav>
  </div>
}
