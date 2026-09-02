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
} from 'lucide-react'
import { LeetCodeItem, KnowledgeFlashcard } from '@/types'
import { StorageService } from '@/lib/storage'
import { getLocalDateKey } from '@/lib/utils'

export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<'leetcode' | 'flashcards'>('leetcode')
  const [leetcodeList, setLeetcodeList] = useState<LeetCodeItem[]>([])
  const [flashcards, setFlashcards] = useState<KnowledgeFlashcard[]>([])
  const [revealedCards, setRevealedCards] = useState<Record<string, boolean>>({})

  const [isAddLcOpen, setIsAddLcOpen] = useState(false)
  const [newLc, setNewLc] = useState<Partial<LeetCodeItem>>({
    number: undefined,
    title: '',
    difficulty: 'Medium',
    tags: [],
    notes: '',
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

  const toggleReveal = (id: string) => {
    setRevealedCards((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleSaveLc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLc.title) return
    const item: LeetCodeItem = {
      id: `lc-${Date.now()}`,
      number: newLc.number || 1,
      title: newLc.title,
      difficulty: (newLc.difficulty as any) || 'Medium',
      tags: newLc.tags || ['算法'],
      lastReviewed: getLocalDateKey(),
      nextReview: getLocalDateKey(),
      reviewStage: 1,
      notes: newLc.notes || '',
    }
    const updated = [item, ...leetcodeList]
    setLeetcodeList(updated)
    StorageService.saveLeetCode(updated)
    setIsAddLcOpen(false)
    setNewLc({ number: undefined, title: '', difficulty: 'Medium', tags: [], notes: '' })
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* 头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 tracking-tight">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <span>知识与算法复习中心</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            LeetCode 高频算法 · 艾宾浩斯间隔复习 · 核心八股记忆卡
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('leetcode')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'leetcode'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            <span>LeetCode 算法库</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'flashcards'
                ? 'bg-white/[0.08] text-white font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>八股记忆卡</span>
          </button>
        </div>
      </div>

      {/* Tab 1: LeetCode */}
      {activeTab === 'leetcode' && (
        <div className="space-y-3.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-zinc-400">
              按艾宾浩斯周期提醒复习，保持算法手感
            </p>
            <button
              onClick={() => setIsAddLcOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl linear-btn-primary text-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>添加题目</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {leetcodeList.map((item) => (
              <div key={item.id} className="p-4 sm:p-5 rounded-2xl linear-card space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-semibold text-xs bg-white/[0.04] px-2 py-0.5 rounded text-zinc-300 border border-white/[0.05] shrink-0">
                      #{item.number}
                    </span>
                    <h4 className="font-semibold text-xs sm:text-sm text-white truncate">{item.title}</h4>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full font-mono shrink-0 ${
                    item.difficulty === 'Easy'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : item.difficulty === 'Medium'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {item.difficulty}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {item.tags.map((t, idx) => (
                    <span key={idx} className="text-[10px] bg-white/[0.03] text-zinc-400 px-2 py-0.5 rounded font-medium border border-white/[0.05]">
                      {t}
                    </span>
                  ))}
                </div>

                {item.notes && (
                  <div className="p-2.5 rounded-xl bg-white/[0.02] text-xs text-zinc-400 border border-white/[0.05]">
                    💡 <strong className="text-zinc-200 font-medium">核心思路:</strong> {item.notes}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs text-zinc-400 gap-2 flex-wrap">
                  <span className="text-[11px]">下次复习: <strong className="font-mono text-zinc-200">{item.nextReview}</strong> (第{item.reviewStage}轮)</span>
                  <button
                    onClick={() => handleReviewLc(item.id)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>今日已打卡</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 添加题目弹窗 */}
          {isAddLcOpen && (
            <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
              <div className="bg-[#10131d] border border-white/[0.1] w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
                <h3 className="font-semibold text-sm text-white">添加 LeetCode 题目</h3>
                <form onSubmit={handleSaveLc} className="space-y-3 text-xs">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="题号"
                      value={newLc.number || ''}
                      onChange={(e) => setNewLc({ ...newLc, number: Number(e.target.value) })}
                      className="w-20 p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="题目名称 (如: 翻转二叉树)"
                      value={newLc.title}
                      onChange={(e) => setNewLc({ ...newLc, title: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white"
                    />
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={newLc.difficulty}
                      onChange={(e) => setNewLc({ ...newLc, difficulty: e.target.value as any })}
                      className="p-2.5 rounded-xl bg-[#10131d] border border-white/[0.08] text-white"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                    <input
                      type="text"
                      placeholder="分类标签 (逗号分隔)"
                      value={newLc.tags?.join(', ')}
                      onChange={(e) => setNewLc({ ...newLc, tags: e.target.value.split(',').map((t) => t.trim()) })}
                      className="flex-1 p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white"
                    />
                  </div>

                  <textarea
                    rows={3}
                    placeholder="解题核心要点..."
                    value={newLc.notes || ''}
                    onChange={(e) => setNewLc({ ...newLc, notes: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-white resize-none"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddLcOpen(false)}
                      className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl linear-btn-primary"
                    >
                      保存题目
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 八股记忆卡 */}
      {activeTab === 'flashcards' && (
        <div className="space-y-3.5 sm:space-y-4">
          <p className="text-xs text-zinc-400">
            点击卡片自测答案，检验核心技术原理与知识盲区。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {flashcards.map((card) => {
              const isRevealed = revealedCards[card.id]

              return (
                <div
                  key={card.id}
                  onClick={() => toggleReveal(card.id)}
                  className="p-4 sm:p-5 rounded-2xl linear-card cursor-pointer space-y-3 select-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {card.category}
                      </span>
                      <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {isRevealed ? '收起解析' : '查看答案'}
                      </span>
                    </div>

                    <h4 className="font-semibold text-xs sm:text-sm text-white leading-relaxed">
                      Q: {card.question}
                    </h4>
                  </div>

                  {isRevealed ? (
                    <div className="p-3 rounded-xl bg-white/[0.03] text-xs text-zinc-300 leading-relaxed border border-white/[0.06] animate-in fade-in">
                      <strong className="text-blue-400 block mb-1 font-medium">💡 标准核心答点：</strong>
                      {card.answer}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-zinc-600 border border-dashed border-white/[0.06] rounded-xl">
                      点击卡片翻转查看解析
                    </div>
                  )}

                  <div className="text-[10px] text-zinc-500 pt-1 flex justify-between border-t border-white/[0.04]">
                    <span>掌握度: <strong className="text-emerald-400 font-medium">{card.mastery}</strong></span>
                    <span>上次自测: {card.lastReviewDate}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
