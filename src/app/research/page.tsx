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
  Layers,
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

  const [isAddExpOpen, setIsAddExpOpen] = useState(false)
  const [newExp, setNewExp] = useState<Partial<ModelExperiment>>({
    modelName: '',
    taskType: '',
    dataset: '',
    hyperparameters: '',
    metrics: '待运行',
    status: 'not_started',
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

  const handleUpdateChapter = (chId: string, delta: Partial<ThesisChapter>) => {
    const updatedChapters = thesis.chapters.map((ch) => (ch.id === chId ? { ...ch, ...delta } : ch))
    const nextThesis = { ...thesis, chapters: updatedChapters }
    setThesis(nextThesis)
    StorageService.saveThesis(nextThesis)
  }

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExp.modelName) return
    const expItem: ModelExperiment = {
      id: `exp-${Date.now()}`,
      modelName: newExp.modelName || 'Custom-Model',
      taskType: newExp.taskType || '科研模拟',
      dataset: newExp.dataset || '工程数据集',
      hyperparameters: newExp.hyperparameters || 'lr: 1e-4',
      metrics: newExp.metrics || '待运行',
      status: (newExp.status as any) || 'not_started',
      date: getLocalDateKey(),
      notes: newExp.notes || '',
    }
    const updated = [expItem, ...models]
    setModels(updated)
    StorageService.saveModels(updated)
    setIsAddExpOpen(false)
    setNewExp({ modelName: '', taskType: '', dataset: '', hyperparameters: '', metrics: '待运行', status: 'not_started' })
  }

  const handleToggleMilestone = (id: string) => {
    const updated = milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    setMilestones(updated)
    StorageService.saveMilestones(updated)
  }

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

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部导航与 Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>硕士毕业管理</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 truncate max-w-2xl">
            《钻爆法隧道全工序机械化施工智能配置方法及系统研究》· 课题推进与节点把控
          </p>
        </div>

        {/* 4 大子版块切换 Tab (统一纯净质感，无刺眼高亮) */}
        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('thesis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'thesis'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>1. 论文撰写</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'models'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>2. 模拟与算法</span>
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'projects'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. 系统工程</span>
          </button>
          <button
            onClick={() => setActiveTab('milestones')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'milestones'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.1]'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>4. 毕业节点</span>
          </button>
        </div>
      </div>

      {/* ===================== 板块 1: 论文撰写 ===================== */}
      {activeTab === 'thesis' && (
        <div className="space-y-4 sm:space-y-6">
          {/* 论文总体进展卡片 */}
          <div className="p-4 sm:p-6 rounded-2xl linear-card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-medium text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
                  西南交通大学 硕士学位论文开题课题
                </span>
                <h2 className="text-sm sm:text-base font-semibold text-white mt-2.5 leading-snug">{thesis.title}</h2>
                <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-400 mt-2 flex-wrap">
                  <span>初稿节点: <strong className="text-zinc-200">{thesis.blindReviewDate}</strong></span>
                  <span>正式答辩: <strong className="text-zinc-200">{thesis.defenseDate}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end md:self-auto">
                <div className="text-right">
                  <p className="text-xs text-zinc-400">总字数进度</p>
                  <p className="text-lg sm:text-xl font-bold font-mono text-white">
                    {totalCurrentWords.toLocaleString()} <span className="text-xs font-normal text-zinc-500">/ {totalTargetWords.toLocaleString()} 字</span>
                  </p>
                </div>
                <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-full bg-white/[0.03] border-2 border-indigo-500 flex items-center justify-center font-bold font-mono text-xs sm:text-sm text-indigo-400">
                  {overallProgress}%
                </div>
              </div>
            </div>

            {/* 总体进度条 */}
            <div className="w-full bg-black/40 rounded-full h-2 mt-4 sm:mt-5 overflow-hidden border border-white/[0.06]">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* 章节分解卡片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {thesis.chapters.map((ch, idx) => {
              const chProgress = ch.targetWords > 0 ? Math.min(100, Math.round((ch.currentWords / ch.targetWords) * 100)) : 0

              return (
                <div key={ch.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500">
                        SECTION 0{idx + 1}
                      </span>
                      <h4 className="font-semibold text-xs sm:text-sm text-white mt-0.5 truncate">{ch.title}</h4>
                    </div>
                    <select
                      value={ch.status}
                      onChange={(e) => handleUpdateChapter(ch.id, { status: e.target.value as any })}
                      className="text-[11px] font-medium bg-white/[0.04] px-2 py-1 rounded-lg border border-white/[0.08] text-white focus:outline-none shrink-0"
                    >
                      <option value="not_started" className="bg-[#10131d]">未开始 (0%)</option>
                      <option value="in_progress" className="bg-[#10131d]">撰写中</option>
                      <option value="drafted" className="bg-[#10131d]">初稿</option>
                      <option value="revised" className="bg-[#10131d]">已修改</option>
                      <option value="completed" className="bg-[#10131d]">定稿</option>
                    </select>
                  </div>

                  {/* 字数微调 */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[11px]">当前字数:</span>
                      <input
                        type="number"
                        value={ch.currentWords}
                        onChange={(e) => handleUpdateChapter(ch.id, { currentWords: Number(e.target.value) || 0 })}
                        className="w-16 sm:w-20 px-2 py-1 bg-black/40 rounded-lg border border-white/[0.08] text-xs font-mono font-semibold text-white focus:outline-none focus:border-blue-500"
                      />
                      <span className="text-zinc-500 text-[11px]">/ {ch.targetWords} 字</span>
                    </div>
                    <span className="font-mono font-semibold text-indigo-400 text-xs">{chProgress}%</span>
                  </div>

                  {/* 进度条 */}
                  <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${chProgress}%` }}
                    />
                  </div>

                  {ch.notes && (
                    <p className="text-[11px] text-zinc-400 bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.05]">
                      💡 {ch.notes}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ===================== 板块 2: 模拟与算法 ===================== */}
      {activeTab === 'models' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-xs sm:text-sm text-white">力学模拟与算法台账</h3>
              <p className="text-xs text-zinc-400">记录超参数、物理力学约束与评测结果（目前处于开题规划阶段，待启动）</p>
            </div>
            <button
              onClick={() => setIsAddExpOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl linear-btn-primary text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>新建实验/模拟</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {models.map((exp) => (
              <div key={exp.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-mono uppercase ${
                    exp.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : exp.status === 'training'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                  }`}>
                    {exp.status === 'not_started' ? '未开始 / 规划中' : exp.status}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{exp.date}</span>
                </div>

                <div>
                  <h4 className="font-semibold text-xs sm:text-sm text-white line-clamp-1">{exp.modelName}</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{exp.taskType} · {exp.dataset}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/[0.02] text-xs font-mono space-y-1 border border-white/[0.05]">
                  <div className="text-zinc-500 text-[10px]">PARAMS:</div>
                  <div className="text-zinc-300 truncate text-[11px]">{exp.hyperparameters}</div>
                  <div className="text-zinc-500 text-[10px] pt-1">METRICS:</div>
                  <div className="text-zinc-400 font-medium text-[11px]">{exp.metrics}</div>
                </div>

                {exp.notes && (
                  <p className="text-[11px] text-zinc-400 line-clamp-2">
                    📝 {exp.notes}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 新增实验弹窗 */}
          {isAddExpOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
              <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-lg rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
                <h3 className="font-semibold text-sm text-white">录入新模拟/算法</h3>
                <form onSubmit={handleSaveExp} className="space-y-3 text-xs">
                  <input
                    type="text"
                    required
                    placeholder="模型/仿真名称 (如: Physics-Informed-NN-v1)"
                    value={newExp.modelName}
                    onChange={(e) => setNewExp({ ...newExp, modelName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="任务类型"
                      value={newExp.taskType}
                      onChange={(e) => setNewExp({ ...newExp, taskType: e.target.value })}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white"
                    />
                    <input
                      type="text"
                      placeholder="数据集 / 仿真工况"
                      value={newExp.dataset}
                      onChange={(e) => setNewExp({ ...newExp, dataset: e.target.value })}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="超参数 (lr, epoch, 网格尺寸等)"
                    value={newExp.hyperparameters}
                    onChange={(e) => setNewExp({ ...newExp, hyperparameters: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="核心指标 (如: 待运行 / Accuracy / MAE)"
                    value={newExp.metrics}
                    onChange={(e) => setNewExp({ ...newExp, metrics: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono"
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
                      className="px-4 py-2 rounded-xl linear-btn-primary"
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

      {/* ===================== 板块 3: 系统工程 ===================== */}
      {activeTab === 'projects' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 sm:p-6 rounded-2xl linear-card space-y-3.5 sm:space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base text-white truncate">{proj.name}</h4>
                    <p className="text-xs text-zinc-400 mt-1">{proj.description}</p>
                  </div>
                  <span className="font-mono font-semibold text-xs sm:text-sm text-blue-400 shrink-0">{proj.progress}%</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {proj.techStack.map((stk, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-zinc-400 font-mono border border-white/[0.05]"
                    >
                      {stk}
                    </span>
                  ))}
                </div>

                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                  <p className="text-xs font-medium text-zinc-300">系统开发任务清单 (0 进度待办)：</p>
                  {proj.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleToggleTask(proj.id, task.id)}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer transition-colors text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => {}}
                        className="rounded text-blue-500 cursor-pointer"
                      />
                      <span className={`break-words ${task.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== 板块 4: 毕业节点 ===================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-4 sm:space-y-6">
          <div className="p-4 sm:p-6 rounded-2xl linear-card">
            <h3 className="font-semibold text-xs sm:text-sm text-white mb-1">西南交通大学 硕士毕业关键时间轴</h3>
            <p className="text-xs text-zinc-400 mb-5 sm:mb-6">全周期里程碑与倒计时</p>

            <div className="relative border-l border-white/[0.1] ml-3 sm:ml-4 space-y-4 sm:space-y-6 py-2">
              {milestones.map((ms) => {
                const { days, isOverdue } = getDaysLeft(ms.targetDate)

                return (
                  <div key={ms.id} className="relative pl-5 sm:pl-6">
                    <div
                      onClick={() => handleToggleMilestone(ms.id)}
                      className={`absolute -left-[13px] top-0 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm ${
                        ms.completed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-[#10131d] border border-blue-500 text-blue-400'
                      }`}
                    >
                      {ms.completed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {ms.category}
                          </span>
                          <h4 className={`font-semibold text-xs ${ms.completed ? 'line-through text-zinc-500' : 'text-white'}`}>
                            {ms.title}
                          </h4>
                        </div>
                        <span className="text-xs font-mono text-zinc-400">
                          {ms.targetDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 gap-2 flex-wrap">
                        <p className="text-zinc-400 text-[11px]">{ms.notes || '暂无备注'}</p>
                        {!ms.completed && (
                          <span className="font-mono text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] border border-amber-500/20 shrink-0">
                            {isOverdue ? `已逾期 ${days} 天` : `剩余 ${days} 天`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
