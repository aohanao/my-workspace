'use client'

import { useState, useEffect, useRef } from 'react'
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
  X,
} from 'lucide-react'
import {
  ThesisInfo,
  ThesisChapter,
  ModelExperiment,
  ResearchProject,
  MilestoneItem,
} from '@/types'
import { StorageService } from '@/lib/storage'
import { getThesisWordProgress } from '@/lib/thesis-progress'
import { getDaysLeft, getLocalDateKey } from '@/lib/utils'
import '@/styles/workspace-theme.css'

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<'thesis' | 'models' | 'projects' | 'milestones'>('thesis')

  const [thesis, setThesis] = useState<ThesisInfo>(StorageService.getThesis())
  const [isOutlineOpen, setIsOutlineOpen] = useState(false)
  const [isEditingOutline, setIsEditingOutline] = useState(false)
  const [outlineDraft, setOutlineDraft] = useState('')
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

  // 论文题目与关键时间节点编辑状态
  const [isEditingThesisDates, setIsEditingThesisDates] = useState(false)
  const [thesisDatesForm, setThesisDatesForm] = useState({
    title: '',
    blindReviewDate: '',
    defenseDate: '',
  })
  const blindReviewInputRef = useRef<HTMLInputElement>(null)
  const defenseInputRef = useRef<HTMLInputElement>(null)

  const [newExp, setNewExp] = useState<Partial<ModelExperiment>>({
    modelName: '',
    taskType: '力学响应预测 / 支护智能决策',
    dataset: '地质—开挖—支护力学时序数据库',
    hyperparameters: '候选架构与超参数待验证集选择',
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

  const { totalCurrentWords, totalTargetWords, completedWords, percent: overallProgress } = getThesisWordProgress(thesis.chapters)

  // 论文题目与关键节点更新
  const handleOpenThesisDatesModal = (focusField?: 'blindReview' | 'defense') => {
    setThesisDatesForm({
      title: thesis.title,
      blindReviewDate: thesis.blindReviewDate || '2027-02-04',
      defenseDate: thesis.defenseDate || '2027-05-20',
    })
    setIsEditingThesisDates(true)
    setTimeout(() => {
      if (focusField === 'blindReview') {
        blindReviewInputRef.current?.focus()
      } else if (focusField === 'defense') {
        defenseInputRef.current?.focus()
      }
    }, 60)
  }

  const handleSaveThesisDates = (e: React.FormEvent) => {
    e.preventDefault()
    if (!thesisDatesForm.blindReviewDate || !thesisDatesForm.defenseDate) return

    const updatedThesis: ThesisInfo = {
      ...thesis,
      title: thesisDatesForm.title.trim() || thesis.title,
      blindReviewDate: thesisDatesForm.blindReviewDate,
      defenseDate: thesisDatesForm.defenseDate,
    }

    setThesis(updatedThesis)
    StorageService.saveThesis(updatedThesis)
    StorageService.saveThesisDraftDeadline(thesisDatesForm.blindReviewDate)

    // 同步更新里程碑列表中对应的初稿送审与答辩节点（如存在）
    const updatedMilestones = milestones.map((ms) => {
      if (ms.id === 'ms-4' || ms.category === '预答辩' || ms.title.includes('初稿')) {
        return { ...ms, targetDate: thesisDatesForm.blindReviewDate }
      }
      if (ms.id === 'ms-6' || ms.category === '答辩' || ms.title.includes('答辩')) {
        return { ...ms, targetDate: thesisDatesForm.defenseDate }
      }
      return ms
    })
    setMilestones(updatedMilestones)
    StorageService.saveMilestones(updatedMilestones)

    setIsEditingThesisDates(false)
    window.dispatchEvent(new CustomEvent('workspace-data-updated'))
  }

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

  const handleSaveOutline = () => {
    const outline = outlineDraft.trim()
    if (!outline) return
    const nextThesis = { ...thesis, outline }
    setThesis(nextThesis)
    StorageService.saveThesis(nextThesis)
    setIsEditingOutline(false)
  }

  // 算法实验增删改
  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExp.modelName) return
    const expItem: ModelExperiment = {
      id: `exp-${Date.now()}`,
      modelName: newExp.modelName || '支护智能决策模型',
      taskType: newExp.taskType || '参数映射与安全性评价',
      dataset: newExp.dataset || '工程地质与数值模拟矩阵',
      hyperparameters: newExp.hyperparameters || '待验证集选择',
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

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editingProject.name.trim() || editingProject.tasks.some((task) => !task.text.trim())) return
    const tasks = editingProject.tasks.map((task) => ({ ...task, text: task.text.trim() }))
    const updated = projects.map((project) => project.id === editingProject.id ? {
      ...editingProject, name: editingProject.name.trim(), description: editingProject.description.trim(),
      techStack: editingProject.techStack.map((item) => item.trim()).filter(Boolean), tasks,
      progress: tasks.length ? Math.round(tasks.filter((task) => task.done).length / tasks.length * 100) : 0,
    } : project)
    setProjects(updated)
    StorageService.saveProjects(updated)
    setEditingProject(null)
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
    <div className="workspace-theme space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部导航与 Tab */}
      <div className="workspace-hero flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 sm:gap-4">
        <div className="min-w-0">
          <p className="workspace-eyebrow">ACADEMIC WORKSPACE / RESEARCH</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2.5 sm:gap-3 tracking-tight">
            <div className="workspace-hero-icon p-2 sm:p-2.5 rounded-2xl border">
              <GraduationCap className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <span>硕士毕业管理</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 truncate max-w-2xl">
            《{thesis.title}》
          </p>
        </div>

        {/* 4 大子版块切换 Tab */}
        <div className="workspace-tabs flex items-center gap-1 p-1 rounded-full border overflow-x-auto max-w-full shrink-0">
          <button
            onClick={() => setActiveTab('thesis')}
            aria-pressed={activeTab === 'thesis'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'thesis'
                ? 'workspace-tab-active font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. 论文撰写</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            aria-pressed={activeTab === 'models'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'models'
                ? 'workspace-tab-active font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>2. 算法与模型训练</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            aria-pressed={activeTab === 'projects'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'projects'
                ? 'workspace-tab-active font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>3. 机械化施工大系统</span>
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            aria-pressed={activeTab === 'milestones'}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'milestones'
                ? 'workspace-tab-active font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>4. 毕业节点</span>
          </button>
        </div>
      </div>

      {/* ===================== 板块 1: 论文撰写 ===================== */}
      {activeTab === 'thesis' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 论文总体进展卡片 */}
          <div className="workspace-feature p-4 sm:p-6 rounded-2xl linear-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-zinc-300 bg-white/[0.06] px-3 py-1 rounded-full border border-white/[0.1] inline-block">
                  西南交通大学
                </span>
                <h2
                  onClick={() => handleOpenThesisDatesModal()}
                  className="text-base sm:text-lg font-bold text-white leading-snug cursor-pointer hover:text-cyan-300 transition-colors"
                  title="点击直接修改论文题目与毕业节点"
                >
                  {thesis.title}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setOutlineDraft(thesis.outline || '')
                    setIsEditingOutline(false)
                    setIsOutlineOpen(true)
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-300/10 hover:bg-cyan-300/20 border border-cyan-300/30 text-cyan-200 text-xs font-medium transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  查看论文大纲
                </button>
                <div className="flex items-center gap-2.5 sm:gap-4 text-xs text-zinc-400 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleOpenThesisDatesModal('blindReview')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-300/40 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs shadow-sm"
                    title="点击直接修改初稿完成送审日期"
                  >
                    <span className="text-zinc-400">初稿完成送审:</span>
                    <strong className="text-white font-mono">{thesis.blindReviewDate}</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenThesisDatesModal('defense')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-cyan-300/40 text-zinc-300 hover:text-white transition-all cursor-pointer text-xs shadow-sm"
                    title="点击直接修改正式答辩节点日期"
                  >
                    <span className="text-zinc-400">正式答辩节点:</span>
                    <strong className="text-white font-mono">{thesis.defenseDate}</strong>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                <div className="text-right">
                  <p className="text-xs text-zinc-400" title="每章最多按目标字数计入完成度，超出部分不抵扣其他章节">总字数完成度</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-white">
                    {completedWords.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ {totalTargetWords.toLocaleString()} 字</span>
                  </p>
                  {totalCurrentWords > completedWords && (
                    <p className="text-xs text-zinc-500 mt-1">实际已写 {totalCurrentWords.toLocaleString()} 字</p>
                  )}
                </div>
                <div className="w-14 h-14 rounded-full bg-cyan-200/[0.05] border-2 border-cyan-200/30 flex items-center justify-center font-bold font-mono text-sm text-cyan-200 shadow-sm">
                  {overallProgress}%
                </div>
              </div>
            </div>

            {/* 总体进度条 */}
            <div className="w-full bg-black/40 rounded-full h-1.5 mt-5 overflow-hidden border border-white/[0.08]">
              <div
                className="workspace-progress h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {isOutlineOpen && (
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
              <div role="dialog" aria-modal="true" aria-label="论文大纲" className="workspace-dialog bg-[#0e121e] border border-cyan-300/30 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-white/[0.08]">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-cyan-300" />论文大纲
                  </h3>
                  <div className="flex items-center gap-2">
                    {!isEditingOutline && (
                      <button type="button" onClick={() => setIsEditingOutline(true)} className="px-3 py-1.5 rounded-lg text-xs text-cyan-200 hover:bg-cyan-300/10 border border-cyan-300/20">编辑大纲</button>
                    )}
                    <button type="button" aria-label="关闭论文大纲" onClick={() => setIsOutlineOpen(false)} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08]"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                  {isEditingOutline ? (
                    <textarea
                      aria-label="编辑论文大纲"
                      value={outlineDraft}
                      onChange={(e) => setOutlineDraft(e.target.value)}
                      className="w-full min-h-[60vh] p-4 rounded-xl bg-black/40 border border-white/[0.1] text-zinc-100 text-sm leading-7 focus:outline-none focus:border-cyan-300 resize-y"
                    />
                  ) : (
                    <div className="space-y-1 text-sm leading-7">
                      {(thesis.outline || '').split('\n').map((line, index) => {
                        const isChapter = /^第[1-6]章\s/.test(line)
                        const isSection = /^\d+\.\d+\s/.test(line)
                        const isSubsection = /^\d+\.\d+\.\d+\s/.test(line)
                        return <p key={index} className={index === 0 ? 'text-white font-bold text-base pb-3' : isChapter ? 'text-cyan-200 font-semibold text-base pt-5 pb-1 border-b border-white/[0.08]' : isSubsection ? 'text-zinc-400 pl-5 sm:pl-8' : isSection ? 'text-zinc-200 font-medium pl-2 sm:pl-4 pt-1' : 'text-zinc-300 pt-2'}>{line}</p>
                      })}
                    </div>
                  )}
                </div>
                {isEditingOutline && (
                  <div className="flex justify-end gap-2 p-4 border-t border-white/[0.08]">
                    <button type="button" onClick={() => { setIsEditingOutline(false); setOutlineDraft(thesis.outline || '') }} className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white">取消</button>
                    <button type="button" onClick={handleSaveOutline} disabled={!outlineDraft.trim()} className="px-4 py-2 rounded-xl linear-btn-primary font-medium disabled:opacity-50">保存大纲</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 章节分解卡片列表 (均可直接点击编辑) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {thesis.chapters.map((ch, idx) => {
              const chProgress = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3 relative group">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => setEditingChapter(ch)}
                      className="min-w-0 flex-1 cursor-pointer group/title"
                      title="点击直接编辑章节详情"
                    >
                      <span className="text-xs font-mono text-cyan-300/80">
                        SECTION 0{idx + 1}
                      </span>
                      <h4 className="font-semibold text-sm sm:text-base text-white mt-0.5 leading-tight group-hover/title:text-cyan-300 transition-colors">
                        {ch.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={ch.status}
                        onChange={(e) => handleUpdateChapter(ch.id, { status: e.target.value as any })}
                        className="text-xs font-medium bg-black/40 px-2.5 py-1 rounded-lg border border-white/[0.1] text-white focus:outline-none shrink-0"
                      >
                        <option value="not_started" className="bg-[#101824]">未开始 (0%)</option>
                        <option value="in_progress" className="bg-[#101824]">撰写中</option>
                        <option value="drafted" className="bg-[#101824]">初稿成型</option>
                        <option value="revised" className="bg-[#101824]">导师批改后修改</option>
                        <option value="completed" className="bg-[#101824]">已定稿</option>
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
                        className="w-20 px-2 py-1 bg-black/50 rounded-lg border border-white/[0.1] text-xs sm:text-sm font-mono font-semibold text-white focus:outline-none focus:border-cyan-300"
                      />
                      <span className="text-zinc-500 text-xs">/ {ch.targetWords} 字</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-300 text-xs sm:text-sm">{chProgress}%</span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="workspace-progress h-full rounded-full transition-all duration-300"
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
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="编辑章节信息" className="workspace-dialog bg-[#0e121e] border border-cyan-300/30 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-300" />
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
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300"
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

          {/* 修改论文及毕业关键时间节点模态框 */}
          {isEditingThesisDates && (
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="修改毕业与论文时间节点" className="workspace-dialog max-h-[90dvh] overflow-y-auto bg-[#0e121e] border border-cyan-300/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-cyan-300" />
                    <span>修改毕业与论文时间节点</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingThesisDates(false)}
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveThesisDates} className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-300 font-medium block mb-1.5">
                      论文题目：
                    </label>
                    <input
                      type="text"
                      required
                      value={thesisDatesForm.title}
                      onChange={(e) => setThesisDatesForm({ ...thesisDatesForm, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300 text-xs sm:text-sm"
                      placeholder="请输入硕士学位论文题目"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-300 font-medium">
                        初稿完成送审目标日期：
                      </label>
                      {thesisDatesForm.blindReviewDate && (
                        <span className="text-[11px] font-mono text-cyan-300">
                          {getDaysLeft(thesisDatesForm.blindReviewDate).isOverdue
                            ? '已截止'
                            : `倒计 ${getDaysLeft(thesisDatesForm.blindReviewDate).days} 天`}
                        </span>
                      )}
                    </div>
                    <input
                      ref={blindReviewInputRef}
                      type="date"
                      required
                      value={thesisDatesForm.blindReviewDate}
                      onChange={(e) => setThesisDatesForm({ ...thesisDatesForm, blindReviewDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono focus:outline-none focus:border-cyan-300"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      对应研究生院初稿定稿、查重及预审/双盲送审关键节点
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-zinc-300 font-medium">
                        正式答辩目标节点日期：
                      </label>
                      {thesisDatesForm.defenseDate && (
                        <span className="text-[11px] font-mono text-emerald-300">
                          {getDaysLeft(thesisDatesForm.defenseDate).isOverdue
                            ? '已截止'
                            : `倒计 ${getDaysLeft(thesisDatesForm.defenseDate).days} 天`}
                        </span>
                      )}
                    </div>
                    <input
                      ref={defenseInputRef}
                      type="date"
                      required
                      value={thesisDatesForm.defenseDate}
                      onChange={(e) => setThesisDatesForm({ ...thesisDatesForm, defenseDate: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono focus:outline-none focus:border-cyan-300"
                    />
                    <p className="text-[11px] text-zinc-500 mt-1">
                      对应西南交通大学硕士研究生终审与公开答辩节点
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsEditingThesisDates(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary font-medium flex items-center gap-1.5 shadow-md"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>确认修改</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== 板块 2: 算法与模型训练计划 ===================== */}
      {activeTab === 'models' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-300" />
                硕士课题算法与模型训练计划
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                第2—4章：机理特征与时序数据库 → 世界模型与安全评价 → 时空 Transformer 决策 → 反馈优化与验证
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
              <div key={exp.id} className="p-5 sm:p-6 rounded-2xl linear-card space-y-4 border border-white/[0.08]">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span data-state={exp.status} className="workspace-state-dot w-2 h-2 rounded-full" />
                    <span data-state={exp.status} className="workspace-state-badge text-xs font-medium px-3 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 font-mono border border-white/[0.1] uppercase">
                      {{ not_started: '规划启动阶段', training: '训练中', completed: '已完成', failed: '失败', aborted: '已中止' }[exp.status]}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">登记日期: {exp.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingExp({ ...exp })} className="flex items-center gap-1 px-2 py-1 text-xs text-cyan-300 hover:text-white"><Edit3 className="w-3.5 h-3.5" />编辑</button>
                    <button
                      onClick={() => handleDeleteExp(exp.id)}
                      className="p-1 text-zinc-500 hover:text-rose-300 rounded-lg transition-colors"
                      title="删除记录"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h4
                    onClick={() => setEditingExp(exp)}
                    className="font-bold text-base sm:text-lg text-white cursor-pointer hover:text-cyan-300 transition-colors"
                    title="点击直接编辑算法"
                  >
                    {exp.modelName}
                  </h4>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
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
                    <div className="text-white font-mono font-semibold text-xs leading-relaxed">{exp.metrics}</div>
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
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="修改算法模型参数" className="workspace-dialog bg-[#0e121e] border border-cyan-300/30 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-300" />
                  修改算法模型参数
                </h3>
                <form onSubmit={handleUpdateExistingExp} className="space-y-3.5 text-xs sm:text-sm"><label className="block text-zinc-400">训练状态<select value={editingExp.status} onChange={(e) => setEditingExp({ ...editingExp, status: e.target.value as ModelExperiment['status'] })} className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white"><option value="not_started">未开始</option><option value="training">训练中</option><option value="completed">已完成</option><option value="failed">失败</option><option value="aborted">已中止</option></select></label>
                  <div>
                    <label className="text-zinc-400 block mb-1">算法模型名称：</label>
                    <input
                      type="text"
                      required
                      value={editingExp.modelName}
                      onChange={(e) => setEditingExp({ ...editingExp, modelName: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300"
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
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="新建实验与算法模型" className="workspace-dialog bg-[#0e121e] border border-cyan-300/30 w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white">新建实验与算法模型</h3>
                <form onSubmit={handleSaveExp} className="space-y-3 text-xs sm:text-sm">
                  <input
                    type="text"
                    required
                    placeholder="模型名称（如：时空 Transformer 支护决策）"
                    value={newExp.modelName}
                    onChange={(e) => setNewExp({ ...newExp, modelName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300"
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
                    placeholder="候选架构、学习率、窗口与损失函数"
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
                <Code2 className="w-4 h-4 text-cyan-300" />
                全工序机械化施工智能决策与协同配置大系统
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                第5章：集成力学预测、安全评价、支护反馈决策与工法—支护—装备配置，开展工程应用验证
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="p-5 sm:p-7 rounded-2xl linear-card space-y-5 border border-cyan-300/20">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-md bg-cyan-300/15 text-cyan-300 text-xs font-semibold border border-cyan-300/30">
                        核心系统架构
                      </span>
                      <span className="font-mono text-xs text-zinc-500">ID: {proj.id}</span>
                    </div>
                    <h4 className="font-bold text-base sm:text-xl text-white">{proj.name}</h4>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-1 leading-relaxed">{proj.description}</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:block sm:w-auto sm:text-right shrink-0 sm:space-y-2">
                    <button onClick={() => setEditingProject({ ...proj, techStack: [...proj.techStack], tasks: proj.tasks.map((task) => ({ ...task })) })} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-cyan-300/30 text-xs text-cyan-300 hover:bg-cyan-300/10"><Edit3 className="w-4 h-4" />编辑系统与任务</button>
                    <span className="font-mono font-bold text-base sm:text-xl text-cyan-300">{proj.progress}%</span>
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
                    className="workspace-progress h-full rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>

                {/* 四大子系统子任务清单 (可直接点击打勾完成、添加、删除) */}
                <div className="space-y-3 pt-3 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-cyan-300" />
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
                          className="rounded text-cyan-300 cursor-pointer mt-1"
                        />
                        <span className={`flex-1 text-xs sm:text-sm leading-relaxed ${task.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                          {task.text}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteProjectTask(proj.id, task.id)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-300 transition-opacity"
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
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-black/50 border border-white/[0.08] text-white focus:outline-none focus:border-cyan-300"
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

          {editingProject && (
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-labelledby="project-editor-title" className="workspace-dialog bg-[#0e121e] border border-cyan-300/30 w-full max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl shadow-2xl p-6">
                <h3 id="project-editor-title" className="font-bold text-white mb-4">编辑大系统与模块任务</h3>
                <form onSubmit={handleSaveProject} className="space-y-4 text-sm">
                  <label className="block text-zinc-400">系统名称
                    <input autoFocus required value={editingProject.name} onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })} className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white" />
                  </label>
                  <label className="block text-zinc-400">系统说明与研究路线
                    <textarea rows={4} value={editingProject.description} onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })} className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white" />
                  </label>
                  <label className="block text-zinc-400">技术栈（每行一个）
                    <textarea rows={3} value={editingProject.techStack.join('\n')} onChange={(e) => setEditingProject({ ...editingProject, techStack: e.target.value.split('\n') })} className="mt-1 w-full p-2.5 rounded-xl bg-black/50 border border-white/10 text-white" />
                  </label>
                  <div className="space-y-3">
                    <p className="text-zinc-400">模块任务（可修改内容、勾选完成或删除；进度自动计算）</p>
                    {editingProject.tasks.map((task, index) => (
                      <div key={task.id} className="flex items-start gap-2">
                        <input type="checkbox" aria-label={'任务 ' + (index + 1) + ' 已完成'} checked={task.done} onChange={(e) => setEditingProject({ ...editingProject, tasks: editingProject.tasks.map((item) => item.id === task.id ? { ...item, done: e.target.checked } : item) })} className="mt-3" />
                        <textarea required aria-label={'模块任务 ' + (index + 1)} rows={3} value={task.text} onChange={(e) => setEditingProject({ ...editingProject, tasks: editingProject.tasks.map((item) => item.id === task.id ? { ...item, text: e.target.value } : item) })} className="flex-1 min-w-0 p-2.5 rounded-xl bg-black/50 border border-white/10 text-white" />
                        <button type="button" aria-label={'删除任务 ' + (index + 1)} onClick={() => setEditingProject({ ...editingProject, tasks: editingProject.tasks.filter((item) => item.id !== task.id) })} className="p-2 text-zinc-400 hover:text-rose-300"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditingProject({ ...editingProject, tasks: [...editingProject.tasks, { id: 't-' + crypto.randomUUID(), text: '', done: false }] })} className="text-cyan-300 px-3 py-2 rounded-xl border border-cyan-300/30">+ 添加模块任务</button>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 text-zinc-400 hover:text-white">取消</button>
                    <button type="submit" className="px-4 py-2 rounded-xl linear-btn-primary">保存系统规划</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== 板块 4: 毕业关键节点 (中期在12月份且未完成) ===================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="p-5 sm:p-7 rounded-2xl linear-card space-y-6 border border-cyan-300/20">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-cyan-300" />
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
                          : 'bg-[#0a0e19] border-2 border-cyan-300 text-cyan-300'
                      }`}
                    >
                      {ms.completed ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    </div>

                    <div className="p-4 sm:p-5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2 group hover:border-cyan-300/30 transition-colors">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div
                          onClick={() => setEditingMilestone(ms)}
                          className="flex items-center gap-2.5 cursor-pointer group/title"
                          title="点击直接修改里程碑节点"
                        >
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-300/10 text-cyan-300 border border-cyan-300/25">
                            {ms.category}
                          </span>
                          <h4 className={`font-bold text-sm sm:text-base group-hover/title:text-cyan-300 transition-colors ${ms.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                            {ms.title}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            onClick={() => setEditingMilestone(ms)}
                            className="text-xs sm:text-sm font-mono text-cyan-300 font-bold cursor-pointer hover:underline"
                            title="点击直接修改目标日期"
                          >
                            {ms.targetDate}
                          </span>
                          <button
                            onClick={() => handleDeleteMilestone(ms.id)}
                            className="p-1 text-zinc-500 hover:text-rose-300 rounded transition-colors"
                            title="删除节点"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs sm:text-sm pt-1 gap-2 flex-wrap">
                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{ms.notes || '暂无备注说明'}</p>
                        {!ms.completed && (
                          <span className="font-mono text-amber-300 font-semibold bg-amber-300/10 px-3 py-1 rounded-full text-xs border border-amber-300/20 shrink-0">
                            {isOverdue ? `已逾期 ${days} 天` : `倒计时: 剩余 ${days} 天`}
                          </span>
                        )}
                        {ms.completed && (
                          <span className="font-mono text-emerald-300 font-semibold bg-emerald-300/10 px-3 py-1 rounded-full text-xs border border-emerald-300/20 shrink-0">
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
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="修改里程碑节点" className="workspace-dialog max-h-[90dvh] overflow-y-auto bg-[#0e121e] border border-cyan-300/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-300" />
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
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300"
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
                      className="rounded text-cyan-300 cursor-pointer"
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
            <div className="workspace-modal-backdrop fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
              <div role="dialog" aria-modal="true" aria-label="新增毕业里程碑节点" className="workspace-dialog max-h-[90dvh] overflow-y-auto bg-[#0e121e] border border-cyan-300/30 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
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
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white focus:outline-none focus:border-cyan-300"
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
