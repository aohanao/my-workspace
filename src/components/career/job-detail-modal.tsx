'use client'

import { useState } from 'react'
import {
  X,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  Plus,
  Trash2,
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
  { value: 'offer', label: '录用 / Offer', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
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
        {/* 顶部 */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/[0.06] flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
              {formData.company.substring(0, 1) || '企'}
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="公司名称"
                className="font-bold text-base sm:text-lg text-white bg-transparent border-b border-transparent hover:border-white/[0.1] focus:border-blue-500 focus:outline-none px-1 w-full truncate"
              />
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                placeholder="申请岗位"
                className="text-xs text-zinc-400 bg-transparent border-b border-transparent hover:border-white/[0.1] focus:border-blue-500 focus:outline-none px-1 block mt-0.5 w-full truncate"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (confirm(`确定要删除 ${formData.company || '该记录'} 的投递吗？`)) {
                  onDelete(formData.id)
                  onClose()
                }
              }}
              className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              title="删除记录"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/[0.06] rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 text-xs">
          {/* 当前状态选择 */}
          <div>
            <label className="block text-zinc-400 font-medium mb-2">当前求职阶段：</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((st) => (
                <button
                  type="button"
                  key={st.value}
                  onClick={() => handleStatusChange(st.value)}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                    formData.status === st.value
                      ? `${st.color} border-current ring-1 ring-blue-500/40 shadow-sm font-semibold bg-white/[0.08]`
                      : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 基本属性网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-blue-400" /> 工作城市 / Base
              </label>
              <input
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="例如: 北京 / 深圳 / Remote"
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> 投递日期
              </label>
              <input
                type="date"
                value={formData.applyDate || ''}
                onChange={(e) => setFormData({ ...formData, applyDate: e.target.value })}
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> 薪资 / 预期待遇
              </label>
              <input
                type="text"
                value={formData.salary || ''}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                placeholder="例如: 35k*16薪 / 年包40w"
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> 部门 / 业务线
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="例如: AI Lab / 核心交易"
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <LinkIcon className="w-3.5 h-3.5 text-blue-400" /> 投递渠道 / 官网链接
              </label>
              <input
                type="text"
                value={formData.jobUrl || formData.source || ''}
                onChange={(e) => setFormData({ ...formData, jobUrl: e.target.value })}
                placeholder="官网或内推码"
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 flex items-center gap-1 mb-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> 核心技术标签 (逗号分隔)
              </label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) })}
                placeholder="例如: 大模型, PyTorch, C++"
                className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 面试复盘与题库记录 */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <span>📝 面试轮次与考点复盘</span>
                <span className="text-[11px] font-normal text-zinc-500">
                  ({formData.interviews?.length || 0} 轮记录)
                </span>
              </h4>
              <button
                type="button"
                onClick={handleAddInterview}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs transition-colors border border-blue-500/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新增一轮面试</span>
              </button>
            </div>

            {formData.interviews && formData.interviews.length > 0 ? (
              <div className="space-y-3">
                {/* 轮次 Tab (支持移动端滑动) */}
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 overflow-x-auto">
                  {formData.interviews.map((iv, idx) => (
                    <button
                      type="button"
                      key={iv.id}
                      onClick={() => setActiveInterviewIndex(idx)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeInterviewIndex === idx
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-white/[0.03] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {iv.round || `第 ${idx + 1} 轮`} ({iv.date})
                    </button>
                  ))}
                </div>

                {currentInterview && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={currentInterview.round}
                        onChange={(e) => {
                          const updated = [...formData.interviews!]
                          updated[activeInterviewIndex].round = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        placeholder="轮次名称 (如: 技术一面)"
                        className="p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white"
                      />
                      <input
                        type="date"
                        value={currentInterview.date}
                        onChange={(e) => {
                          const updated = [...formData.interviews!]
                          updated[activeInterviewIndex].date = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        className="p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white"
                      />
                      <input
                        type="text"
                        value={currentInterview.interviewer || ''}
                        onChange={(e) => {
                          const updated = [...formData.interviews!]
                          updated[activeInterviewIndex].interviewer = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        placeholder="面试官/风格"
                        className="p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white"
                      />
                    </div>

                    {/* 被问到的问题清单 */}
                    <div className="space-y-2">
                      <label className="text-zinc-400 font-medium">
                        被问到的高频考点 / 手撕算法：
                      </label>
                      <div className="space-y-1.5">
                        {currentInterview.questions?.map((q, qIdx) => (
                          <div key={qIdx} className="flex items-center justify-between p-2 rounded-lg bg-black/30 border border-white/[0.06] text-xs">
                            <span className="font-mono text-zinc-200 flex-1 break-words">{qIdx + 1}. {q}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(qIdx)}
                              className="text-zinc-500 hover:text-rose-400 p-1 shrink-0"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddQuestion())}
                          placeholder="输入题目/八股考点后回车添加..."
                          className="flex-1 p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white"
                        />
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] rounded-lg text-white font-medium shrink-0"
                        >
                          添加
                        </button>
                      </div>
                    </div>

                    {/* 面试复盘与评价 */}
                    <div>
                      <label className="text-zinc-400 font-medium mb-1 block">
                        面试表现反思 / 改进点：
                      </label>
                      <textarea
                        rows={2}
                        value={currentInterview.feedback || ''}
                        onChange={(e) => {
                          const updated = [...formData.interviews!]
                          updated[activeInterviewIndex].feedback = e.target.value
                          setFormData({ ...formData, interviews: updated })
                        }}
                        placeholder="记录答得不好的地方、后续需巩固的盲区..."
                        className="w-full p-2 rounded-lg bg-black/40 border border-white/[0.08] text-white resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-zinc-500 py-2 text-center text-xs">暂无面试记录，点击右上角添加一轮</p>
            )}
          </div>

          {/* 备注 */}
          <div>
            <label className="text-zinc-400 font-medium mb-1 block">总体备注与公司信息：</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="其他需要备忘的信息..."
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white resize-none"
            />
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.05]"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl linear-btn-primary"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
