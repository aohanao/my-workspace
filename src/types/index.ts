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

// 完整对齐飞书表格字段体系
export interface JobApplication {
  id: string
  company: string          // 投递公司
  priority?: string        // 优先级 (高 / 中 / 低)
  applyDate: string        // 投递日期 (YYYY-MM-DD)
  applyStatus?: string     // 投递状态 (已投递 / 待投递 / 未投)
  category?: string        // 类型与岗位 (秋招 研发 / 算法 / 软件)
  department?: string      // 部门 / 类别
  location?: string        // base地 (广州 / 深圳 / 北京 / 成都)
  role: string             // 职位 (如 AI Agent技术研发工程师)
  industry?: string        // 行业 (互联网/科技 / 智能建造)
  jobUrl?: string          // 官网 (投递网址链接)
  status: JobStatus        // 状态 / 当前进展 (笔试 / 一面 / 二面 / HR / Offer / 淘汰)
  notes?: string           // 备注
  salary?: string          // 薪资 / 待遇
  source?: string          // 来源渠道
  interviews?: InterviewRecord[]
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
  metrics: string // e.g. "待运行"
  status: 'not_started' | 'training' | 'completed' | 'failed' | 'aborted'
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
  code?: string // 完整答案代码
  solutionExplanation?: string // 详细题解思路
  timeComplexity?: string // 时间复杂度 如 O(n)
  spaceComplexity?: string // 空间复杂度 如 O(1)
}

export interface KnowledgeFlashcard {
  id: string
  category: string
  question: string
  answer: string
  mastery: 'weak' | 'medium' | 'mastered'
  lastReviewDate: string
}

// 日常生活与待办四象限
export type TaskPriority = '重急' | '轻急' | '重缓' | '轻缓'

export interface DailyTop3Item {
  id: string
  text: string
  done: boolean
  category?: 'research' | 'career' | 'study' | 'life'
  priority?: TaskPriority
}

export interface TimeBlockItem {
  id: string
  period: 'morning' | 'afternoon' | 'evening'
  periodLabel: string
  timeRange: string
  title: string
  tasks: { time: string; activity: string }[]
}

export interface WeeklyMatrixCategory {
  category: string
  color?: string
  items: {
    name: string
    checks: Record<string, boolean> // '周一' | '周二' | '周三' ... -> boolean
  }[]
}

export interface HabitItem {
  id: string
  name: string
  color: string
  icon: string
  category?: string
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

