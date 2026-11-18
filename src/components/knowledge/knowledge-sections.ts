import { BookOpen, Code2, LayoutGrid, Network, Search } from 'lucide-react'

export const KNOWLEDGE_SECTIONS = [
  { href: '/knowledge', label: '知识总览', icon: LayoutGrid },
  { href: '/knowledge/documents', label: '文档库', icon: BookOpen },
  { href: '/knowledge/search', label: 'RAG 检索', icon: Search },
  { href: '/knowledge/graph', label: '知识图谱', icon: Network },
  { href: '/knowledge/review', label: '知识与算法复盘', icon: Code2 },
]

export const knowledgeSectionActive = (pathname: string, href: string) => href === '/knowledge' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
