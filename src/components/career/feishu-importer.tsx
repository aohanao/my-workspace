'use client'

import { useState, useRef } from 'react'
import {
  FileSpreadsheet,
  ClipboardPaste,
  UploadCloud,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  Globe,
} from 'lucide-react'
import { parseFeishuClipboardText, parseFeishuExcelFile } from '@/lib/feishu-parser'
import { FeishuImportResult } from '@/types'
import { StorageService } from '@/lib/storage'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (count: number) => void
}

export function FeishuImporter({ isOpen, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste')
  const [pasteText, setPasteText] = useState('')
  const [parsedResult, setParsedResult] = useState<FeishuImportResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleParsePaste = () => {
    if (!pasteText.trim()) return
    setIsProcessing(true)
    try {
      const res = parseFeishuClipboardText(pasteText)
      setParsedResult(res)
    } catch (e) {
      alert('解析失败，请检查粘贴的内容格式')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsProcessing(true)
    try {
      const res = await parseFeishuExcelFile(file)
      setParsedResult(res)
    } catch (e) {
      alert('读取 Excel 文件失败')
    } finally {
      setIsProcessing(false)
    }
  }

  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace')

  const handleConfirmImport = () => {
    if (!parsedResult || parsedResult.jobs.length === 0) return
    
    if (importMode === 'replace') {
      StorageService.saveJobs(parsedResult.jobs)
      onSuccess(parsedResult.jobs.length)
    } else {
      const { added } = StorageService.batchAddJobs(parsedResult.jobs)
      onSuccess(added)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* 头部 */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.08] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 truncate">
                智能导入飞书多维表格
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-normal px-2 py-0.5 rounded-full border border-emerald-500/20 hidden sm:inline">
                  全 11 字段对齐
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                直接在飞书表格中全选复制（Ctrl+C）并粘贴到此处，算法自动消除错位
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Tab 切换 */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('paste'); setParsedResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'paste'
                  ? 'bg-white/[0.1] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              <span>直接粘贴表格文本</span>
            </button>
            <button
              onClick={() => { setActiveTab('file'); setParsedResult(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === 'file'
                  ? 'bg-white/[0.1] text-white font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>上传 Excel / CSV 文件</span>
            </button>
          </div>

          {/* 粘贴模式 */}
          {activeTab === 'paste' && !parsedResult && (
            <div className="space-y-3">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`👉 打开您的飞书秋招多维表格：\n1. 框选记录（可带表头或不带表头，包含：投递公司 | 优先级 | 投递日期 | 投递状态 | 类型与岗位 | base地 | 职位 | 行业 | 官网 | 备注 | 状态）\n2. 按下 Ctrl+C 复制后直接粘贴到这里\n3. 点击下方「开始智能识别」`}
                rows={8}
                className="w-full text-xs font-mono p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 placeholder:text-zinc-600 resize-none leading-relaxed"
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <p className="text-[11px] text-zinc-500">
                  ⚡ 智能消除分组折叠行与复选框干扰，严格对齐 11 列数据。
                </p>
                <button
                  onClick={handleParsePaste}
                  disabled={!pasteText.trim() || isProcessing}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 linear-btn-primary text-xs rounded-xl disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>开始智能识别</span>
                </button>
              </div>
            </div>
          )}

          {/* 上传文件模式 */}
          {activeTab === 'file' && !parsedResult && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-white/[0.1] hover:border-blue-500/50 bg-white/[0.02] hover:bg-white/[0.04] rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-full group-hover:scale-105 transition-transform mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-white text-center">点击选择或拖拽 Excel / CSV 文件</p>
              <p className="text-[11px] text-zinc-500 mt-1">支持从飞书导出的 .xlsx / .csv</p>
            </div>
          )}

          {/* 解析结果全字段实时核对预览 */}
          {parsedResult && (
            <div className="space-y-3">
              <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-semibold text-white">
                    已精准识别 {parsedResult.successCount} 条求职记录（11 字段完整对应）
                  </h4>
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs text-zinc-400 hover:text-white underline"
                >
                  重新粘贴
                </button>
              </div>

              {/* 11 列对齐核对预览表格 */}
              <div className="border border-white/[0.08] rounded-xl overflow-hidden max-h-64 overflow-y-auto overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse min-w-[850px]">
                  <thead className="bg-white/[0.03] text-zinc-400 sticky top-0 font-medium border-b border-white/[0.06] text-[11px]">
                    <tr>
                      <th className="p-2.5 pl-3">公司</th>
                      <th className="p-2.5">优先级</th>
                      <th className="p-2.5">投递日期</th>
                      <th className="p-2.5">投递状态</th>
                      <th className="p-2.5">类型与岗位</th>
                      <th className="p-2.5">base地</th>
                      <th className="p-2.5">职位</th>
                      <th className="p-2.5">行业</th>
                      <th className="p-2.5">官网</th>
                      <th className="p-2.5">状态/进展</th>
                      <th className="p-2.5 pr-3">备注</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {parsedResult.jobs.map((job, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 pl-3 font-semibold text-white whitespace-nowrap">{job.company}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {job.priority ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                              {job.priority}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2.5 text-zinc-400 font-mono whitespace-nowrap">{job.applyDate}</td>
                        <td className="p-2.5 text-zinc-300 whitespace-nowrap">{job.applyStatus}</td>
                        <td className="p-2.5 text-zinc-400 whitespace-nowrap">{job.category || '-'}</td>
                        <td className="p-2.5 text-zinc-300 whitespace-nowrap">{job.location || '-'}</td>
                        <td className="p-2.5 font-medium text-white max-w-[160px] truncate" title={job.role}>
                          {job.role}
                        </td>
                        <td className="p-2.5 text-zinc-400 max-w-[100px] truncate">{job.industry || '-'}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {job.jobUrl ? (
                            <span className="text-blue-400 text-[11px] truncate max-w-[80px] inline-block">{job.jobUrl}</span>
                          ) : '-'}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                            {job.status}
                          </span>
                        </td>
                        <td className="p-2.5 pr-3 text-zinc-400 truncate max-w-[120px] text-[11px]" title={job.notes}>
                          {job.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        {parsedResult && (
          <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-white/[0.08] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400">导入方式：</span>
              <button
                type="button"
                onClick={() => setImportMode('replace')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  importMode === 'replace'
                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30 font-semibold'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06]'
                }`}
              >
                覆盖替换全部 (清理旧数据)
              </button>
              <button
                type="button"
                onClick={() => setImportMode('append')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  importMode === 'append'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/30 font-semibold'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06]'
                }`}
              >
                追加合并
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold linear-btn-primary shadow-lg shadow-blue-500/20"
              >
                <span>{importMode === 'replace' ? '全新覆盖导入' : '追加导入'} ({parsedResult.successCount}条)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
