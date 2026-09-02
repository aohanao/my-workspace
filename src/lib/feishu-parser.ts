import { JobApplication, JobStatus, FeishuImportResult } from '@/types'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'

// 状态关键词映射字典
const STATUS_MAP: Record<string, JobStatus> = {
  // 意向
  '意向': 'wishlist',
  '准备投递': 'wishlist',
  '待投递': 'wishlist',
  '想去': 'wishlist',
  '未投': 'wishlist',

  // 已投递
  '已投': 'applied',
  '已投递': 'applied',
  '简历初筛': 'applied',
  '初筛': 'applied',
  '简历评估': 'applied',
  '评估中': 'applied',
  '筛选中': 'applied',

  // 笔试/测评
  '笔试': 'assessment',
  '测评': 'assessment',
  '做测评': 'assessment',
  '笔试中': 'assessment',
  '已做笔试': 'assessment',
  '待笔试': 'assessment',
  '性格测试': 'assessment',

  // 面试
  '一面': 'interview1',
  '技术一面': 'interview1',
  '初面': 'interview1',
  '专业面': 'interview1',
  '群面': 'interview1',

  '二面': 'interview2',
  '技术二面': 'interview2',
  '复面': 'interview2',
  '交叉面': 'interview2',
  '主管面': 'interview2',
  '三面': 'interview2',

  'hr面': 'hr',
  'hr': 'hr',
  '终面': 'hr',
  '综合面': 'hr',
  '人事面': 'hr',
  '谈薪': 'hr',

  // Offer
  'offer': 'offer',
  '意向书': 'offer',
  '录用': 'offer',
  '带薪实习': 'offer',
  '已OC': 'offer',
  'oc': 'offer',
  '已发offer': 'offer',

  // 挂/拒绝
  '挂': 'rejected',
  '感谢信': 'rejected',
  '挂了': 'rejected',
  '淘汰': 'rejected',
  '终止': 'rejected',
  '不合适': 'rejected',
  '流程终止': 'rejected',
  '暂不匹配': 'rejected',
  '放弃': 'rejected',
}

// 表头字段归一化识别
function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[\s_—\-]/g, '')
  
  if (/公司|企业|单位|雇主|company/i.test(clean)) return 'company'
  if (/岗位|职位|方向|role|position|job/i.test(clean)) return 'role'
  if (/部门|事业群|业务线|dept|department/i.test(clean)) return 'department'
  if (/城市|地点|base|location|地区/i.test(clean)) return 'location'
  if (/状态|进度|阶段|status|stage|流程/i.test(clean)) return 'status'
  if (/投递日|投递时间|申请日|applydate|date/i.test(clean)) return 'applyDate'
  if (/薪资|待遇|薪酬|总包|salary|package/i.test(clean)) return 'salary'
  if (/链接|官网|投递网址|url|link/i.test(clean)) return 'jobUrl'
  if (/渠道|来源|内推|source|referral/i.test(clean)) return 'source'
  if (/面试时间|面试日程|interview/i.test(clean)) return 'interviewTime'
  if (/备注|复盘|面经|总结|note|notes|remark/i.test(clean)) return 'notes'
  
  return clean
}

// 智能匹配状态
function parseStatus(rawStatus: string | undefined): JobStatus {
  if (!rawStatus) return 'applied'
  const text = rawStatus.trim().toLowerCase()
  
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (text.includes(key.toLowerCase())) {
      return val
    }
  }
  return 'applied'
}

