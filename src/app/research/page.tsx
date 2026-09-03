'use client'

import { useState, useEffect } from 'react'
import {
  GraduationCap,
  BookOpen,
  Cpu,
  Code2,
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Save,
  Network,
  Bot,
  Wrench,
  Compass,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import {
  ThesisInfo,
  ThesisChapter,
  ModelExperiment,
  ResearchProject,
  MilestoneItem,
} from '@/types'
import { StorageService } from '@/lib/storage'
import { getDaysLeft, getLocalDateKey } from '@/lib/utils'

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<'thesis' | 'models' | 'projects' | 'milestones'>('thesis')

  const [thesis, setThesis] = useState<ThesisInfo>(StorageService.getThesis())
  const [models, setModels] = useState<ModelExperiment[]>([])
  const [projects, setProjects] = useState<ResearchProject[]>([])
  const [milestones, setMilestones] = useState<MilestoneItem[]>([])

  // 编辑弹窗状态
  const [editingChapter, setEditingChapter] = useState<ThesisChapter | null>(null)
  const [editingExp, setEditingExp] = useState<ModelExperiment | null>(null)
  const [isAddExpOpen, setIsAddExpOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ResearchProject | null>(null)
  const [newProjectTaskText, setNewProjectTaskText] = useState('')
  const [editingMilestone, setEditingMilestone] = useState<MilestoneItem | null>(null)
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false)

  const [newExp, setNewExp] = useState<Partial<ModelExperiment>>({
    modelName: '',
    taskType: '非线性高维力学映射与安全性预测',
    dataset: '地质参数、围岩等级与支护工况数据集',
    hyperparameters: 'DNN (4隐含层) + AdamW, lr: 1e-4',
    metrics: '待运行 / R² 待评测',
    status: 'not_started',
    notes: '',
  })

  const [newMilestone, setNewMilestone] = useState<Partial<MilestoneItem>>({
    title: '',
    targetDate: '2026-12-20',
    category: '中期',
    completed: false,
    notes: '',
  })

  const loadAll = () => {
    setThesis(StorageService.getThesis())
    setModels(StorageService.getModels())
    setProjects(StorageService.getProjects())
    setMilestones(StorageService.getMilestones())
  }

  useEffect(() => {
    loadAll()
    window.addEventListener('workspace-data-updated', loadAll)
    return () => window.removeEventListener('workspace-data-updated', loadAll)
  }, [])

  const totalCurrentWords = thesis.chapters.reduce((acc, ch) => acc + (ch.currentWords || 0), 0)
  const totalTargetWords = thesis.chapters.reduce((acc, ch) => acc + (ch.targetWords || 0), 0)
  const overallProgress = totalTargetWords > 0 ? Math.round((totalCurrentWords / totalTargetWords) * 100) : 0

  // 论文与章节更新
  const handleUpdateChapter = (chId: string, delta: Partial<ThesisChapter>) => {
    const updatedChapters = thesis.chapters.map((ch) => (ch.id === chId ? { ...ch, ...delta } : ch))
    const nextThesis = { ...thesis, chapters: updatedChapters }
    setThesis(nextThesis)
    StorageService.saveThesis(nextThesis)
  }

  const handleSaveChapterModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingChapter) return
    handleUpdateChapter(editingChapter.id, editingChapter)
    setEditingChapter(null)
  }

  // 算法实验增删改
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExp.modelName) return
    const expItem: ModelExperiment = {
      id: `exp-${Date.now()}`,
      modelName: newExp.modelName || '地质-围岩-支护-安全性映射神经网络',
      taskType: newExp.taskType || '参数映射与安全性评价',
      dataset: newExp.dataset || '工程地质与数值模拟矩阵',
      hyperparameters: newExp.hyperparameters || 'DNN, lr: 1e-4',
      metrics: newExp.metrics || '待运行',
      status: (newExp.status as any) || 'not_started',
      date: getLocalDateKey(),
      notes: newExp.notes || '',
    }
    const updated = [expItem, ...models]
    setModels(updated)
    StorageService.saveModels(updated)
    setIsAddExpOpen(false)
    setNewExp({ modelName: '', taskType: '参数映射与安全性评价', dataset: '', hyperparameters: '', metrics: '待运行', status: 'not_started', notes: '' })
  }

  const handleUpdateExistingExp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExp) return
    const updated = models.map((m) => (m.id === editingExp.id ? editingExp : m))
    setModels(updated)
    StorageService.saveModels(updated)
    setEditingExp(null)
  }

  const handleDeleteExp = (id: string) => {
    if (confirm('确定删除该算法模型记录吗？')) {
      const updated = models.filter((m) => m.id !== id)
      setModels(updated)
      StorageService.saveModels(updated)
    }
  }

  // 系统工程任务与大系统修改
  const handleToggleTask = (projId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projId) return p
      const updatedTasks = p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
      const doneCount = updatedTasks.filter((t) => t.done).length
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0
      return { ...p, tasks: updatedTasks, progress }
    })
    setProjects(updated)
    StorageService.saveProjects(updated)
  }

  const handleAddTaskToProject = (projId: string) => {
    if (!newProjectTaskText.trim()) return
    const updated = projects.map((p) => {
      if (p.id !== projId) return p
      const updatedTasks = [...p.tasks, { id: `t-${Date.now()}`, text: newProjectTaskText.trim(), done: false }]
      const doneCount = updatedTasks.filter((t) => t.done).length
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0
      return { ...p, tasks: updatedTasks, progress }
    })
    setProjects(updated)
    StorageService.saveProjects(updated)
    setNewProjectTaskText('')
  }

  const handleDeleteProjectTask = (projId: string, taskId: string) => {
    const updated = projects.map((p) => {
      if (p.id !== projId) return p
      const updatedTasks = p.tasks.filter((t) => t.id !== taskId)
      const doneCount = updatedTasks.filter((t) => t.done).length
      const progress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : 0
      return { ...p, tasks: updatedTasks, progress }
    })
    setProjects(updated)
    StorageService.saveProjects(updated)
  }

  // 毕业里程碑操作
  const handleToggleMilestone = (id: string) => {
    const updated = milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    setMilestones(updated)
    StorageService.saveMilestones(updated)
  }

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMilestone.title || !newMilestone.targetDate) return
    const item: MilestoneItem = {
      id: `ms-${Date.now()}`,
      title: newMilestone.title,
      targetDate: newMilestone.targetDate,
      category: (newMilestone.category as any) || '中期',
      completed: !!newMilestone.completed,
      notes: newMilestone.notes || '',
    }
    const updated = [...milestones, item]
    setMilestones(updated)
    StorageService.saveMilestones(updated)
    setIsAddMilestoneOpen(false)
    setNewMilestone({ title: '', targetDate: '2026-12-20', category: '中期', completed: false, notes: '' })
  }

  const handleUpdateMilestoneModal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingMilestone) return
    const updated = milestones.map((m) => (m.id === editingMilestone.id ? editingMilestone : m))
    setMilestones(updated)
    StorageService.saveMilestones(updated)
    setEditingMilestone(null)
  }

  const handleDeleteMilestone = (id: string) => {
    if (confirm('确定删除该里程碑节点吗？')) {
      const updated = milestones.filter((m) => m.id !== id)
      setMilestones(updated)
      StorageService.saveMilestones(updated)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部导航与 Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>硕士毕业管理</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 truncate max-w-2xl">
            《钻爆法隧道全工序机械化施工智能配置方法及系统研究》
          </p>
        </div>

        {/* 4 大子版块切换 Tab */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('thesis')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'thesis'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>1. 论文撰写</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'models'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Network className="w-4 h-4 text-cyan-400" />
            <span>2. 映射神经网络算法</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'projects'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>3. 机械化施工大系统</span>
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'milestones'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <CalendarDays className="w-4 h-4 text-cyan-400" />
            <span>4. 毕业节点</span>
          </button>
        </div>
      </div>

      {/* ===================== 板块 1: 论文撰写 ===================== */}
      {activeTab === 'thesis' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 论文总体进展卡片 */}
          <div className="p-5 sm:p-6 rounded-2xl linear-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  西南交通大学
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white leading-snug">{thesis.title}</h2>
                <div className="flex items-center gap-3 sm:gap-6 text-xs text-zinc-400 flex-wrap">
                  <span>初稿完成送审: <strong className="text-cyan-300 font-mono">{thesis.blindReviewDate}</strong></span>
                  <span>正式答辩节点: <strong className="text-cyan-300 font-mono">{thesis.defenseDate}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                <div className="text-right">
                  <p className="text-xs text-zinc-400">总字数完成度</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {totalCurrentWords.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ {totalTargetWords.toLocaleString()} 字</span>
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border-2 border-cyan-500 flex items-center justify-center font-bold font-mono text-sm text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  {overallProgress}%
                </div>
              </div>
            </div>

            {/* 总体进度条 */}
            <div className="w-full bg-black/40 rounded-full h-2 mt-5 overflow-hidden border border-white/[0.08]">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* 章节分解卡片列表 (均可直接点击编辑) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thesis.chapters.map((ch, idx) => {
              const chProgress = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-mono text-cyan-400/80">
                        SECTION 0{idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm sm:text-base text-white mt-0.5 leading-tight">{ch.title}</h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setEditingChapter(ch)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
                        title="编辑章节详情"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <select
                        value={ch.status}
                        onChange={(e) => handleUpdateChapter(ch.id, { status: e.target.value as any })}
                        className="text-xs font-medium bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.1] text-white focus:outline-none shrink-0"
                      >
                        <option value="not_started" className="bg-[#10131d]">未开始 (0%)</option>
                        <option value="in_progress" className="bg-[#10131d]">撰写中</option>
                        <option value="drafted" className="bg-[#10131d]">初稿成型</option>
                        <option value="revised" className="bg-[#10131d]">导师批改后修改</option>
                        <option value="completed" className="bg-[#10131d]">已定稿</option>
                      </select>
                    </div>
                  </div>

                  {/* 字数快速修改 */}
                  <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-xs">当前字数:</span>
                      <input
                        type="number"
                        value={ch.currentWords}
                        onChange={(e) => handleUpdateChapter(ch.id, { currentWords: Number(e.target.value) || 0 })}
                        className="w-20 px-2 py-1 bg-black/50 rounded-lg border border-white/[0.1] text-xs sm:text-sm font-mono font-semibold text-white focus:outline-none focus:border-cyan-500"
                      />
                      <span className="text-zinc-500 text-xs">/ {ch.targetWords} 字</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400 text-xs sm:text-sm">{chProgress}%</span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${chProgress}%` }}
                    />
                  </div>

                  {ch.notes && (
                    <p className="text-xs text-zinc-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05] leading-relaxed">
                      💡 {ch.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {/* 章节编辑模态弹窗 */}
          {editingChapter && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e121e] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  编辑章节信息
                </h3>
                <form onSubmit={handleSaveChapterModal} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">章节标题：</label>
                    <input
                      type="text"
                      required
                      value={editingChapter.title}
                      onChange={(e) => setEditingChapter({ ...editingChapter, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">当前字数：</label>
                      <input
                        type="number"
                        value={editingChapter.currentWords}
                        onChange={(e) => setEditingChapter({ ...editingChapter, currentWords: Number(e.target.value) || 0 })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">目标规划字数：</label>
                      <input
                        type="number"
                        value={editingChapter.targetWords}
                        onChange={(e) => setEditingChapter({ ...editingChapter, targetWords: Number(e.target.value) || 0 })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">章节进展状态：</label>
                    <select
                      value={editingChapter.status}
                      onChange={(e) => setEditingChapter({ ...editingChapter, status: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-[#131826] border border-white/[0.1] text-white"
                    >
                      <option value="not_started">未开始</option>
                      <option value="in_progress">撰写中</option>
                      <option value="drafted">初稿成型</option>
                      <option value="revised">已按意见修改</option>
                      <option value="completed">已定稿</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">章节核心规划与备注：</label>
                    <textarea
                      rows={3}
                      value={editingChapter.notes || ''}
                      onChange={(e) => setEditingChapter({ ...editingChapter, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingChapter(null)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存章节
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== 板块 2: 映射神经网络算法 (核心唯一算法) ===================== */}
      {activeTab === 'models' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />
                硕士课题核心算法模型台账
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                训练深度神经网络模型：找到「地质参数、围岩等级、支护参数」与「结构安全性」之间的非线性映射关系
              </p>
            </div>
            <button
              onClick={() => setIsAddExpOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs sm:text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>新建实验算法</span>
            </button>
          </div>

          {/* 算法卡片列表 */}
          <div className="grid grid-cols-1 gap-4">
            {models.map((exp) => (
              <div key={exp.id} className="p-5 sm:p-6 rounded-2xl linear-card space-y-4 border border-cyan-500/20">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-mono border border-cyan-500/25 uppercase">
                      {exp.status === 'not_started' ? '规划启动阶段' : exp.status}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">登记日期: {exp.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingExp(exp)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] rounded-lg border border-white/[0.08] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>编辑算法</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExp(exp.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-base sm:text-lg text-white">{exp.modelName}</h4>
                  <p className="text-xs sm:text-sm text-cyan-400/90 mt-1">
                    任务类型: {exp.taskType}
                  </p>
                </div>

                {/* 详细参数与数据集 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-zinc-500 font-mono text-xs">DATASET / 特征矩阵:</div>
                    <div className="text-zinc-200 text-xs leading-relaxed">{exp.dataset}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-zinc-500 font-mono text-xs">HYPERPARAMETERS / 超参数:</div>
                    <div className="text-zinc-200 font-mono text-xs leading-relaxed">{exp.hyperparameters}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] space-y-1">
                    <div className="text-zinc-500 font-mono text-xs">TARGET METRICS / 评价指标:</div>
                    <div className="text-cyan-300 font-mono font-semibold text-xs leading-relaxed">{exp.metrics}</div>
                  </div>
                </div>

                {exp.notes && (
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    💡 <strong className="text-white font-medium">算法机理与映射逻辑：</strong>
                    {exp.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 编辑算法模态弹窗 */}
          {editingExp && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e121e] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  修改算法模型参数
                </h3>
                <form onSubmit={handleUpdateExistingExp} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">算法模型名称：</label>
                    <input
                      type="text"
                      required
                      value={editingExp.modelName}
                      onChange={(e) => setEditingExp({ ...editingExp, modelName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">任务类型：</label>
                    <input
                      type="text"
                      value={editingExp.taskType}
                      onChange={(e) => setEditingExp({ ...editingExp, taskType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">训练数据集 / 输入输出特征：</label>
                    <input
                      type="text"
                      value={editingExp.dataset}
                      onChange={(e) => setEditingExp({ ...editingExp, dataset: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">模型超参数 (架构, lr, loss 等)：</label>
                    <input
                      type="text"
                      value={editingExp.hyperparameters}
                      onChange={(e) => setEditingExp({ ...editingExp, hyperparameters: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">指标评价 (R², MAE, 安全度等)：</label>
                    <input
                      type="text"
                      value={editingExp.metrics}
                      onChange={(e) => setEditingExp({ ...editingExp, metrics: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">详细机理说明与备忘：</label>
                    <textarea
                      rows={3}
                      value={editingExp.notes || ''}
                      onChange={(e) => setEditingExp({ ...editingExp, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingExp(null)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存更新
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 新增算法弹窗 */}
          {isAddExpOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e121e] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white">新建实验与算法模型</h3>
                <form onSubmit={handleSaveExp} className="space-y-3 text-xs sm:text-sm">
                  <input
                    type="text"
                    required
                    placeholder="模型名称 (如: GeoSupportSafety-DNN-v2)"
                    value={newExp.modelName}
                    onChange={(e) => setNewExp({ ...newExp, modelName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="任务类型"
                    value={newExp.taskType}
                    onChange={(e) => setNewExp({ ...newExp, taskType: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                  />
                  <input
                    type="text"
                    placeholder="数据集特征说明"
                    value={newExp.dataset}
                    onChange={(e) => setNewExp({ ...newExp, dataset: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                  />
                  <input
                    type="text"
                    placeholder="超参数 (如: lr: 1e-4, 4-layers DNN)"
                    value={newExp.hyperparameters}
                    onChange={(e) => setNewExp({ ...newExp, hyperparameters: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="评测指标"
                    value={newExp.metrics}
                    onChange={(e) => setNewExp({ ...newExp, metrics: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                  />
                  <textarea
                    rows={3}
                    placeholder="实验设计思路与映射关系笔记..."
                    value={newExp.notes || ''}
                    onChange={(e) => setNewExp({ ...newExp, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddExpOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存实验
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== 板块 3: 机械化施工大系统工程 ===================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-cyan-400" />
                全工序机械化施工智能决策与协同配置大系统
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                包含装备配置、工法选配、支护参数配置子系统，深度介入 RAG 与工程智能体板块
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="p-5 sm:p-7 rounded-2xl linear-card space-y-5 border border-cyan-500/20">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                        核心系统架构
                      </span>
                      <span className="font-mono text-xs text-zinc-500">ID: {proj.id}</span>
                    </div>
                    <h4 className="font-bold text-base sm:text-xl text-white">{proj.name}</h4>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">{proj.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-base sm:text-xl text-cyan-400">{proj.progress}%</span>
                    <p className="text-[11px] text-zinc-500">子系统协同进度</p>
                  </div>
                </div>

                {/* 技术栈标签 */}
                <div className="flex flex-wrap gap-1.5">
                  {proj.techStack.map((stk, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] text-zinc-300 font-mono border border-white/[0.08]"
                    >
                      {stk}
                    </span>
                  ))}
                </div>

                {/* 进度条 */}
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>

                {/* 四大子系统子任务清单 (可直接点击打勾完成、添加、删除) */}
                <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-cyan-400" />
                      子系统与板块任务清单 ({proj.tasks.filter((t) => t.done).length} / {proj.tasks.length} 已完成)
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {proj.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(proj.id, task.id)}
                        className="flex items-start gap-3 p-3 rounded-xl bg-black/40 hover:bg-white/[0.04] cursor-pointer transition-colors border border-white/[0.05] group"
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => {}}
                          className="rounded text-cyan-500 cursor-pointer mt-1"
                        />
                        <span className={`flex-1 text-xs sm:text-sm leading-relaxed ${task.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProjectTask(proj.id, task.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-opacity"
                          title="删除该任务"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* 快速追加新任务 */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={newProjectTaskText}
                      onChange={(e) => setNewProjectTaskText(e.target.value)}
                      placeholder="为大系统追加子模块或研发任务..."
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={() => handleAddTaskToProject(proj.id)}
                      className="px-4 py-2 rounded-xl linear-btn-primary text-xs sm:text-sm font-medium shrink-0"
                    >
                      追加任务
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 板块 4: 毕业关键节点 (中期在12月份且未完成) ===================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="p-5 sm:p-7 rounded-2xl linear-card space-y-6 border border-cyan-500/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-cyan-400" />
                  西南交通大学 硕士毕业全周期里程碑时间轴
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  全周期里程碑时间轴与毕业考核进度把控
                </p>
              </div>

              <button
                onClick={() => setIsAddMilestoneOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs sm:text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>新增毕业节点</span>
              </button>
            </div>

            <div className="relative border-l border-white/[0.1] ml-4 sm:ml-6 space-y-6 py-2">
              {milestones.map((ms) => {
                const { days, isOverdue } = getDaysLeft(ms.targetDate)

                return (
                  <div key={ms.id} className="relative pl-6 sm:pl-8">
                    <div
                      onClick={() => handleToggleMilestone(ms.id)}
                      className={`absolute -left-[15px] top-0 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm ${
                        ms.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#0a0e19] border-2 border-cyan-500 text-cyan-400'
                      }`}
                    >
                      {ms.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 group hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                            {ms.category}
                          </span>
                          <h4 className={`font-bold text-sm sm:text-base ${ms.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                            {ms.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs sm:text-sm font-mono text-cyan-400 font-bold">
                            {ms.targetDate}
                          </span>
                          <button
                            onClick={() => setEditingMilestone(ms)}
                            className="p-1 text-zinc-400 hover:text-cyan-300 rounded"
                            title="编辑节点"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="p-1 text-zinc-500 hover:text-rose-400 rounded"
                            title="删除节点"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm pt-1 gap-2 flex-wrap">
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{ms.notes || '暂无备注说明'}</p>
                        {!ms.completed && (
                          <span className="font-mono text-amber-400 font-semibold bg-amber-500/10 px-3 py-1 rounded-full text-xs border border-amber-500/20 shrink-0">
                            {isOverdue ? `已逾期 ${days} 天` : `倒计时: 剩余 ${days} 天`}
                          </span>
                        )}
                        {ms.completed && (
                          <span className="font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full text-xs border border-emerald-500/20 shrink-0">
                            已考核通过
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 编辑里程碑弹窗 */}
          {editingMilestone && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e121e] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  修改里程碑节点
                </h3>
                <form onSubmit={handleUpdateMilestoneModal} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">节点名称：</label>
                    <input
                      type="text"
                      required
                      value={editingMilestone.title}
                      onChange={(e) => setEditingMilestone({ ...editingMilestone, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">目标日期：</label>
                      <input
                        type="date"
                        required
                        value={editingMilestone.targetDate}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, targetDate: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">类别：</label>
                      <select
                        value={editingMilestone.category}
                        onChange={(e) => setEditingMilestone({ ...editingMilestone, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#131826] border border-white/[0.1] text-white"
                      >
                        <option value="开题">开题</option>
                        <option value="中期">中期</option>
                        <option value="预答辩">预答辩</option>
                        <option value="盲审">盲审</option>
                        <option value="答辩">答辩</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="completed-check"
                      checked={editingMilestone.completed}
                      onChange={(e) => setEditingMilestone({ ...editingMilestone, completed: e.target.checked })}
                      className="rounded text-cyan-500 cursor-pointer"
                    />
                    <label htmlFor="completed-check" className="text-zinc-300 cursor-pointer text-xs sm:text-sm">
                      标记为已考核完成
                    </label>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">备忘说明：</label>
                    <textarea
                      rows={3}
                      value={editingMilestone.notes || ''}
                      onChange={(e) => setEditingMilestone({ ...editingMilestone, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingMilestone(null)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存节点
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 新增里程碑弹窗 */}
          {isAddMilestoneOpen && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0e121e] border border-cyan-500/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white">新增毕业里程碑节点</h3>
                <form onSubmit={handleSaveMilestone} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">节点名称：</label>
                    <input
                      type="text"
                      required
                      placeholder="如: 学位论文中期考核答辩"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">截止日期：</label>
                      <input
                        type="date"
                        required
                        value={newMilestone.targetDate}
                        onChange={(e) => setNewMilestone({ ...newMilestone, targetDate: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">类别：</label>
                      <select
                        value={newMilestone.category}
                        onChange={(e) => setNewMilestone({ ...newMilestone, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#131826] border border-white/[0.1] text-white"
                      >
                        <option value="开题">开题</option>
                        <option value="中期">中期</option>
                        <option value="预答辩">预答辩</option>
                        <option value="盲审">盲审</option>
                        <option value="答辩">答辩</option>
                        <option value="其他">其他</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">节点要求与备忘：</label>
                    <textarea
                      rows={3}
                      placeholder="记录该节点的考核要求与交付物..."
                      value={newMilestone.notes || ''}
                      onChange={(e) => setNewMilestone({ ...newMilestone, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddMilestoneOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      创建节点
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
