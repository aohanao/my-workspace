import type { ThesisChapter } from '@/types'

export function getThesisWordProgress(
  chapters: Pick<ThesisChapter, 'currentWords' | 'targetWords'>[] = [],
) {
  let totalCurrentWords = 0
  let totalTargetWords = 0
  let completedWords = 0

  for (const chapter of chapters) {
    const currentWords = Math.max(0, chapter.currentWords || 0)
    const targetWords = Math.max(0, chapter.targetWords || 0)

    totalCurrentWords += currentWords
    totalTargetWords += targetWords
    // 每章最多贡献该章的目标字数，超出部分不能抵扣其他章节的进度。
    completedWords += Math.min(currentWords, targetWords)
  }

  const percent = totalTargetWords > 0
    ? Math.round((completedWords / totalTargetWords) * 100)
    : 0

  return { totalCurrentWords, totalTargetWords, completedWords, percent }
}
