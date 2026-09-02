export type JobStatus =
  | 'wishlist'     // 意向准备
  | 'applied'      // 已投递
  | 'assessment'   // 笔试/测评
  | 'interview1'   // 技术一面
  | 'interview2'   // 二面/交叉面
  | 'hr'           // HR面/终面
  | 'offer'        // 意向书/Offer
  | 'rejected'     // 已挂/流程终止

export interface InterviewRecord {
  id: string
  round: string
  date: string
  time?: string
  interviewer?: string
  questions: string[]
  feedback?: string
  rating?: number
}

export interface JobApplication {
  id: string
  company: string
  role: string
  department?: string
  location?: string
  applyDate: string
  status: JobStatus
  salary?: string
  jobUrl?: string
  source?: string
  interviews?: InterviewRecord[]
  notes?: string
  updatedAt: string
  tags?: string[]
}

// 飞书导入解析结果
export interface FeishuImportResult {
  total: number
  successCount: number
  failedCount: number
  jobs: JobApplication[]
  unmatchedHeaders: string[]
}

// 科研与硕士毕业
export interface ThesisChapter {
  id: string
  title: string
  targetWords: number
  currentWords: number
  status: 'not_started' | 'in_progress' | 'drafted' | 'revised' | 'completed'
  notes?: string
}

export interface ThesisInfo {
  title: string
  defenseDate: string
  blindReviewDate: string
  chapters: ThesisChapter[]
}

export interface ModelExperiment {
  id: string
  modelName: string
  taskType: string
  dataset: string
  hyperparameters: string
  metrics: string // e.g. "Acc: 89.2%, Loss: 0.12, F1: 0.88"
  status: 'training' | 'completed' | 'failed' | 'aborted'
  date: string
  notes?: string
}

export interface ResearchProject {
  id: string
  name: string
  description: string
  techStack: string[]
  progress: number // 0-100
  repoUrl?: string
  tasks: { id: string; text: string; done: boolean }[]
}

export interface MilestoneItem {
  id: string
  title: string
  targetDate: string
  completed: boolean
  category: '开题' | '中期' | '预答辩' | '盲审' | '答辩' | '其他'
  notes?: string
}

// 复习与刷题
export interface LeetCodeItem {
  id: string
  number: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  tags: string[]
  lastReviewed: string
  nextReview: string
  reviewStage: number // 艾宾浩斯复习轮次 0,1,2,3,4,5
  notes?: string
}

export interface KnowledgeFlashcard {
  id: string
  category: string
  question: string
  answer: string
  mastery: 'weak' | 'medium' | 'mastered'
  lastReviewDate: string
}

// 日常生活
export interface DailyTop3Item {
  id: string
  text: string
  done: boolean
  category?: 'research' | 'career' | 'study' | 'life'
}

export interface HabitItem {
  id: string
  name: string
  color: string
  icon: string
  logs: Record<string, boolean> // YYYY-MM-DD -> true
}

export interface EnergyMoodLog {
  date: string
  energy: number // 1-5
  mood: number // 1-5
  journal?: string
}

export interface QuickCaptureNote {
  id: string
  content: string
  createdAt: string
  tags?: string[]
}
