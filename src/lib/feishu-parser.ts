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

  '三面': 'interview3',
  '技术三面': 'interview3',
  '三轮': 'interview3',
  '主管面': 'interview3',
  '业务面': 'interview3',

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

// 判断岗位是否属于实际已投递
export function isJobApplied(job: { status?: JobStatus; applyStatus?: string }): boolean {
  if (job.status === 'wishlist') return false
  if (job.applyStatus && /未投|待投|未申请|准备|想去|意向/i.test(job.applyStatus)) return false
  return true
}

// 统一判定求职流程是否到达过指定阶段（严格按照挂掉前的实际轮次判定，精确下钻各 TAB）
export function hasReachedStage(
  job: JobApplication,
  stage: 'assessment' | 'round1' | 'round2' | 'round3' | 'hr' | 'offer'
): boolean {
  if (!isJobApplied(job)) return false

  const status = normalizeJobStatus(job.status)
  const last = job.lastStage ? normalizeJobStatus(job.lastStage) : undefined
  const notes = (job.notes || '') + ' ' + (job.category || '')
  const interviews = job.interviews || []

  switch (stage) {
    case 'offer':
      return status === 'offer' || last === 'offer'

    case 'hr':
      if (['offer', 'hr'].includes(status)) return true
      if (last && ['offer', 'hr'].includes(last)) return true
      if (interviews.some((i) => /hr|终面|人事|谈薪/i.test(i.round))) return true
      if (/hr面|终面|人事面|谈薪/i.test(notes)) return true
      return false

    case 'round3':
      if (['offer', 'hr', 'interview3'].includes(status)) return true
      if (last && ['offer', 'hr', 'interview3'].includes(last)) return true
      if (interviews.some((i) => /三面|三轮|主管|业务|hr|终面/i.test(i.round))) return true
      if (/三面|主管面|业务面/i.test(notes)) return true
      return false

    case 'round2':
      if (['offer', 'hr', 'interview3', 'interview2'].includes(status)) return true
      if (last && ['offer', 'hr', 'interview3', 'interview2'].includes(last)) return true
      if (interviews.some((i) => /二面|二轮|复面|交叉|三面|主管|业务|hr|终面/i.test(i.round))) return true
      if (/二面|复面|交叉面/i.test(notes)) return true
      return false

    case 'round1':
      // 必须真正到达过一面（包括进行中、后续轮次、或在一面/二面/三面/HR面挂掉；初筛挂、笔试挂绝不计入）
      if (['offer', 'hr', 'interview3', 'interview2', 'interview1'].includes(status)) return true
      if (last && ['offer', 'hr', 'interview3', 'interview2', 'interview1'].includes(last)) return true
      if (interviews.some((i) => !/笔试|测评/i.test(i.round))) return true
      if (/一面|一轮|初面|技术面|专业面|群面|现场面|线上面试|二面|三面|hr/i.test(notes)) return true
      return false

    case 'assessment':
      if (['offer', 'hr', 'interview3', 'interview2', 'interview1', 'assessment'].includes(status)) return true
      if (last && ['offer', 'hr', 'interview3', 'interview2', 'interview1', 'assessment'].includes(last)) return true
      if (interviews.some((i) => /笔试|测评/i.test(i.round))) return true
      if (/笔试|测评|在线测试/i.test(notes)) return true
      return false
  }
}