// 智能提取日期字符串为 YYYY-MM-DD
function parseDate(rawDate: any): string {
  if (!rawDate) {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  if (typeof rawDate === 'number') {
    // Excel date serial number
    const parsed = XLSX.SSF.parse_date_code(rawDate)
    if (parsed) {
      const m = String(parsed.m).padStart(2, '0')
      const d = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${m}-${d}`
    }
  }

  const str = String(rawDate).trim()
  // 匹配常见的 2024-09-01, 2024/9/1, 9.1, 9月1日
  const matchFull = str.match(/(\d{4})[.\-\/年](\d{1,2})[.\-\/月](\d{1,2})/)
  if (matchFull) {
    const y = matchFull[1]
    const m = matchFull[2].padStart(2, '0')
    const d = matchFull[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const matchShort = str.match(/(\d{1,2})[.\-\/月](\d{1,2})/)
  if (matchShort) {
    const y = new Date().getFullYear()
    const m = matchShort[1].padStart(2, '0')
    const d = matchShort[2].padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return new Date().toISOString().split('T')[0]
}

/**
 * 解析从飞书文档电子表格复制的剪贴板纯文本 (TSV / CSV)
 */
export function parseFeishuClipboardText(rawText: string): FeishuImportResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return { total: 0, successCount: 0, failedCount: 0, jobs: [], unmatchedHeaders: [] }
  }

  // 使用 PapaParse 解析（自动判断 TSV/CSV）
  const parsed = Papa.parse<string[]>(trimmed, {
    delimiter: trimmed.includes('\t') ? '\t' : ',',
    skipEmptyLines: true,
  })

  const rows = parsed.data
  if (rows.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0, jobs: [], unmatchedHeaders: [] }
  }

  return parseMatrixData(rows)
}

/**
 * 解析上传的 Excel 文件
 */
export async function parseFeishuExcelFile(file: File): Promise<FeishuImportResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const matrix = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 })

  return parseMatrixData(matrix)
}

/**
 * 将二维矩阵行数据转化为结构化 JobApplication
 */
function parseMatrixData(matrix: any[][]): FeishuImportResult {
  if (!matrix || matrix.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0, jobs: [], unmatchedHeaders: [] }
  }

  // 1. 寻找表头行（包含“公司”或“岗位”字样的行，默认第 0 行）
  let headerRowIndex = 0
  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    const rowStr = (matrix[i] || []).join(' ')
    if (/公司|岗位|职位|状态|进度/i.test(rowStr)) {
      headerRowIndex = i
      break
    }
  }

  const rawHeaders = matrix[headerRowIndex] || []
  const headerMap: Record<number, string> = {}
  const unmatchedHeaders: string[] = []

  rawHeaders.forEach((h, colIndex) => {
    if (!h) return
    const normalized = normalizeHeader(String(h))
    if (['company', 'role', 'department', 'location', 'status', 'applyDate', 'salary', 'jobUrl', 'source', 'notes', 'interviewTime'].includes(normalized)) {
      headerMap[colIndex] = normalized
    } else {
      unmatchedHeaders.push(String(h))
    }
  })

  // 如果连公司列都没识别到，按常见列序兜底：0:公司, 1:岗位, 2:地点, 3:状态, 4:日期
  const hasCompany = Object.values(headerMap).includes('company')
  if (!hasCompany && rawHeaders.length > 0) {
    headerMap[0] = 'company'
    if (rawHeaders.length > 1) headerMap[1] = 'role'
    if (rawHeaders.length > 2) headerMap[2] = 'location'
    if (rawHeaders.length > 3) headerMap[3] = 'status'
  }

  const jobs: JobApplication[] = []
  let successCount = 0
  let failedCount = 0

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
      continue
    }

    const item: Record<string, any> = {}
    row.forEach((cell, colIndex) => {
      const field = headerMap[colIndex]
      if (field) {
        item[field] = cell
      }
    })

    const company = (item.company ? String(item.company).trim() : '')
    if (!company) {
      failedCount++
      continue
    }

    const role = item.role ? String(item.role).trim() : '算法工程师/软件开发'
    const status = parseStatus(item.status)
    const applyDate = parseDate(item.applyDate)
    const location = item.location ? String(item.location).trim() : undefined
    const department = item.department ? String(item.department).trim() : undefined
    const salary = item.salary ? String(item.salary).trim() : undefined
    const jobUrl = item.jobUrl ? String(item.jobUrl).trim() : undefined
    const source = item.source ? String(item.source).trim() : undefined
    const notes = item.notes ? String(item.notes).trim() : undefined

    const interviews = item.interviewTime ? [{
      id: `iv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      round: status === 'interview2' ? '二面' : status === 'hr' ? 'HR面' : '一面',
      date: parseDate(item.interviewTime),
      questions: [],
      feedback: '从飞书导入记录',
    }] : []

    const job: JobApplication = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      company,
      role,
      department,
      location,
      applyDate,
      status,
      salary,
      jobUrl,
      source,
      notes,
      interviews,
      updatedAt: new Date().toISOString(),
      tags: [],
    }

    jobs.push(job)
    successCount++
  }

  return {
    total: jobs.length,
    successCount,
    failedCount,
    jobs,
    unmatchedHeaders,
  }
}
