'use client'

import { useState } from 'react'
import {
  X,
  Building2,
  MapPin,
  Calendar,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Trash2,
  Briefcase,
  Layers,
} from 'lucide-react'
import { JobApplication, JobStatus, InterviewRecord } from '@/types'
import { getLocalDateKey } from '@/lib/utils'

interface Props {
  job: JobApplication | null
  isOpen: boolean
  onClose: () => void
  onSave: (job: JobApplication) => void
  onDelete: (id: string) => void
}

const STATUS_OPTIONS: { value: JobStatus; label: string; color: string }[] = [
  { value: 'wishlist', label: '意向准备', color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  { value: 'applied', label: '已投递', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { value: 'assessment', label: '笔试/测评', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { value: 'interview1', label: '技术一面', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { value: 'interview2', label: '技术二面/交叉', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { value: 'hr', label: 'HR面/谈薪', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  { value: 'offer', label: '录用 / Offer 🎉', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { value: 'rejected', label: '流程终止 / 挂', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
]

export function JobDetailModal({ job, isOpen, onClose, onSave, onDelete }: Props) {
  if (!isOpen || !job) return null

  const [formData, setFormData] = useState<JobApplication>({ ...job })
  const [newQuestion, setNewQuestion] = useState('')
  const [activeInterviewIndex, setActiveInterviewIndex] = useState<number>(0)

  const handleStatusChange = (status: JobStatus) => {
    setFormData({ ...formData, status, updatedAt: new Date().toISOString() })
  }

  const handleAddInterview = () => {
    const newRecord: InterviewRecord = {
      id: `iv-${Date.now()}`,
      round: `面试轮次 ${(formData.interviews?.length || 0) + 1}`,
      date: getLocalDateKey(),
      questions: [],
      feedback: '',
      rating: 5,
    }
    const list = [...(formData.interviews || []), newRecord]
    setFormData({ ...formData, interviews: list })
    setActiveInterviewIndex(list.length - 1)
  }

  const handleAddQuestion = () => {
    if (!newQuestion.trim() || !formData.interviews || formData.interviews.length === 0) return
    const updated = [...formData.interviews]
    const cur = updated[activeInterviewIndex]
    cur.questions = [...(cur.questions || []), newQuestion.trim()]
    setFormData({ ...formData, interviews: updated })
    setNewQuestion('')
  }

  const handleRemoveQuestion = (qIndex: number) => {
    if (!formData.interviews) return
    const updated = [...formData.interviews]
    const cur = updated[activeInterviewIndex]
    cur.questions = cur.questions.filter((_, idx) => idx !== qIndex)
    setFormData({ ...formData, interviews: updated })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const currentInterview = formData.interviews?.[activeInterviewIndex]

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* 顶部标题栏 */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
              {formData.company.substring(0, 1) || '企'}
            </div>
            <div className="min-w-0">
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="投递公司名称..."
                className="font-bold text-base sm:text-lg text-white bg-transparent border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:outline-none w-full"
              />
              <p className="text-[11px] text-zinc-400 mt-0.5">秋招企业投递与全流程管理</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/[0.05] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 主表单区域 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
          {/* 状态阶段选择器 */}
          <div>
            <label className="text-zinc-400 font-medium block mb-2">当前进展阶段：</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isActive = formData.status === opt.value

                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? `${opt.color} border-current font-semibold shadow-sm`
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 飞书 11 字段矩阵表单 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            {/* 职位 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                职位 (Role)：
              </label>
              <input
                type="text"
                required
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="如: AI Agent技术研发工程师"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 类型与岗位 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                类型与岗位：
              </label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="如: 秋招 研发 / 算法 / 产品"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 优先级 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                优先级 (Priority)：
              </label>
              <select
                value={formData.priority || '中'}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none"
              >
                <option value="高" className="bg-[#10131d]">高 (核心意向 / 保底)</option>
                <option value="中" className="bg-[#10131d]">中 (主要投递)</option>
                <option value="低" className="bg-[#10131d]">低 (随缘/备选)</option>
              </select>
            </div>

            {/* base地 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                base地 (城市/地点)：
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="如: 广州 / 深圳 / 成都"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 投递日期 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                投递日期：
              </label>
              <input
                type="date"
                value={formData.applyDate}
                onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 行业 */}
            <div>
              <label className="text-zinc-400 font-medium block mb-1">
                所属行业：
              </label>
              <input
                type="text"
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                placeholder="如: 互联网/科技 / 智能建造"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 官网链接 */}
            <div className="sm:col-span-2">
              <label className="text-zinc-400 font-medium block mb-1">
                招聘官网 / 投递链接：
              </label>
              <input
                type="text"
                value={formData.jobUrl || ''}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                placeholder="https://job.bytedance.com / https://careers.tencent.com"
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* 备注 */}
            <div className="sm:col-span-2">
              <label className="text-zinc-400 font-medium block mb-1">
                备注 (Notes)：
              </label>
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="记录内推人、网申进度、面试重点要求..."
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
              />
            </div>
          </div>

          {/* 面试复盘与真题考点库 */}
          <div className="pt-3 border-t border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-amber-400" />
                面试考点与问答复盘记录
              </label>
              <button
                type="button"
                onClick={handleAddInterview}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>添加面试轮次</span>
              </button>
            </div>

            {/* 面试轮次 Tab */}
            {formData.interviews && formData.interviews.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {formData.interviews.map((iv, idx) => (
                    <button
                      type="button"
                      key={iv.id}
                      onClick={() => setActiveInterviewIndex(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                        activeInterviewIndex === idx
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:text-white'
                      }`}
                    >
                      {iv.round} ({iv.date})
                    </button>
                  ))}
                </div>

                {currentInterview && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={currentInterview.round}
                        onChange={(e) => {
                          const updated = [...(formData.interviews || [])]
                          updated[activeInterviewIndex].round = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        placeholder="轮次名称 (如: 技术一面)"
                        className="p-2 rounded-xl bg-black/40 border border-white/[0.08] text-white"
                      />
                      <input
                        type="date"
                        value={currentInterview.date}
                        onChange={(e) => {
                          const updated = [...(formData.interviews || [])]
                          updated[activeInterviewIndex].date = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        className="p-2 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono"
                      />
                    </div>

                    {/* 提问考点列表 */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-zinc-400 font-medium">被问到的高频考点 / 算法手撕题：</p>
                      {currentInterview.questions.map((q, qIdx) => (
                        <div key={qIdx} className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-zinc-200 text-xs break-words">{q}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-zinc-500 hover:text-rose-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}

                      {/* 添加问题 */}
                      <div className="flex gap-2 pt-1">
                        <input
                          type="text"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          placeholder="输入本轮面试官提问或算法题，回车添加..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddQuestion()
                            }
                          }}
                          className="flex-1 p-2 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300"
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 py-3 text-center bg-white/[0.01] rounded-xl border border-white/[0.04]">
                暂无面试记录，可在收到笔面试通知后点击上方「添加面试轮次」
              </p>
            )}
          </div>

          {/* 底部保存与删除按钮 */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between">
            {job.id && !job.id.startsWith('job-new') ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`确定要删除 ${formData.company} 的投递记录吗？`)) {
                    onDelete(job.id)
                    onClose()
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除记录</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
              >
                保存投递
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
