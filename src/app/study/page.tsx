'use client'

import { useState, useEffect } from 'react'
import {
  Brain,
  Code2,
  CheckCircle2,
  Sparkles,
  Plus,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  Copy,
  Check,
  Search,
  Filter,
  Terminal,
  BookOpen,
  HelpCircle,
} from 'lucide-react'
import { LeetCodeItem, KnowledgeFlashcard } from '@/types'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<'leetcode' | 'flashcards'>('leetcode')
  const [leetcodeList, setLeetcodeList] = useState<LeetCodeItem[]>([])
  const [flashcards, setFlashcards] = useState<KnowledgeFlashcard[]>([])
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({})
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 搜索过滤
  const [lcSearch, setLcSearch] = useState('')
  const [lcDifficultyFilter, setLcDifficultyFilter] = useState('all')
  const [fcSearch, setFcSearch] = useState('')
  const [fcCategoryFilter, setFcCategoryFilter] = useState('all')

  // 编辑 LeetCode 模态框
  const [editingLc, setEditingLc] = useState<LeetCodeItem | null>(null)
  const [isAddLcOpen, setIsAddLcOpen] = useState(false)
  const [newLc, setNewLc] = useState<Partial<LeetCodeItem>>({
    number: undefined,
    title: '',
    difficulty: 'Medium',
    tags: [],
    notes: '',
    code: '',
    solutionExplanation: '',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
  })

  // 编辑八股卡片模态框
  const [editingCard, setEditingCard] = useState<KnowledgeFlashcard | null>(null)
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [newCard, setNewCard] = useState<Partial<KnowledgeFlashcard>>({
    category: '大模型与 Agent 架构',
    question: '',
    answer: '',
    mastery: 'medium',
  })

  const loadData = () => {
    setLeetcodeList(StorageService.getLeetCode())
    setFlashcards(StorageService.getFlashcards())
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('workspace-data-updated', handleUpdate)
    return () => window.removeEventListener('workspace-data-updated', handleUpdate)
  }, [])

  // 艾宾浩斯复习打卡
  const handleReviewLc = (id: string) => {
    const today = getLocalDateKey()
    const nextDays = [1, 2, 4, 7, 15, 30]

    const updated = leetcodeList.map((item) => {
      if (item.id !== id) return item
      const nextStage = Math.min(nextDays.length - 1, item.reviewStage + 1)
      const daysToAdd = nextDays[nextStage]
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + daysToAdd)

      return {
        ...item,
        lastReviewed: today,
        nextReview: getLocalDateKey(nextDate),
        reviewStage: nextStage,
      }
    })

    setLeetcodeList(updated)
    StorageService.saveLeetCode(updated)
  }

  // 复制代码
  const handleCopyCode = (id: string, code?: string) => {
    if (!code) return
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 保存新增题目
  const handleSaveNewLc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLc.title) return
    const item: LeetCodeItem = {
      id: `lc-${Date.now()}`,
      number: newLc.number || 1,
      title: newLc.title,
      difficulty: (newLc.difficulty as any) || 'Medium',
      tags: newLc.tags && newLc.tags.length > 0 ? newLc.tags : ['高频算法'],
      lastReviewed: getLocalDateKey(),
      nextReview: getLocalDateKey(),
      reviewStage: 1,
      notes: newLc.notes || '',
      code: newLc.code || '',
      solutionExplanation: newLc.solutionExplanation || '',
      timeComplexity: newLc.timeComplexity || 'O(n)',
      spaceComplexity: newLc.spaceComplexity || 'O(1)',
    }
    const updated = [item, ...leetcodeList]
    setLeetcodeList(updated)
    StorageService.saveLeetCode(updated)
    setIsAddLcOpen(false)
    setNewLc({ number: undefined, title: '', difficulty: 'Medium', tags: [], notes: '', code: '', solutionExplanation: '', timeComplexity: 'O(n)', spaceComplexity: 'O(1)' })
  }

  // 保存修改现有题目
  const handleUpdateExistingLc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLc) return
    const updated = leetcodeList.map((item) => (item.id === editingLc.id ? editingLc : item))
    setLeetcodeList(updated)
    StorageService.saveLeetCode(updated)
    setEditingLc(null)
  }

  // 删除题目
  const handleDeleteLc = (id: string) => {
    if (confirm('确定删除这道 LeetCode 题目吗？')) {
      const updated = leetcodeList.filter((item) => item.id !== id)
      setLeetcodeList(updated)
      StorageService.saveLeetCode(updated)
    }
  }

  // 保存新增八股卡片
  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCard.question || !newCard.answer) return
    const item: KnowledgeFlashcard = {
      id: `fc-${Date.now()}`,
      category: newCard.category || '技术八股',
      question: newCard.question,
      answer: newCard.answer,
      mastery: (newCard.mastery as any) || 'medium',
      lastReviewDate: getLocalDateKey(),
    }
    const updated = [item, ...flashcards]
    setFlashcards(updated)
    StorageService.saveFlashcards(updated)
    setIsAddCardOpen(false)
    setNewCard({ category: '大模型与 Agent 架构', question: '', answer: '', mastery: 'medium' })
  }

  // 保存修改现有八股卡片
  const handleUpdateExistingCard = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCard) return
    const updated = flashcards.map((c) => (c.id === editingCard.id ? editingCard : c))
    setFlashcards(updated)
    StorageService.saveFlashcards(updated)
    setEditingCard(null)
  }

  // 删除八股卡片
  const handleDeleteCard = (id: string) => {
    if (confirm('确定删除该八股知识卡片吗？')) {
      const updated = flashcards.filter((c) => c.id !== id)
      setFlashcards(updated)
      StorageService.saveFlashcards(updated)
    }
  }

  // 快速切换掌握度
  const handleCycleMastery = (card: KnowledgeFlashcard) => {
    const nextMastery: Record<string, 'weak' | 'medium' | 'mastered'> = {
      weak: 'medium',
      medium: 'mastered',
      mastered: 'weak',
    }
    const updated = flashcards.map((c) => (c.id === card.id ? { ...c, mastery: nextMastery[c.mastery] } : c))
    setFlashcards(updated)
    StorageService.saveFlashcards(updated)
  }

  // LeetCode 过滤
  const filteredLeetcode = leetcodeList.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(lcSearch.toLowerCase()) ||
      item.number.toString().includes(lcSearch) ||
      item.tags.some((t) => t.toLowerCase().includes(lcSearch.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(lcSearch.toLowerCase()))
    const matchDiff = lcDifficultyFilter === 'all' || item.difficulty === lcDifficultyFilter
    return matchSearch && matchDiff
  })

  // 八股过滤
  const allCardCategories = Array.from(new Set(flashcards.map((c) => c.category)))
  const filteredFlashcards = flashcards.filter((card) => {
    const matchSearch =
      card.question.toLowerCase().includes(fcSearch.toLowerCase()) ||
      card.answer.toLowerCase().includes(fcSearch.toLowerCase()) ||
      card.category.toLowerCase().includes(fcSearch.toLowerCase())
    const matchCat = fcCategoryFilter === 'all' || card.category === fcCategoryFilter
    return matchSearch && matchCat
  })

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部标题与 Tab 切换 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <span>知识与算法复盘中心</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            力扣高频算法库（支持写入与编辑完整代码）· 艾宾浩斯记忆周期 · 核心技术八股卡片
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-xl border border-white/[0.08] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('leetcode')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'leetcode'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>LeetCode 算法题库 ({leetcodeList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-cyan-500/30'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>八股与系统记忆卡 ({flashcards.length})</span>
          </button>
        </div>
      </div>

      {/* ===================== Tab 1: LeetCode 算法题库 ===================== */}
      {activeTab === 'leetcode' && (
        <div className="space-y-4">
          {/* 工具条：搜索、难度筛选、添加题目 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl linear-card">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={lcSearch}
                  onChange={(e) => setLcSearch(e.target.value)}
                  placeholder="搜索题号、题目名称、标签（双指针/动态规划/二叉树）..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <select
                value={lcDifficultyFilter}
                onChange={(e) => setLcDifficultyFilter(e.target.value)}
                className="text-xs sm:text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="all" className="bg-[#10131d]">全部难度 ({leetcodeList.length})</option>
                <option value="Easy" className="bg-[#10131d]">Easy (简单)</option>
                <option value="Medium" className="bg-[#10131d]">Medium (中等)</option>
                <option value="Hard" className="bg-[#10131d]">Hard (困难)</option>
              </select>

              <button
                onClick={() => setIsAddLcOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs sm:text-sm font-medium shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>录入新题与完整代码</span>
              </button>
            </div>
          </div>

          {/* 题目卡片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeetcode.map((item) => {
              const isCodeExpanded = !!expandedCodes[item.id]

              return (
                <div key={item.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3.5 border border-white/[0.08] flex flex-col justify-between">
                  <div className="space-y-2.5">
                    {/* 头部：题号、标题、难度、操作 */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-mono font-bold text-xs bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/25 shrink-0">
                          #{item.number}
                        </span>
                        <h4 className="font-bold text-sm sm:text-base text-white truncate" title={item.title}>
                          {item.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
                          item.difficulty === 'Easy'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.difficulty === 'Medium'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {item.difficulty}
                        </span>

                        <button
                          onClick={() => setEditingLc(item)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
                          title="修改题目与完整代码"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLc(item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                          title="删除题目"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((t, idx) => (
                        <span key={idx} className="text-xs bg-white/[0.03] text-zinc-300 px-2 py-0.5 rounded-md font-medium border border-white/[0.05]">
                          {t}
                        </span>
                      ))}
                      {item.timeComplexity && (
                        <span className="text-xs bg-black/40 text-cyan-400 px-2 py-0.5 rounded-md font-mono border border-cyan-500/20">
                          {item.timeComplexity}
                        </span>
                      )}
                      {item.spaceComplexity && (
                        <span className="text-xs bg-black/40 text-indigo-400 px-2 py-0.5 rounded-md font-mono border border-indigo-500/20">
                          {item.spaceComplexity}
                        </span>
                      )}
                    </div>

                    {/* 核心思路说明 */}
                    {item.notes && (
                      <div className="p-3 rounded-xl bg-black/40 text-xs sm:text-sm text-zinc-300 border border-white/[0.05] leading-relaxed">
                        💡 <strong className="text-white font-medium">解题思路:</strong> {item.notes}
                      </div>
                    )}

                    {/* 完整代码展开栏 */}
                    {item.code ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setExpandedCodes((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>{isCodeExpanded ? '收起完整答案代码' : '查看完整答案代码 (Python/C++)'}</span>
                          </button>

                          {isCodeExpanded && (
                            <button
                              onClick={() => handleCopyCode(item.id, item.code)}
                              className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedId === item.id ? '已复制' : '复制代码'}</span>
                            </button>
                          )}
                        </div>

                        {isCodeExpanded && (
                          <div className="relative rounded-xl overflow-hidden border border-cyan-500/20 bg-[#05070c] animate-in fade-in">
                            <pre className="p-3.5 text-xs text-emerald-300 font-mono overflow-x-auto max-h-[320px] leading-relaxed select-text">
                              <code>{item.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 pt-1 flex items-center gap-1.5">
                        <span>未写入完整代码</span>
                        <button
                          onClick={() => setEditingLc(item)}
                          className="text-cyan-400 hover:underline"
                        >
                          点击补全代码 ➔
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 底部打卡与艾宾浩斯复习轮次 */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-xs text-zinc-400 gap-2 flex-wrap">
                    <span className="text-xs">
                      下次复习: <strong className="font-mono text-cyan-300">{item.nextReview}</strong> (第{item.reviewStage}轮)
                    </span>
                    <button
                      onClick={() => handleReviewLc(item.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/25 shrink-0"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>今日已打卡</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {filteredLeetcode.length === 0 && (
              <div className="col-span-full p-16 text-center text-zinc-500">
                <p className="text-base font-medium text-zinc-300">未找到匹配的算法题目</p>
                <p className="text-xs sm:text-sm mt-1">换个关键词搜索，或点击右上角「录入新题」录入</p>
              </div>
            )}
          </div>

          {/* ================= 编辑题目与写入代码模态框 ================= */}
          {editingLc && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-cyan-400" />
                    修改题目与写入完整答案代码
                  </h3>
                  <span className="text-xs font-mono text-zinc-400">ID: {editingLc.id}</span>
                </div>

                <form onSubmit={handleUpdateExistingLc} className="space-y-3.5 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">题号：</label>
                      <input
                        type="number"
                        required
                        value={editingLc.number}
                        onChange={(e) => setEditingLc({ ...editingLc, number: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-zinc-400 block mb-1">题目名称：</label>
                      <input
                        type="text"
                        required
                        value={editingLc.title}
                        onChange={(e) => setEditingLc({ ...editingLc, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">难度等级：</label>
                      <select
                        value={editingLc.difficulty}
                        onChange={(e) => setEditingLc({ ...editingLc, difficulty: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#141928] border border-white/[0.1] text-white"
                      >
                        <option value="Easy">Easy (简单)</option>
                        <option value="Medium">Medium (中等)</option>
                        <option value="Hard">Hard (困难)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">时间复杂度：</label>
                      <input
                        type="text"
                        placeholder="如: O(n)"
                        value={editingLc.timeComplexity || ''}
                        onChange={(e) => setEditingLc({ ...editingLc, timeComplexity: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">空间复杂度：</label>
                      <input
                        type="text"
                        placeholder="如: O(1)"
                        value={editingLc.spaceComplexity || ''}
                        onChange={(e) => setEditingLc({ ...editingLc, spaceComplexity: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">分类标签 (逗号分隔)：</label>
                    <input
                      type="text"
                      value={editingLc.tags.join(', ')}
                      onChange={(e) =>
                        setEditingLc({
                          ...editingLc,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">核心解题思路 / 技巧提炼：</label>
                    <textarea
                      rows={2}
                      value={editingLc.notes || ''}
                      onChange={(e) => setEditingLc({ ...editingLc, notes: e.target.value })}
                      placeholder="简述关键思路，如双指针对撞、滑动窗口、前缀和等..."
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-zinc-300 font-medium flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        <span>完整答案代码 (Python / C++ / Java)：</span>
                      </label>
                      <span className="text-[11px] text-zinc-500 font-mono">支持自由写入与格式保留</span>
                    </div>
                    <textarea
                      rows={10}
                      value={editingLc.code || ''}
                      onChange={(e) => setEditingLc({ ...editingLc, code: e.target.value })}
                      placeholder={`class Solution:\n    def solution(self, ...):\n        # 在此处贴入或编辑您的完整代码`}
                      className="w-full p-3 rounded-xl bg-[#05070c] border border-cyan-500/30 text-emerald-300 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setEditingLc(null)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存更新题目与代码
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= 新增题目与代码模态框 ================= */}
          {isAddLcOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  录入新 LeetCode 题目与完整代码
                </h3>
                <form onSubmit={handleSaveNewLc} className="space-y-3.5 text-xs sm:text-sm">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">题号：</label>
                      <input
                        type="number"
                        required
                        placeholder="如: 1"
                        value={newLc.number || ''}
                        onChange={(e) => setNewLc({ ...newLc, number: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-zinc-400 block mb-1">题目名称：</label>
                      <input
                        type="text"
                        required
                        placeholder="如: 两数之和 (Two Sum)"
                        value={newLc.title}
                        onChange={(e) => setNewLc({ ...newLc, title: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-zinc-400 block mb-1">难度等级：</label>
                      <select
                        value={newLc.difficulty}
                        onChange={(e) => setNewLc({ ...newLc, difficulty: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-[#141928] border border-white/[0.1] text-white"
                      >
                        <option value="Easy">Easy (简单)</option>
                        <option value="Medium">Medium (中等)</option>
                        <option value="Hard">Hard (困难)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">时间复杂度：</label>
                      <input
                        type="text"
                        placeholder="如: O(n)"
                        value={newLc.timeComplexity || ''}
                        onChange={(e) => setNewLc({ ...newLc, timeComplexity: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-zinc-400 block mb-1">空间复杂度：</label>
                      <input
                        type="text"
                        placeholder="如: O(1)"
                        value={newLc.spaceComplexity || ''}
                        onChange={(e) => setNewLc({ ...newLc, spaceComplexity: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">分类标签 (逗号分隔)：</label>
                    <input
                      type="text"
                      placeholder="哈希表, 双指针, 高频"
                      value={newLc.tags?.join(', ')}
                      onChange={(e) =>
                        setNewLc({
                          ...newLc,
                          tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">核心解题思路：</label>
                    <textarea
                      rows={2}
                      placeholder="记录核心算法逻辑..."
                      value={newLc.notes || ''}
                      onChange={(e) => setNewLc({ ...newLc, notes: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-300 font-medium block mb-1">写入完整答案代码：</label>
                    <textarea
                      rows={8}
                      placeholder={`class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        # 写入或粘贴完整代码`}
                      value={newLc.code || ''}
                      onChange={(e) => setNewLc({ ...newLc, code: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#05070c] border border-cyan-500/30 text-emerald-300 font-mono text-xs leading-relaxed resize-y focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsAddLcOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存新题目
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== Tab 2: 八股知识卡片 ===================== */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {/* 工具条 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl linear-card">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={fcSearch}
                  onChange={(e) => setFcSearch(e.target.value)}
                  placeholder="搜索八股问题、分类、核心答点关键字..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-black/40 border border-white/[0.08] rounded-xl text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <select
                value={fcCategoryFilter}
                onChange={(e) => setFcCategoryFilter(e.target.value)}
                className="text-xs sm:text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none"
              >
                <option value="all" className="bg-[#10131d]">全部分类 ({flashcards.length})</option>
                {allCardCategories.map((cat) => (
                  <option key={cat} value={cat} className="bg-[#10131d]">{cat}</option>
                ))}
              </select>

              <button
                onClick={() => setIsAddCardOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl linear-btn-primary text-xs sm:text-sm font-medium shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>新增八股卡片</span>
              </button>
            </div>
          </div>

          {/* 卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFlashcards.map((card) => {
              const isRevealed = revealedCards[card.id]

              return (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl linear-card space-y-3.5 flex flex-col justify-between border border-white/[0.08] relative group"
                >
                  <div>
                    {/* 卡片头部 */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/25">
                        {card.category}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingCard(card)}
                          className="p-1 rounded text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.06] transition-colors"
                          title="编辑该八股卡片"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-white/[0.06] transition-colors"
                          title="删除卡片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-white leading-relaxed">
                      Q: {card.question}
                    </h4>
                  </div>

                  {/* 答案显示区域 */}
                  <div className="space-y-2">
                    {isRevealed ? (
                      <div className="p-3.5 rounded-xl bg-black/50 text-xs sm:text-sm text-zinc-200 leading-relaxed border border-cyan-500/20 animate-in fade-in">
                        <strong className="text-cyan-400 block mb-1.5 font-medium flex items-center gap-1.5">
                          <span>💡 标准核心解析与答点：</span>
                        </strong>
                        <div className="whitespace-pre-line select-text">{card.answer}</div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setRevealedCards((prev) => ({ ...prev, [card.id]: true }))}
                        className="py-4 text-center text-xs sm:text-sm text-zinc-500 border border-dashed border-white/[0.08] rounded-xl hover:border-cyan-500/40 hover:text-zinc-300 cursor-pointer transition-colors"
                      >
                        点击查看答案解析
                      </div>
                    )}
                  </div>

                  {/* 底部掌握度与切换 */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/[0.05] text-xs">
                    <button
                      onClick={() => handleCycleMastery(card)}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] transition-colors"
                    >
                      <span className="text-zinc-400">掌握度:</span>
                      <span className={`font-semibold ${
                        card.mastery === 'mastered'
                          ? 'text-emerald-400'
                          : card.mastery === 'medium'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}>
                        {card.mastery === 'mastered' ? '已掌握熟记' : card.mastery === 'medium' ? '尚可待复盘' : '生疏薄弱'}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-zinc-500">复测: {card.lastReviewDate}</span>
                      <button
                        onClick={() => setRevealedCards((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                      >
                        {isRevealed ? '收起' : '展开答案'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ================= 编辑八股卡片弹窗 ================= */}
          {editingCard && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  修改八股知识卡片
                </h3>
                <form onSubmit={handleUpdateExistingCard} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">所属分类：</label>
                    <input
                      type="text"
                      required
                      value={editingCard.category}
                      onChange={(e) => setEditingCard({ ...editingCard, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">问题 (Question)：</label>
                    <input
                      type="text"
                      required
                      value={editingCard.question}
                      onChange={(e) => setEditingCard({ ...editingCard, question: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">参考答案与核心答点：</label>
                    <textarea
                      rows={6}
                      required
                      value={editingCard.answer}
                      onChange={(e) => setEditingCard({ ...editingCard, answer: e.target.value })}
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.1] text-white leading-relaxed resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">当前掌握程度：</label>
                    <select
                      value={editingCard.mastery}
                      onChange={(e) => setEditingCard({ ...editingCard, mastery: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-[#141928] border border-white/[0.1] text-white"
                    >
                      <option value="mastered">已掌握熟记 (Mastered)</option>
                      <option value="medium">尚可待复习 (Medium)</option>
                      <option value="weak">生疏薄弱项 (Weak)</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setEditingCard(null)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      保存更新
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= 新增八股卡片弹窗 ================= */}
          {isAddCardOpen && (
            <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-[#0c101c] border border-cyan-500/30 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in">
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  新增八股知识卡片
                </h3>
                <form onSubmit={handleSaveNewCard} className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="text-zinc-400 block mb-1">所属分类：</label>
                    <input
                      type="text"
                      required
                      placeholder="如: 大模型与 Agent 架构 / 计算机网络 / 操作系统"
                      value={newCard.category}
                      onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">问题 (Question)：</label>
                    <input
                      type="text"
                      required
                      placeholder="输入面试高频问题..."
                      value={newCard.question}
                      onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-black/50 border border-white/[0.1] text-white"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">标准核心答点 (Answer)：</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="清晰列出踩分点、核心原理与对比..."
                      value={newCard.answer}
                      onChange={(e) => setNewCard({ ...newCard, answer: e.target.value })}
                      className="w-full p-3 rounded-xl bg-black/50 border border-white/[0.1] text-white leading-relaxed resize-y"
                    />
                  </div>

                  <div>
                    <label className="text-zinc-400 block mb-1">初始掌握度：</label>
                    <select
                      value={newCard.mastery}
                      onChange={(e) => setNewCard({ ...newCard, mastery: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-[#141928] border border-white/[0.1] text-white"
                    >
                      <option value="medium">尚可待复习</option>
                      <option value="mastered">已熟练掌握</option>
                      <option value="weak">生疏薄弱</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
                    <button
                      type="button"
                      onClick={() => setIsAddCardOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl linear-btn-primary font-medium"
                    >
                      创建卡片
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
