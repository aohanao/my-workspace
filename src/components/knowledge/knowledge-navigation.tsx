'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Code2, Library } from 'lucide-react'

export function KnowledgeNavigation() {
  const pathname = usePathname()
  return <div className="space-y-4">
    <div className="flex items-center gap-3"><span className="rounded-2xl border border-white/10 bg-white/5 p-3"><Library className="h-6 w-6 text-cyan-200" /></span><div><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">个人知识库</h1><p className="mt-1 text-xs text-zinc-400 sm:text-sm">收集资料，沉淀理解，让知识持续积累。</p></div></div>
    <nav aria-label="知识库栏目" className="flex gap-2 overflow-x-auto border-b border-white/10 pb-3">
      {[{ href: '/knowledge', label: '文档库', icon: BookOpen, active: !pathname.startsWith('/knowledge/review') }, { href: '/knowledge/review', label: '知识与算法复盘', icon: Code2, active: pathname.startsWith('/knowledge/review') }].map(({ href, label, icon: Icon, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium sm:text-sm ${active ? 'bg-white text-black' : 'bg-white/[0.03] text-zinc-400 hover:bg-white/10 hover:text-white'}`}><Icon className="h-4 w-4" />{label}</Link>)}
    </nav>
  </div>
}
