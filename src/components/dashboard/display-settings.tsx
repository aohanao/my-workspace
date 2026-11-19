'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { DASHBOARD_MODULES, type DashboardModuleId, type DashboardVisibility } from '@/lib/dashboard'

export function DashboardDisplaySettings({ visibility, onToggle, onSetAll }: {
  visibility: DashboardVisibility
  onToggle: (id: DashboardModuleId) => void
  onSetAll: (visible: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const visibleCount = DASHBOARD_MODULES.filter(({ id }) => visibility[id]).length

  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus() }
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [open])

  return (
    <section aria-label="控制中枢显示设置" className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-400" aria-live="polite">已显示 <span className="font-mono text-zinc-200">{visibleCount} / {DASHBOARD_MODULES.length}</span> 个模块</p>
        <button ref={toggleRef} type="button" aria-expanded={open} aria-controls="dashboard-display-settings" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
          <SlidersHorizontal className="h-3.5 w-3.5" />自定义显示
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div id="dashboard-display-settings" className="mt-4 border-t border-white/[0.08] pt-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-relaxed text-zinc-400">选择你想看的模块，布局自动调整，选择自动保存。</p>
            <div className="flex gap-3 text-xs">
              <button type="button" disabled={visibleCount === DASHBOARD_MODULES.length} onClick={() => onSetAll(true)} className="rounded text-zinc-200 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-30">全部显示</button>
              <button type="button" disabled={visibleCount === 0} onClick={() => onSetAll(false)} className="rounded text-zinc-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-30">全部隐藏</button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {DASHBOARD_MODULES.map(({ id, label, description }) => (
              <label key={id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${visibility[id] ? 'border-white/15 bg-white/[0.05]' : 'border-white/[0.06] hover:bg-white/[0.03]'}`}>
                <input type="checkbox" checked={visibility[id]} onChange={() => onToggle(id)} className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200" />
                <span className="min-w-0"><span className="block text-xs font-medium text-zinc-200">{label}</span><span className="mt-1 block text-[11px] leading-relaxed text-zinc-500">{description}</span></span>
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
