'use client'

import {
  JobApplication,
  ThesisInfo,
  ModelExperiment,
  ResearchProject,
  MilestoneItem,
  LeetCodeItem,
  KnowledgeFlashcard,
  DailyTop3Item,
  HabitItem,
  QuickCaptureNote,
  EnergyMoodLog,
  TimeBlockItem,
} from '@/types'
import {
  INITIAL_JOBS,
  INITIAL_THESIS,
  INITIAL_MODELS,
  INITIAL_PROJECTS,
  INITIAL_MILESTONES,
  INITIAL_LEETCODE,
  INITIAL_FLASHCARDS,
  INITIAL_TOP3,
  INITIAL_HABITS,
  INITIAL_NOTES,
  INITIAL_TIMEBLOCKS,
} from './sample-data'
import { getSupabase, isSupabaseConfigured } from './supabase'

export const STORAGE_KEYS = {
  JOBS: 'workspace_jobs_v4',
  THESIS: 'workspace_thesis_v4',
  MODELS: 'workspace_models_v4',
  PROJECTS: 'workspace_projects_v4',
  MILESTONES: 'workspace_milestones_v4',
  LEETCODE: 'workspace_leetcode_v4',
  FLASHCARDS: 'workspace_flashcards_v4',
  TOP3: 'workspace_top3_v4',
  HABITS: 'workspace_habits_v4',
  NOTES: 'workspace_notes_v4',
  ENERGY_MOOD_LOGS: 'workspace_energy_mood_logs_v4',
  TIMEBLOCKS: 'workspace_timeblocks_v4',
}

export type CloudSyncStatus = 'unconfigured' | 'syncing' | 'synced' | 'error'

let currentSyncStatus: CloudSyncStatus = isSupabaseConfigured() ? 'syncing' : 'unconfigured'
let lastSyncTime: string | null = null

function dispatchStatusChange() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('workspace-sync-status', {
      detail: { status: currentSyncStatus, lastSyncTime },
    })
  )
}

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const item = localStorage.getItem(key)
    if (item) return JSON.parse(item)

    // 平滑兼容迁移：若 v4 为空且是 jobs/notes，检查是否有 v3 数据
    if (key.endsWith('_v4')) {
      const oldKey = key.replace('_v4', '_v3')
      const oldItem = localStorage.getItem(oldKey)
      if (oldItem && (key === STORAGE_KEYS.JOBS || key === STORAGE_KEYS.NOTES)) {
        return JSON.parse(oldItem)
      }
    }

    return fallback
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e)
    return fallback
  }
}

function setItem<T>(key: string, value: T, syncCloud = true): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
    // 派发自定义事件以支持跨组件即时响应
    window.dispatchEvent(new CustomEvent('workspace-data-updated', { detail: { key } }))

    // 异步同步至 Supabase 云端数据库
    if (syncCloud && isSupabaseConfigured()) {
      syncKeyToCloud(key, value)
    }
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e)
  }
}

async function syncKeyToCloud(key: string, value: any) {
  const supabase = getSupabase()
  if (!supabase) return

  try {
    currentSyncStatus = 'syncing'
    dispatchStatusChange()

    const { error } = await supabase.from('workspace_storage').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    })

    if (error) {
      console.warn(`Supabase sync failed for ${key}:`, error.message)
      currentSyncStatus = 'error'
    } else {
      currentSyncStatus = 'synced'
      lastSyncTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }
    dispatchStatusChange()
  } catch (err) {
    console.warn(`Supabase error for ${key}:`, err)
    currentSyncStatus = 'error'
    dispatchStatusChange()
  }
}

