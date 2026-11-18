'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, CornerDownRight, ListTodo, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { StorageService } from '@/lib/storage'
import { getCarryoverTasks, getPlanPeriod, shiftPlanPeriod } from '@/lib/plan-period'
import { getLocalDateKey } from '@/lib/utils'
import type { DailyTop3Item, PlanScope, PlanTask } from '@/types'

const iconButton = 'rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-30'

export function PlanWindow() {
  const [open, setOpen] = useState(true)
  const [scope, setScope] = useState<PlanScope>('week')
  const [today, setToday] = useState('')
  const [viewStart, setViewStart] = useState<string | null>(null)
  const [tasks, setTasks] = useState<PlanTask[]>([])
  const [dailyTasks, setDailyTasks] = useState<DailyTop3Item[]>([])
  const [text, setText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const refresh = () => {
      setToday(getLocalDateKey())
      setTasks(StorageService.getPlanTasks())
      setDailyTasks(StorageService.getTop3())
    }
    refresh()
    window.addEventListener('workspace-data-updated', refresh)
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60_000)
    return () => {
      window.removeEventListener('workspace-data-updated', refresh)
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [])

  const current = getPlanPeriod(scope, today ? new Date(`${today}T12:00:00`) : new Date())
  const period = viewStart ? getPlanPeriod(scope, new Date(`${viewStart}T12:00:00`)) : current
  const isCurrent = period.start === current.start
  const label = scope === 'week' ? '本周' : '本月'
  const visibleTasks = tasks.filter((task) => task.scope === scope && task.periodStart === period.start)
  const completed = visibleTasks.filter((task) => task.done).length
  const remaining = tasks.filter((task) => task.scope === scope && task.periodStart === current.start && !task.done).length
  const carryover = getCarryoverTasks(tasks, scope, current.start)
  const carriedIds = new Set(tasks.map((task) => task.carriedFromId))
  const progress = visibleTasks.length ? Math.round(completed / visibleTasks.length * 100) : 0

  const updateTask = (id: string, changes: Partial<PlanTask>) => {
    StorageService.savePlanTasks(StorageService.getPlanTasks().map((task) => task.id === id ? { ...task, ...changes } : task))
  }
  const changeView = () => {
    setEditingId(null)
    setMessage('')
    setText('')
  }
  const addToday = (task: PlanTask) => {
    const date = getLocalDateKey()
    const id = `plan-${task.id}-${date}`
    const daily = StorageService.getTop3(date)
    if (daily.some((item) => item.id === id)) return
    StorageService.saveTop3ForDate(date, [...daily, {
      id, text: task.text, done: false, date, priority: '重缓', createdAt: new Date().toISOString(),
    }])
    setMessage('已加入今日待办，可在首页或日历查看')
  }

  return (
    <aside aria-label="周月计划" className="relative min-w-0 self-start overflow-hidden rounded-3xl border border-cyan-200/20 bg-[#101824]/90 text-white shadow-[0_14px_45px_-12px_rgba(0,0,0,0.65),0_0_30px_-15px_rgba(103,232,249,0.2)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
        <div className="flex items-center gap-2.5"><span className="rounded-xl border border-cyan-200/15 bg-cyan-200/10 p-2 text-cyan-200"><CalendarDays className="h-4 w-4" /></span><div><h2 className="text-sm font-semibold">周月计划</h2><p className="mt-1 text-[11px] text-zinc-500">{label}还有 {remaining} 项待办 · 把目标安排到今天</p></div></div>
        <button type="button" aria-label={open ? '收起周月计划' : '展开周月计划'} aria-expanded={open} aria-controls="plan-window" onClick={() => setOpen(!open)} className={iconButton}>{open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
      </div>
      {open && (
        <section id="plan-window" aria-label="周月任务清单" className="flex max-h-[650px] flex-col">
          <div className="shrink-0 border-b border-white/[0.08] p-4">
            <div className="flex gap-1 rounded-xl bg-black/30 p-1">
              {(['week', 'month'] as const).map((item) => (
                <button type="button" key={item} aria-pressed={scope === item} onClick={() => { setScope(item); setViewStart(null); changeView() }}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${scope === item ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-200'}`}>
                  {item === 'week' ? '本周任务' : '本月任务'}
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <button type="button" aria-label={scope === 'week' ? '查看上一周' : '查看上一月'} className={iconButton} onClick={() => { setViewStart(shiftPlanPeriod(scope, period.start, -1).start); changeView() }}><ChevronLeft className="h-3.5 w-3.5" /></button>
              <div className="text-center"><p className="text-xs text-zinc-300">{period.start.replaceAll('-', '.')} — {period.end.slice(5).replace('-', '.')}</p>
                <button type="button" onClick={() => { setViewStart(null); changeView() }} className="mt-1 text-[10px] text-cyan-200/80">{isCurrent ? (scope === 'week' ? '周一至周日' : '当月计划') : `历史归档 · 返回${label}`}</button>
              </div>
              <button type="button" disabled={isCurrent} aria-label={scope === 'week' ? '查看下一周' : '查看下一月'} className={iconButton} onClick={() => { setViewStart(shiftPlanPeriod(scope, period.start, 1).start); changeView() }}><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mb-2 mt-3 flex justify-between text-[11px] text-zinc-400"><span>已完成 {completed} / {visibleTasks.length}</span><span className="font-mono text-zinc-300">{progress}%</span></div>
            <div role="progressbar" aria-label="计划完成进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} className="h-1 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-cyan-200/80 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            {isCurrent && carryover.length > 0 && (
              <button type="button" onClick={() => {
                const latest = StorageService.getPlanTasks()
                const pending = getCarryoverTasks(latest, scope, current.start)
                StorageService.savePlanTasks([...latest, ...pending.map((task) => ({ ...task, id: crypto.randomUUID(), periodStart: current.start, carriedFromId: task.id, createdAt: new Date().toISOString() }))])
                setMessage(`已顺延 ${pending.length} 项任务，原记录保留在历史归档`)
              }} className="mb-3 flex w-full items-center gap-2 rounded-xl border border-amber-200/10 bg-amber-200/5 px-3 py-2.5 text-left text-xs text-amber-200/80 hover:bg-amber-200/10"><RotateCcw className="h-3.5 w-3.5 shrink-0" />有 {carryover.length} 项往期未完成，顺延到{label}<ChevronRight className="ml-auto h-3 w-3 shrink-0" /></button>
            )}
            {visibleTasks.length === 0 && <div className="px-5 py-8 text-center"><ListTodo className="mx-auto mb-3 h-7 w-7 text-zinc-600" /><p className="text-sm text-zinc-400">{isCurrent ? `给${label}留一个小目标` : '这个周期没有计划'}</p><p className="mt-2 text-xs leading-relaxed text-zinc-600">{isCurrent ? '论文推进、求职准备，或生活里的一件小事' : '历史任务会一直保留在所属周期'}</p></div>}
            <ul className="space-y-2">
              {visibleTasks.map((task) => {
                const addedToday = dailyTasks.some((daily) => daily.id === `plan-${task.id}-${today}`)
                return <li key={task.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <div className="flex items-start gap-2.5">
                    <button type="button" aria-label={`${task.done ? '标记未完成' : '完成'}：${task.text}`} aria-pressed={task.done} onClick={() => updateTask(task.id, { done: !task.done })} className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${task.done ? 'border-cyan-200 bg-cyan-200 text-black' : 'border-zinc-600 hover:border-cyan-200'}`}>{task.done && <Check className="h-3 w-3" />}</button>
                    {editingId === task.id ? (
                      <form className="min-w-0 flex-1" onSubmit={(event) => { event.preventDefault(); if (!editingText.trim()) return; updateTask(task.id, { text: editingText.trim() }); setEditingId(null) }}>
                        <input aria-label="编辑计划内容" autoFocus maxLength={300} value={editingText} onChange={(event) => setEditingText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); setEditingId(null) } }} className="w-full rounded-lg border border-white/20 bg-black/30 px-2 py-1 text-xs outline-none focus:border-cyan-200" />
                        <div className="mt-2 flex gap-3 text-xs"><button type="submit" disabled={!editingText.trim()} className="text-cyan-200 disabled:opacity-40">保存</button><button type="button" onClick={() => setEditingId(null)} className="text-zinc-500">取消</button></div>
                      </form>
                    ) : <p className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-xs leading-5 ${task.done ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>{task.text}</p>}
                  </div>
                  <div className="ml-6 mt-2 flex items-center gap-1">
                    {isCurrent && !task.done && <button type="button" disabled={addedToday} onClick={() => addToday(task)} className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-zinc-400 hover:bg-white/5 hover:text-cyan-200 disabled:text-cyan-200/60"><CornerDownRight className="h-3 w-3" />{addedToday ? '已加入今日' : '加入今日'}</button>}
                    {carriedIds.has(task.id) && <span className="text-[10px] text-amber-200/60">已顺延</span>}
                    <div className="ml-auto flex"><button type="button" aria-label={`编辑：${task.text}`} onClick={() => { setEditingId(task.id); setEditingText(task.text) }} className={iconButton}><Pencil className="h-3 w-3" /></button><button type="button" aria-label={`删除：${task.text}`} onClick={() => { StorageService.savePlanTasks(StorageService.getPlanTasks().filter((item) => item.id !== task.id)); setMessage('任务已删除') }} className={iconButton}><Trash2 className="h-3 w-3" /></button></div>
                  </div>
                </li>
              })}
            </ul>
          </div>

          <div className="shrink-0 border-t border-white/[0.08] p-4">
            {isCurrent && <form onSubmit={(event) => {
              event.preventDefault()
              if (!text.trim()) return
              const start = getPlanPeriod(scope).start
              StorageService.savePlanTasks([...StorageService.getPlanTasks(), { id: crypto.randomUUID(), text: text.trim(), done: false, scope, periodStart: start, createdAt: new Date().toISOString() }])
              setText(''); setMessage('计划已添加')
            }} className="flex gap-2">
              <input aria-label={`添加${label}任务`} placeholder={`添加${label}的小目标…`} maxLength={300} value={text} onChange={(event) => setText(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs outline-none placeholder:text-zinc-600 focus:border-cyan-200/40" />
              <button type="submit" aria-label="添加计划" disabled={!text.trim()} className="rounded-xl bg-white px-3 text-black hover:bg-zinc-200 disabled:opacity-30"><Plus className="h-4 w-4" /></button>
            </form>}
            <p role="status" className="mt-2 text-[10px] leading-relaxed text-zinc-500">{message || (isCurrent ? '到期自动归档 · 未完成任务可手动顺延' : '历史记录保留，点击日期下方可返回当前计划')}</p>
          </div>
        </section>
      )}
    </aside>
  )
}
