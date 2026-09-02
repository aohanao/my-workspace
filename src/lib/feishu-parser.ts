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
  '在线测评': 'assessment',

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
  '已oc': 'offer',
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

const COMMON_CITIES = [
  '广州', '深圳', '北京', '上海', '杭州', '成都', '武汉', '南京', '西安',
  '合肥', '厦门', '重庆', '苏州', '珠海', '佛山', '长沙', '天津', '青岛',
  '东莞', '宁波', '无锡', '香港', '澳门', '远程', '全国', '海外'
]

// 智能提取状态
function parseStatus(rawStatus: string | undefined): JobStatus {
  if (!rawStatus) return 'applied'
  const text = rawStatus.trim().toLowerCase()
  
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (text === key.toLowerCase() || text.includes(key.toLowerCase())) {
      return val
    }
  }
  return 'applied'
}

// 智能提取日期为 YYYY-MM-DD
function parseDate(rawDate: any): string {
  if (!rawDate) return new Date().toISOString().split('T')[0]

  if (typeof rawDate === 'number') {
    const parsed = XLSX.SSF.parse_date_code(rawDate)
    if (parsed) {
      const m = String(parsed.m).padStart(2, '0')
      const d = String(parsed.d).padStart(2, '0')
      return `${parsed.y}-${m}-${d}`
    }
  }

  const str = String(rawDate).trim()
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

// 判断是否是日期格式
function isDateString(str: string): boolean {
  return /(\d{4}[.\-\/年]\d{1,2}[.\-\/月]\d{1,2})|(\d{1,2}[.\-\/月]\d{1,2})/.test(str)
}

// 表头字段归一化识别
function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[\s_—\-🔒A=:=☑☐]/g, '')
  
  if (/投递公司|公司|企业|单位|雇主|company/i.test(clean)) return 'company'
  if (/^优先级$|^priority$/i.test(clean)) return 'priority'
  if (/投递日|投递时间|申请日|日期|applydate|date/i.test(clean)) return 'applyDate'
  if (/投递状态|当前状态|流程状态/i.test(clean)) return 'applyStatus'
  if (/类型与岗位|投递类型|岗位类别|招聘类型|分类/i.test(clean)) return 'category'
  if (/base|城市|地点|工作地|base地|location|地区/i.test(clean)) return 'location'
  if (/^职位$|^具体职位$|^应聘职位$|岗位|职位|方向|role|position|job/i.test(clean)) return 'role'
  if (/行业|所属行业|industry/i.test(clean)) return 'industry'
  if (/官网|链接|投递网址|url|link|招聘网站|招聘频道/i.test(clean)) return 'jobUrl'
  if (/^状态$|^进度$|当前进度|阶段|stage|进展/i.test(clean)) return 'status'
  if (/备注|复盘|面经|总结|note|notes|remark/i.test(clean)) return 'notes'
  if (/薪资|待遇|薪酬|总包|salary/i.test(clean)) return 'salary'
  
  return clean
}

/**
 * 将整行数据进行语义推断与映射（彻底解决错位与缺失问题）
 */