export const StorageService = {
  // 云端同步状态
  getSyncStatus: (): { status: CloudSyncStatus; isConfigured: boolean; lastSyncTime: string | null } => {
    return {
      status: currentSyncStatus,
      isConfigured: isSupabaseConfigured(),
      lastSyncTime,
    }
  },

  // 初始化从云端拉取全量数据
  initCloudSync: async () => {
    if (typeof window === 'undefined') return
    if (!isSupabaseConfigured()) {
      currentSyncStatus = 'unconfigured'
      dispatchStatusChange()
      return
    }

    const supabase = getSupabase()
    if (!supabase) return

    try {
      currentSyncStatus = 'syncing'
      dispatchStatusChange()

      const { data, error } = await supabase.from('workspace_storage').select('key, value')

      if (error) {
        console.warn('Failed to fetch from Supabase:', error.message)
        currentSyncStatus = 'error'
        dispatchStatusChange()
        return
      }

      if (data && data.length > 0) {
        // 云端有数据，同步写入本地 LocalStorage
        data.forEach((row) => {
          if (row.key && row.value !== undefined) {
            localStorage.setItem(row.key, JSON.stringify(row.value))
          }
        })
        currentSyncStatus = 'synced'
        lastSyncTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        dispatchStatusChange()
        window.dispatchEvent(new CustomEvent('workspace-data-updated', { detail: { source: 'cloud-pull' } }))
      } else {
        // 云端表为空（初次部署），自动将本地全量数据推送到云端
        await StorageService.pushAllToCloud()
      }
    } catch (err) {
      console.warn('initCloudSync error:', err)
      currentSyncStatus = 'error'
      dispatchStatusChange()
    }
  },

  // 手动/首次将本地全量数据推送到 Supabase 云端
  pushAllToCloud: async () => {
    const supabase = getSupabase()
    if (!supabase) return false

    try {
      currentSyncStatus = 'syncing'
      dispatchStatusChange()

      const payload = [
        { key: STORAGE_KEYS.JOBS, value: StorageService.getJobs() },
        { key: STORAGE_KEYS.THESIS, value: StorageService.getThesis() },
        { key: STORAGE_KEYS.MODELS, value: StorageService.getModels() },
        { key: STORAGE_KEYS.PROJECTS, value: StorageService.getProjects() },
        { key: STORAGE_KEYS.MILESTONES, value: StorageService.getMilestones() },
        { key: STORAGE_KEYS.LEETCODE, value: StorageService.getLeetCode() },
        { key: STORAGE_KEYS.FLASHCARDS, value: StorageService.getFlashcards() },
        { key: STORAGE_KEYS.TOP3, value: StorageService.getTop3() },
        { key: STORAGE_KEYS.HABITS, value: StorageService.getHabits() },
        { key: STORAGE_KEYS.NOTES, value: StorageService.getNotes() },
        { key: STORAGE_KEYS.ENERGY_MOOD_LOGS, value: StorageService.getEnergyMoodLogs() },
        { key: STORAGE_KEYS.TIMEBLOCKS, value: StorageService.getTimeBlocks() },
      ]

      const { error } = await supabase.from('workspace_storage').upsert(
        payload.map((item) => ({ ...item, updated_at: new Date().toISOString() }))
      )

      if (error) {
        console.warn('pushAllToCloud error:', error.message)
        currentSyncStatus = 'error'
        dispatchStatusChange()
        return false
      }

      currentSyncStatus = 'synced'
      lastSyncTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      dispatchStatusChange()
      return true
    } catch (err) {
      console.warn('pushAllToCloud exception:', err)
      currentSyncStatus = 'error'
      dispatchStatusChange()
      return false
    }
  },

  // 求职数据
  getJobs: (): JobApplication[] => getItem(STORAGE_KEYS.JOBS, INITIAL_JOBS),
  saveJobs: (jobs: JobApplication[]) => setItem(STORAGE_KEYS.JOBS, jobs),
  addJob: (job: JobApplication) => {
    const list = StorageService.getJobs()
    StorageService.saveJobs([job, ...list])
  },
  updateJob: (job: JobApplication) => {
    const list = StorageService.getJobs()
    StorageService.saveJobs(list.map((j) => (j.id === job.id ? job : j)))
  },
  deleteJob: (id: string) => {
    const list = StorageService.getJobs()
    StorageService.saveJobs(list.filter((j) => j.id !== id))
  },
  batchAddJobs: (newJobs: JobApplication[]) => {
    const existing = StorageService.getJobs()
    const existingIds = new Set(existing.map((j) => `${j.company.toLowerCase()}_${j.role.toLowerCase()}`))

    // 去重匹配
    const toAdd = newJobs.filter((j) => !existingIds.has(`${j.company.toLowerCase()}_${j.role.toLowerCase()}`))
    StorageService.saveJobs([...toAdd, ...existing])
    return { added: toAdd.length, skipped: newJobs.length - toAdd.length }
  },

  // 毕业与科研数据
  getThesis: (): ThesisInfo => getItem(STORAGE_KEYS.THESIS, INITIAL_THESIS),
  saveThesis: (thesis: ThesisInfo) => setItem(STORAGE_KEYS.THESIS, thesis),

  getModels: (): ModelExperiment[] => getItem(STORAGE_KEYS.MODELS, INITIAL_MODELS),
  saveModels: (models: ModelExperiment[]) => setItem(STORAGE_KEYS.MODELS, models),

  getProjects: (): ResearchProject[] => getItem(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
  saveProjects: (projects: ResearchProject[]) => setItem(STORAGE_KEYS.PROJECTS, projects),

  getMilestones: (): MilestoneItem[] => getItem(STORAGE_KEYS.MILESTONES, INITIAL_MILESTONES),
  saveMilestones: (milestones: MilestoneItem[]) => setItem(STORAGE_KEYS.MILESTONES, milestones),

  // 刷题与复习
  getLeetCode: (): LeetCodeItem[] => getItem(STORAGE_KEYS.LEETCODE, INITIAL_LEETCODE),
  saveLeetCode: (items: LeetCodeItem[]) => setItem(STORAGE_KEYS.LEETCODE, items),

  getFlashcards: (): KnowledgeFlashcard[] => getItem(STORAGE_KEYS.FLASHCARDS, INITIAL_FLASHCARDS),
  saveFlashcards: (cards: KnowledgeFlashcard[]) => setItem(STORAGE_KEYS.FLASHCARDS, cards),

  // 生活与日常
  getTop3: (): DailyTop3Item[] => getItem(STORAGE_KEYS.TOP3, INITIAL_TOP3),
  saveTop3: (top3: DailyTop3Item[]) => setItem(STORAGE_KEYS.TOP3, top3),

  getHabits: (): HabitItem[] => getItem(STORAGE_KEYS.HABITS, INITIAL_HABITS),
  saveHabits: (habits: HabitItem[]) => setItem(STORAGE_KEYS.HABITS, habits),

  getTimeBlocks: (): TimeBlockItem[] => getItem(STORAGE_KEYS.TIMEBLOCKS, INITIAL_TIMEBLOCKS),
  saveTimeBlocks: (blocks: TimeBlockItem[]) => setItem(STORAGE_KEYS.TIMEBLOCKS, blocks),

  getNotes: (): QuickCaptureNote[] => getItem(STORAGE_KEYS.NOTES, INITIAL_NOTES),
  saveNotes: (notes: QuickCaptureNote[]) => setItem(STORAGE_KEYS.NOTES, notes),

  getEnergyMoodLogs: (): EnergyMoodLog[] => getItem(STORAGE_KEYS.ENERGY_MOOD_LOGS, []),
  saveEnergyMoodLogs: (logs: EnergyMoodLog[]) => setItem(STORAGE_KEYS.ENERGY_MOOD_LOGS, logs),

  // 全量备份与恢复
  exportAllData: () => {
    return {
      version: '3.0',
      exportDate: new Date().toISOString(),
      jobs: StorageService.getJobs(),
      thesis: StorageService.getThesis(),
      models: StorageService.getModels(),
      projects: StorageService.getProjects(),
      milestones: StorageService.getMilestones(),
      leetcode: StorageService.getLeetCode(),
      flashcards: StorageService.getFlashcards(),
      top3: StorageService.getTop3(),
      habits: StorageService.getHabits(),
      timeBlocks: StorageService.getTimeBlocks(),
      notes: StorageService.getNotes(),
      energyMoodLogs: StorageService.getEnergyMoodLogs(),
    }
  },

  importAllData: async (data: any) => {
    if (data.jobs) StorageService.saveJobs(data.jobs)
    if (data.thesis) StorageService.saveThesis(data.thesis)
    if (data.models) StorageService.saveModels(data.models)
    if (data.projects) StorageService.saveProjects(data.projects)
    if (data.milestones) StorageService.saveMilestones(data.milestones)
    if (data.leetcode) StorageService.saveLeetCode(data.leetcode)
    if (data.flashcards) StorageService.saveFlashcards(data.flashcards)
    if (data.top3) StorageService.saveTop3(data.top3)
    if (data.habits) StorageService.saveHabits(data.habits)
    if (data.timeBlocks) StorageService.saveTimeBlocks(data.timeBlocks)
    if (data.notes) StorageService.saveNotes(data.notes)
    if (data.energyMoodLogs) StorageService.saveEnergyMoodLogs(data.energyMoodLogs)

    if (isSupabaseConfigured()) {
      await StorageService.pushAllToCloud()
    }
  },

  resetToDefault: async () => {
    if (typeof window === 'undefined') return
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k))
    if (isSupabaseConfigured()) {
      const supabase = getSupabase()
      if (supabase) {
        await supabase.from('workspace_storage').delete().neq('key', '')
      }
    }
    window.location.reload()
  },
}