// 获取流程当前或终止时的细致轮次阶段说明
export function getJobStageBadge(job: JobApplication): { text: string; color: string; isRejected: boolean } {
  const status = normalizeJobStatus(job.status)
  if (status === 'rejected') {
    const last = job.lastStage ? normalizeJobStatus(job.lastStage) : undefined
    const notes = (job.notes || '') + ' ' + (job.category || '')

    if (last === 'hr' || /hr|终面|人事/i.test(notes)) {
      return { text: '已挂·终面', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', isRejected: true }
    }
    if (last === 'interview3' || /三面|主管/i.test(notes)) {
      return { text: '已挂·三面', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', isRejected: true }
    }
    if (last === 'interview2' || /二面|交叉|复面/i.test(notes)) {
      return { text: '已挂·二面', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', isRejected: true }
    }
    if (last === 'interview1' || /一面|初面|技术面/i.test(notes) || (job.interviews && job.interviews.some((i) => !/笔试|测评/i.test(i.round)))) {
      return { text: '已挂·一面', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30', isRejected: true }
    }
    if (last === 'assessment' || /笔试|测评/i.test(notes) || (job.interviews && job.interviews.some((i) => /笔试|测评/i.test(i.round)))) {
      return { text: '已挂·笔试', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', isRejected: true }
    }
    return { text: '已挂·初筛', color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30', isRejected: true }
  }

  switch (status) {
    case 'offer':
      return { text: '斩获Offer 🎉', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', isRejected: false }
    case 'hr':
      return { text: 'HR面/谈薪', color: 'bg-pink-500/15 text-pink-300 border-pink-500/30', isRejected: false }
    case 'interview3':
      return { text: '技术三面', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', isRejected: false }
    case 'interview2':
      return { text: '技术二面', color: 'bg-orange-500/15 text-orange-300 border-orange-500/30', isRejected: false }
    case 'interview1':
      return { text: '技术一面', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30', isRejected: false }
    case 'assessment':
      return { text: '笔试测评', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30', isRejected: false }
    case 'wishlist':
      return { text: '意向备战', color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30', isRejected: false }
    case 'applied':
    default:
      return { text: '已投待初筛', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30', isRejected: false }
  }
}

// 提取飞书多选标签列表（支持逗号、分号、顿号、斜杠、换行、空格等多种分隔符）
export function extractStatusTags(rawText?: string | null): string[] {
  if (!rawText) return []
  const text = String(rawText).trim()
  if (!text || text === '-') return []

  // 按常见标点与换行拆分多选标签
  return text
    .split(/[,，、;\/|\n\r]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== '-')
}

// 标签色彩分类器：根据标签中文语义自动配置精致的主题颜色
export function getStatusTagStyle(tagText: string): string {
  const t = tagText.toLowerCase()
  if (/挂|淘汰|终止|不合适|感谢信|未通过|不通过|被拒|拒信|fail|reject|已拒绝|归档/i.test(t)) {
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  }
  if (/offer|录用|意向书|已oc|带薪实习|oc/i.test(t)) {
    return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
  if (/hr|终面|人事|谈薪|综合面/i.test(t)) {
    return 'bg-pink-500/15 text-pink-300 border-pink-500/30'
  }
  if (/三面|三轮|主管面|业务面/i.test(t)) {
    return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  }
  if (/二面|二轮|复面|交叉/i.test(t)) {
    return 'bg-orange-500/15 text-orange-300 border-orange-500/30'
  }
  if (/一面|一轮|初面|专业面|群面|技术面|线上面试|现场面|面试/i.test(t)) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
  if (/笔试|测评|性格测试|在线测评|做测评|测试/i.test(t)) {
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
  }
  if (/意向|准备|未投|待投|想去|未申请/i.test(t)) {
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  }
  if (/已投|初筛|筛选|评估|推进/i.test(t)) {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  }
  return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
}

// 统一获取要在 UI 上展示的标签列表（100% 优先忠实还原用户给的飞书原始标签，杜绝任何英文）
export function getJobDisplayTags(job: Partial<JobApplication>): Array<{ text: string; color: string }> {
  // 1. 如果有明确提取出来的多选标签列表，直接按照用户给的标签展示！
  const tags = (job.statusTags && job.statusTags.length > 0)
    ? job.statusTags
    : extractStatusTags(job.rawStatus)

  if (tags && tags.length > 0) {
    return tags.map((t) => ({
      text: t,
      color: getStatusTagStyle(t),
    }))
  }

  // 2. 兜底策略：没有任何用户原始标签时，按业务状态映射为中文标签
  const status = normalizeJobStatus(job.status)
  if (status === 'rejected') {
    const badge = getJobStageBadge(job as JobApplication)
    return [{ text: badge.text, color: badge.color }]
  }

  const badge = getJobStageBadge(job as JobApplication)
  return [{ text: badge.text, color: badge.color }]
}

// 智能解析飞书多维表格「多选状态」（如: "技术一面, 流程终止" 或 "笔试, 挂了" 或 "初筛, 已拒绝"）
export function parseMultiSelectStatus(rawText?: string | null): {
  status: JobStatus
  lastStage?: JobStatus
  isRejected: boolean
  highestRound?: 'assessment' | 'interview1' | 'interview2' | 'interview3' | 'hr' | 'offer'
} {
  if (!rawText) return { status: 'applied', isRejected: false }
  const text = String(rawText).trim().toLowerCase()

  // 1. 判断是否包含已挂/拒绝/淘汰/终止
  const isRejected = /挂|淘汰|终止|不合适|感谢信|未通过|不通过|被拒|拒信|fail|reject|已拒绝|归档/i.test(text)

  // 2. 判断多选中包含的具体推进轮次（支持飞书表格多选标签）
  let highestRound: 'assessment' | 'interview1' | 'interview2' | 'interview3' | 'hr' | 'offer' | undefined = undefined

  if (/offer|录用|意向书|已oc|带薪实习|oc/i.test(text)) {
    highestRound = 'offer'
  } else if (/hr|终面|人事|谈薪|综合面/i.test(text)) {
    highestRound = 'hr'
  } else if (/三面|三轮|主管面|业务面|interview3/i.test(text)) {
    highestRound = 'interview3'
  } else if (/二面|二轮|复面|交叉|interview2/i.test(text)) {
    highestRound = 'interview2'
  } else if (/一面|一轮|初面|专业面|群面|技术面|线上面试|现场面|interview1|interview/i.test(text)) {
    highestRound = 'interview1'
  } else if (/笔试|测评|性格测试|在线测评|做测评|assessment/i.test(text)) {
    highestRound = 'assessment'
  }

  // 3. 如果包含挂/终止，明确记录终止前的具体轮次
  if (isRejected) {
    return {
      status: 'rejected',
      lastStage: highestRound || 'applied',
      isRejected: true,
      highestRound,
    }
  }

  // 4. 如果未挂，状态即为最高轮次
  if (highestRound) {
    return {
      status: highestRound,
      isRejected: false,
      highestRound,
    }
  }

  if (/意向|准备|未投|待投|想去|未申请|wishlist/i.test(text)) {
    return { status: 'wishlist', isRejected: false }
  }

  return { status: 'applied', isRejected: false }
}

// 全局状态归一化处理器 (确保任意状态输入均严格映射到 9 种合法状态之一)
export function normalizeJobStatus(status?: string | null): JobStatus {
  if (!status) return 'applied'
  const text = String(status).trim().toLowerCase()

  // 1. 最高优先级：挂 / 淘汰 / 流程终止 / 感谢信 / 未通过 / 不合适
  if (/挂|淘汰|终止|不合适|感谢信|未通过|不通过|被拒|拒信|fail|reject|已拒绝|归档/i.test(text)) {
    return 'rejected'
  }

  // 2. Offer / 录用
  if (/offer|录用|意向书|已oc|带薪实习|oc/i.test(text)) {
    return 'offer'
  }

  // 3. HR面 / 终面
  if (/hr|终面|人事|谈薪|综合面/i.test(text)) {
    return 'hr'
  }

  // 4. 技术三面 / 主管面
  if (/三面|三轮|主管面|业务面|interview3/i.test(text)) {
    return 'interview3'
  }

  // 5. 技术二面 / 交叉面
  if (/二面|二轮|复面|交叉|interview2/i.test(text)) {
    return 'interview2'
  }

  // 6. 技术一面 / 初面
  if (/一面|一轮|初面|专业面|群面|interview1|interview/i.test(text)) {
    return 'interview1'
  }

  // 7. 笔试 / 测评
  if (/笔试|测评|性格测试|在线测评|做测评|assessment/i.test(text)) {
    return 'assessment'
  }

  // 8. 意向 / 未投递
  if (/意向|准备|未投|待投|想去|未申请|wishlist/i.test(text)) {
    return 'wishlist'
  }

  // 9. 已投递 / 初筛
  if (/已投|初筛|评估|筛选|applied/i.test(text)) {
    return 'applied'
  }

  return 'applied'
}

// 智能提取状态 (优先检测挂与淘汰，杜绝"一面挂"被误当作一面推进)
export function parseStatus(rawStatus: string | undefined, defaultStatus: JobStatus = 'applied'): JobStatus {
  if (!rawStatus) return defaultStatus
  const text = rawStatus.trim().toLowerCase()
  
  // 1. 优先检测是否已淘汰或流程终止
  if (/挂|淘汰|终止|不合适|感谢信|未通过|不通过|被拒|拒信|fail|reject|已拒绝|归档/i.test(text)) {
    return 'rejected'
  }

  // 2. 匹配其余状态关键词
  for (const [key, val] of Object.entries(STATUS_MAP)) {
    if (text === key.toLowerCase() || text.includes(key.toLowerCase())) {
      return val
    }
  }
  return defaultStatus
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
  if (!str) return false
  return /(\d{4}[.\-\/年]\d{1,2}[.\-\/月]\d{1,2})|(\d{1,2}[.\-\/月]\d{1,2})/.test(str)
}

// 表头字段归一化识别
function normalizeHeader(header: string): string {
  const clean = header.trim().toLowerCase().replace(/[\s_—\-🔒A=:=☑☐\d+]/g, '')
  
  if (/^投递公司$|^公司$|^企业$|^单位$|^雇主$|^company$/i.test(clean)) return 'company'
  if (/^优先级$|^priority$/i.test(clean)) return 'priority'
  if (/^投递日|^投递时间|^申请日|^日期|^applydate|^date/i.test(clean)) return 'applyDate'
  if (/^投递状态|^当前状态|^流程状态/i.test(clean)) return 'applyStatus'
  if (/^类型与岗位|^投递类型|^岗位类别|^招聘类型|^分类/i.test(clean)) return 'category'
  if (/^base|^城市|^地点|^工作地|^base地|^location|^地区/i.test(clean)) return 'location'
  if (/^职位$|^具体职位$|^应聘职位$|^岗位$|^方向$|^role$|^position$/i.test(clean)) return 'role'
  if (/^行业$|^所属行业$|^industry$/i.test(clean)) return 'industry'
  if (/^官网$|^链接$|^投递网址$|^url$|^link$|^招聘网站$|^招聘频道/i.test(clean)) return 'jobUrl'
  if (/^状态$|^进度$|^当前进度|^阶段|^stage|^进展/i.test(clean)) return 'status'
  if (/^备注$|^复盘$|^面经$|^总结$|^note|^notes|^remark/i.test(clean)) return 'notes'
  if (/^薪资$|^待遇$|^薪酬$|^总包$|^salary/i.test(clean)) return 'salary'
  
  return clean
}

/**
 * 判断一行是否为真正的表头（需要满足多个表头关键词匹配且无日期）
 */
function isRealHeaderRow(row: any[]): boolean {
  if (!row || row.length === 0) return false
  const cells = row.map((c) => (c ? String(c).trim() : ''))
  
  // 如果行内包含明确日期（如 2026/08/31），则绝不是表头
  if (cells.some((c) => isDateString(c))) return false

  let matchHeaderCount = 0
  for (const c of cells) {
    const norm = normalizeHeader(c)
    if (['company', 'priority', 'applyDate', 'applyStatus', 'category', 'location', 'role', 'industry', 'jobUrl', 'status', 'notes'].includes(norm)) {
      matchHeaderCount++
    }
  }

  // 必须匹配至少 2 个标准表头名
  return matchHeaderCount >= 2
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

  // 3. 去除可能存在的首列复选框或空列（如: ☑, ☐, ::）
  let cleanCells = [...cells]
  if (cleanCells.length > 1 && (/^[☑☐::\s]+$/.test(cleanCells[0]) || cleanCells[0] === '')) {
    cleanCells.shift()
  } else if (cleanCells.length > 2 && /^\d{1,2}$/.test(cleanCells[0]) && !/^[高中低]$/.test(cleanCells[1]) && !isDateString(cleanCells[1])) {
    // 只有当第0列是个位数序号（如 1, 2）且第1列不是优先级时才剔除
    cleanCells.shift()
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
      else if (field === 'status') {
        result.status = parseStatus(cell)
        result.rawStatus = cell
      }
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

  // 投递状态 (已投递 / 待投递 / 未投递)
  let isNotYetApplied = false
  if (result.applyStatus) {
    if (/未投|待投|未申请|准备|想去|意向/i.test(result.applyStatus)) {
      result.applyStatus = '未投递'
      isNotYetApplied = true
    } else if (/已投|初筛|筛选|评估/i.test(result.applyStatus)) {
      result.applyStatus = '已投递'
    }
  } else {
    const applyStatCell = cleanCells.find((c) => /已投|待投|未投|初筛|评估|想去|意向/i.test(c))
    if (applyStatCell) {
      if (/未投|待投|未申请|准备|想去|意向/i.test(applyStatCell)) {
        result.applyStatus = '未投递'
        isNotYetApplied = true
      } else {
        result.applyStatus = '已投递'
      }
    } else if (cleanCells[3] && /未投|待投|未申请|准备|想去|意向/i.test(cleanCells[3])) {
      result.applyStatus = '未投递'
      isNotYetApplied = true
    } else {
      result.applyStatus = '已投递'
    }
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
      const roleCell = cleanCells.find((c) => /开发|算法|工程|技术|产品|研发|Agent|大模型|前端|后端/i.test(c) && c !== result.category)
      result.role = roleCell || result.category || '研发岗位'
    }
  }

  // 若岗位名称中混入了长 URL 链接，自动剥离填充到 jobUrl 中，净化岗位显示
  if (result.role) {
    const urlMatch = result.role.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i)
    if (urlMatch) {
      if (!result.jobUrl) {
        result.jobUrl = urlMatch[0]
      }
      result.role = result.role.replace(urlMatch[0], '').trim()
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

  // 进展状态 (笔试 / 一面 / 二面 / 三面 / HR / Offer / 挂 / 未投意向)
  // 进展状态：飞书多维表格多选状态智能识别（如 "技术一面, 流程终止" / "笔试, 挂了" / "二面, 淘汰"）
  const rawStatusCell = cleanCells[10] || cleanCells.find((c) => Object.keys(STATUS_MAP).some((k) => c.includes(k) && c !== result.applyStatus)) || ''
  const multiParsed = parseMultiSelectStatus(rawStatusCell)

  // 6. 全局挂 / 淘汰检测与终止前阶段(lastStage)识别
  const isRejectedRow =
    multiParsed.isRejected ||
    /挂|淘汰|流程终止|感谢信|不合适|未通过|不通过|被拒|拒信/i.test(result.notes || '') ||
    /挂|淘汰|流程终止|感谢信|不合适|未通过|不通过|被拒|拒信/i.test(result.applyStatus || '') ||
    cleanCells.some((c) => /挂了|淘汰|流程终止|感谢信|不合适|未通过|不通过/i.test(c))

  if (isRejectedRow) {
    result.status = 'rejected'
    if (multiParsed.lastStage && multiParsed.lastStage !== 'applied') {
      result.lastStage = multiParsed.lastStage
    } else {
      const rawContext = [cleanCells[10], result.notes, result.applyStatus, cleanCells.join(' ')].filter(Boolean).join(' ')
      if (/hr|终面|人事|谈薪/i.test(rawContext)) {
        result.lastStage = 'hr'
      } else if (/三面|三轮|主管面|业务面/i.test(rawContext)) {
        result.lastStage = 'interview3'
      } else if (/二面|二轮|复面|交叉/i.test(rawContext)) {
        result.lastStage = 'interview2'
      } else if (/一面|一轮|初面|技术面|专业面|群面|线上面试|现场面|面试/i.test(rawContext)) {
        result.lastStage = 'interview1'
      } else if (/笔试|测评/i.test(rawContext)) {
        result.lastStage = 'assessment'
      } else {
        result.lastStage = 'applied'
      }
    }

    if (!isNotYetApplied) {
      result.applyStatus = '已投递'
    }
  } else {
    result.status = multiParsed.status || (isNotYetApplied ? 'wishlist' : 'applied')
  }

  // 状态与投递状态互锁约束
  if (isNotYetApplied && result.status === 'applied') {
    result.status = 'wishlist'
  }
  if (result.status === 'wishlist') {
    result.applyStatus = '未投递'
  }

  // 保存原始飞书状态文本并提取多选标签列表（100% 优先忠实还原用户给的飞书原始标签）
  result.rawStatus = rawStatusCell || result.rawStatus || ''
  const extractedTags = extractStatusTags(result.rawStatus)
  if (extractedTags.length > 0) {
    result.statusTags = extractedTags
  } else {
    const badge = getJobStageBadge(result as JobApplication)
    result.statusTags = [badge.text]
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

  // 自动生成面试轮次记录（如果是面试或笔试状态，或者备注/历史提及了轮次）
  let roundHint = ''
  const effectiveStage = result.lastStage || result.status
  if (effectiveStage === 'assessment' || /笔试|测评/i.test(result.notes || '')) roundHint = '笔试测评'
  else if (effectiveStage === 'interview3' || /三面|主管/i.test(result.notes || '')) roundHint = '技术三面'
  else if (effectiveStage === 'interview2' || /二面|交叉/i.test(result.notes || '')) roundHint = '技术二面'
  else if (effectiveStage === 'interview1' || /一面|初面|面试|技术面/i.test(result.notes || '')) roundHint = '技术一面'
  else if (effectiveStage === 'hr' || /hr|终面/i.test(result.notes || '')) roundHint = 'HR面'

  const interviews = roundHint
    ? [{
        id: `iv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        round: roundHint,
        date: result.applyDate || new Date().toISOString().split('T')[0],
        questions: [],
        feedback: result.status === 'rejected' ? '流程终止已挂' : '从飞书表格同步',
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
    lastStage: result.lastStage,
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

  // 1. 精确判定表头行
  let headerRowIndex = -1
  let headerMap: Record<number, string> | null = null
  const unmatchedHeaders: string[] = []

  for (let i = 0; i < Math.min(matrix.length, 3); i++) {
    if (isRealHeaderRow(matrix[i])) {
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