function parseSingleRow(
  rawCells: any[],
  headerMap: Record<number, string> | null
): JobApplication | null {
  // 1. 过滤与清理单元格文本
  const cells = rawCells.map((c) => (c !== undefined && c !== null ? String(c).trim() : ''))

  // 检查是否整行全为空
  if (cells.every((c) => c === '')) return null

  // 2. 过滤飞书多维表格分组折叠行（如: "互联网/科技... 已选择 1 条记录"）
  const rowJoined = cells.join(' ')
  if (/已选择.*条记录|条记录|分组|汇总/i.test(rowJoined)) {
    return null
  }

  // 3. 去除可能存在的首列复选框或序号列（如: ☑, ☐, ::, 1, 2）
  let cleanCells = [...cells]
  if (cleanCells.length > 1 && (/^[☑☐::\s\d]+$/.test(cleanCells[0]) || cleanCells[0] === '')) {
    // 若第一列是纯序号或勾选框，且第二列看起来是公司名，则剔除第一列
    if (cleanCells[1] && !isDateString(cleanCells[1])) {
      cleanCells.shift()
    }
  }

  const result: Partial<JobApplication> = {
    interviews: [],
    tags: [],
    updatedAt: new Date().toISOString(),
  }

  // 4. 如果有识别到的标准表头映射
  if (headerMap && Object.keys(headerMap).length >= 3) {
    cleanCells.forEach((cell, idx) => {
      const field = headerMap[idx]
      if (!field || !cell) return

      if (field === 'company') result.company = cell
      else if (field === 'priority') result.priority = cell
      else if (field === 'applyDate') result.applyDate = parseDate(cell)
      else if (field === 'applyStatus') result.applyStatus = cell
      else if (field === 'category') result.category = cell
      else if (field === 'location') result.location = cell
      else if (field === 'role') result.role = cell
      else if (field === 'industry') result.industry = cell
      else if (field === 'jobUrl') result.jobUrl = cell
      else if (field === 'status') result.status = parseStatus(cell)
      else if (field === 'notes') result.notes = cell
    })
  }

  // 5. 语义兜底与智能推断（如无表头或字段未完整映射时）
  // 对应飞书标准 11 列结构：
  // [0]公司  [1]优先级  [2]投递日期  [3]投递状态  [4]类型与岗位  [5]base地  [6]职位  [7]行业  [8]官网  [9]备注  [10]状态
  if (!result.company && cleanCells.length > 0) {
    result.company = cleanCells[0]
  }

  // 优先级智能识别
  if (!result.priority) {
    const priorityCell = cleanCells.find((c) => /^[高中低]$|^P[0-2]$/i.test(c))
    if (priorityCell) result.priority = priorityCell
    else if (cleanCells[1] && /^[高中低]$/.test(cleanCells[1])) result.priority = cleanCells[1]
  }

  // 日期智能识别
  if (!result.applyDate) {
    const dateCell = cleanCells.find((c) => isDateString(c))
    result.applyDate = dateCell ? parseDate(dateCell) : parseDate(cleanCells[2])
  }

  // 投递状态 (已投递 / 待投递)
  if (!result.applyStatus) {
    const applyStatCell = cleanCells.find((c) => /已投|待投|未投|初筛|评估/i.test(c))
    result.applyStatus = applyStatCell || (cleanCells[3] ? cleanCells[3] : '已投递')
  }

  // 类型与岗位 (如 "秋招 研发", "校招 算法")
  if (!result.category) {
    if (cleanCells[4]) result.category = cleanCells[4]
  }

  // base地智能识别
  if (!result.location) {
    const cityCell = cleanCells.find((c) => COMMON_CITIES.some((city) => c.includes(city)))
    result.location = cityCell || (cleanCells[5] ? cleanCells[5] : undefined)
  }

  // 职位智能识别 (长文本岗位名称)
  if (!result.role) {
    if (cleanCells[6]) {
      result.role = cleanCells[6]
    } else {
      // 寻找包含"开发/算法/工程/专家/PM/产品/技术/Agent"的文本
      const roleCell = cleanCells.find((c) => /开发|算法|工程|技术|产品|研发|Agent|大模型|前端|后端/i.test(c) && c !== result.category)
      result.role = roleCell || result.category || '研发岗位'
    }
  }

  // 行业
  if (!result.industry) {
    if (cleanCells[7]) result.industry = cleanCells[7]
  }

  // 官网链接
  if (!result.jobUrl) {
    const urlCell = cleanCells.find((c) => /^http|招聘频道|官网|careers/i.test(c))
    result.jobUrl = urlCell || (cleanCells[8] ? cleanCells[8] : undefined)
  }

  // 备注
  if (!result.notes) {
    if (cleanCells[9]) result.notes = cleanCells[9]
  }

  // 进展状态 (笔试 / 一面 / 二面 / HR / Offer / 挂)
  if (!result.status) {
    const stageCell = cleanCells[10] || cleanCells.find((c) => Object.keys(STATUS_MAP).some((k) => c.includes(k) && c !== result.applyStatus))
    result.status = parseStatus(stageCell || 'applied')
  }

  // 如果依然没有公司名或公司名包含无效字眼，舍弃
  if (!result.company || result.company === '投递公司' || result.company.includes('条记录')) {
    return null
  }

  // 整理标签
  const tags: string[] = []
  if (result.priority) tags.push(`优先级:${result.priority}`)
  if (result.industry) tags.push(result.industry)
  if (result.category) tags.push(result.category)

  // 自动生成面试轮次记录（如果是面试或笔试状态）
  const interviews = (result.status === 'assessment' || result.status === 'interview1' || result.status === 'interview2' || result.status === 'hr')
    ? [{
        id: `iv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        round: result.status === 'assessment' ? '笔试测评' : result.status === 'interview2' ? '二面' : result.status === 'hr' ? 'HR面' : '一面',
        date: result.applyDate || getLocalDateKey(),
        questions: [],
        feedback: '从飞书表格同步',
      }]
    : []

  return {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    company: result.company,
    priority: result.priority,
    applyDate: result.applyDate || new Date().toISOString().split('T')[0],
    applyStatus: result.applyStatus || '已投递',
    category: result.category,
    location: result.location,
    role: result.role || '研发工程师',
    industry: result.industry,
    jobUrl: result.jobUrl,
    status: result.status || 'applied',
    notes: result.notes,
    interviews,
    updatedAt: new Date().toISOString(),
    tags,
  }
}

function getLocalDateKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/**
 * 解析飞书剪贴板纯文本 (TSV / CSV)
 */
export function parseFeishuClipboardText(rawText: string): FeishuImportResult {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return { total: 0, successCount: 0, failedCount: 0, jobs: [], unmatchedHeaders: [] }
  }

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
 * 解析飞书导出的 Excel 文件
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
 * 二维矩阵解析
 */
function parseMatrixData(matrix: any[][]): FeishuImportResult {
  if (!matrix || matrix.length === 0) {
    return { total: 0, successCount: 0, failedCount: 0, jobs: [], unmatchedHeaders: [] }
  }

  // 1. 寻找表头行
  let headerRowIndex = -1
  let headerMap: Record<number, string> | null = null
  const unmatchedHeaders: string[] = []

  for (let i = 0; i < Math.min(matrix.length, 5); i++) {
    const rowStr = (matrix[i] || []).join(' ')
    if (/投递公司|公司|岗位|职位|优先级|base/i.test(rowStr) && !/条记录/.test(rowStr)) {
      headerRowIndex = i
      headerMap = {}
      const rawHeaders = matrix[i] || []
      rawHeaders.forEach((h, colIndex) => {
        if (!h) return
        const normalized = normalizeHeader(String(h))
        if (['company', 'priority', 'applyDate', 'applyStatus', 'category', 'location', 'role', 'industry', 'jobUrl', 'status', 'notes', 'salary'].includes(normalized)) {
          headerMap![colIndex] = normalized
        } else {
          unmatchedHeaders.push(String(h))
        }
      })
      break
    }
  }

  const jobs: JobApplication[] = []
  let successCount = 0
  let failedCount = 0

  const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r]
    if (!row || row.length === 0) continue

    const parsedJob = parseSingleRow(row, headerMap)
    if (parsedJob) {
      jobs.push(parsedJob)
      successCount++
    } else {
      failedCount++
    }
  }

  return {
    total: jobs.length,
    successCount,
    failedCount,
    jobs,
    unmatchedHeaders,
  }
}
