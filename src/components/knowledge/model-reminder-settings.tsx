'use client'

import { useState } from 'react'
import { StorageService } from '@/lib/storage'
import type { ModelExperiment } from '@/types'

export function ModelReminderSettings() {
  const [models, setModels] = useState<ModelExperiment[]>([])
  const [modelId, setModelId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [saved, setSaved] = useState(false)

  function selectModel(model: ModelExperiment | undefined) {
    setModelId(model?.id ?? '')
    setPlannedDate(model?.plannedDate ?? '')
    setSaved(false)
  }

  return <details className="ml-5 mt-1 text-[11px] text-zinc-400" onToggle={(event) => {
    if (!event.currentTarget.open) return
    const current = StorageService.getModels()
    setModels(current)
    selectModel(current.find(({ id }) => id === modelId) ?? current[0])
  }}>
    <summary className="cursor-pointer py-1 text-cyan-200">设置模型计划完成日</summary>
    {models.length > 0 && <form className="space-y-2 py-1" onSubmit={(event) => {
      event.preventDefault()
      const current = StorageService.getModels()
      if (!current.some(({ id }) => id === modelId)) return
      StorageService.saveModels(current.map((model) => model.id === modelId ? { ...model, plannedDate: plannedDate || undefined } : model))
      setModels(StorageService.getModels())
      setSaved(true)
    }}>
      <select aria-label="选择算法模型" value={modelId} onChange={(event) => selectModel(models.find(({ id }) => id === event.target.value))} className="w-full rounded-md border border-white/15 bg-[#172333] px-2 py-1 text-zinc-100">
        {models.map(({ id, modelName }) => <option key={id} value={id}>{modelName}</option>)}
      </select>
      <div className="flex flex-wrap items-center gap-2">
        <input aria-label="模型计划完成日" type="date" value={plannedDate} onChange={(event) => { setPlannedDate(event.target.value); setSaved(false) }} className="rounded-md border border-white/15 bg-black/20 px-2 py-1 text-zinc-100 [color-scheme:dark]" />
        <button type="submit" className="rounded-md bg-cyan-200/10 px-2 py-1 text-cyan-100">保存</button>
        {saved && <span role="status">已保存</span>}
      </div>
    </form>}
  </details>
}
