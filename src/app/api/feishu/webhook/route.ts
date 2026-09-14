import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseCredentials } from '@/lib/supabase'
import { JobApplication } from '@/types'
import { parseMultiSelectStatus, extractStatusTags } from '@/lib/feishu-parser'

// 供飞书多维表格「自动化 (Automation)」发送 Webhook 请求时调用的接口
// 支持飞书事件校验 (challenge) 及记录变更数据直接同步到 Supabase
export async function POST(req: NextRequest) {
  try {
    let body: any = {}
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      try {
        body = await req.json()
      } catch (e) {
        body = {}
      }
    } else if (contentType.includes('form-data') || contentType.includes('urlencoded')) {
      try {
        const formData = await req.formData()
        const obj: Record<string, any> = {}
        formData.forEach((val, key) => {
          obj[key] = val
        })
        body = obj
      } catch (e) {
        body = {}
      }
    } else {
      // 兜底尝试
      try {
        body = await req.json()
      } catch (e) {
        try {
          const formData = await req.formData()
          const obj: Record<string, any> = {}
          formData.forEach((val, key) => {
            obj[key] = val
          })
          body = obj
        } catch (e2) {
          body = {}
        }
      }
    }

    // 1. 飞书开放平台事件订阅 URL 校验 (Challenge 验证握手)
    if (body.type === 'url_verification' && body.challenge) {
      return NextResponse.json({ challenge: body.challenge })
    }

    // 2. 初始化 Supabase 服务端客户端
    const creds = getSupabaseCredentials()
    if (!creds.url || !creds.anonKey) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 500 })
    }
    const supabase = createClient(creds.url, creds.anonKey)

    // 3. 获取现有的 jobs 数据
    const { data: storageData, error: fetchError } = await supabase
      .from('workspace_storage')
      .select('value')
      .eq('key', 'workspace_jobs_v4')
      .single()

    const currentJobs: JobApplication[] = (storageData?.value as JobApplication[]) || []

    // 4. 解析飞书发送过来的记录数据 (支持飞书自动化 Webhook Payload 或开放平台事件)
    const fields = body.fields || body.record?.fields || body.data?.fields || body

    const company = (fields['投递公司'] || fields['公司'] || fields['company'] || '').trim()
    if (!company) {
      return NextResponse.json({
        success: true,
        message: 'Webhook 联通正常（未检测到公司名称字段）',
      })
    }

    const rawRole = fields['职位'] || fields['职位名称'] || fields['应聘职位'] || fields['role'] || '研发工程师'
    const priority = fields['优先级'] || fields['priority'] || undefined
    const applyDate = fields['投递日期'] || fields['日期'] || fields['applyDate'] || new Date().toISOString().split('T')[0]
    const applyStatus = fields['投递状态'] || fields['applyStatus'] || '已投递'
    const category = fields['类型与岗位'] || fields['岗位类别'] || fields['category'] || undefined
    const location = fields['base地'] || fields['城市'] || fields['地点'] || fields['location'] || undefined
    const industry = fields['行业'] || fields['所属行业'] || fields['industry'] || undefined
    const jobUrl = fields['官网'] || fields['招聘官网'] || fields['链接'] || fields['jobUrl'] || undefined
    const rawStatus = fields['状态/进展'] || fields['状态'] || fields['当前进展'] || fields['进展'] || fields['status'] || '已投递'
    const notes = fields['备注'] || fields['notes'] || undefined

    // 剥离 role 中可能混入的长 URL
    let role = String(rawRole).trim()
    let finalJobUrl = jobUrl
    const urlMatch = role.match(/https?:\/\/[^\s\u4e00-\u9fa5]+/i)
    if (urlMatch) {
      if (!finalJobUrl) finalJobUrl = urlMatch[0]
      role = role.replace(urlMatch[0], '').trim()
    }

    // 解析多选状态与标签
    const statusText = Array.isArray(rawStatus) ? rawStatus.join(', ') : String(rawStatus)
    const parsedStatus = parseMultiSelectStatus(statusText)
    const statusTags = extractStatusTags(statusText)

    // 构建或匹配面试轮次
    let interviews = []
    if (parsedStatus.highestRound) {
      const stageLabels: Record<string, string> = {
        assessment: '笔试测评',
        interview1: '技术一面',
        interview2: '技术二面',
        interview3: '技术三面',
        hr: 'HR面/终面',
      }
      if (stageLabels[parsedStatus.highestRound]) {
        interviews.push({
          id: `iv-${Date.now()}`,
          round: stageLabels[parsedStatus.highestRound],
          date: applyDate,
          questions: [],
          feedback: parsedStatus.isRejected ? '流程终止已挂' : '飞书自动化实时同步',
        })
      }
    }

    // 检查是否存在同名公司+岗位的记录
    const existingIndex = currentJobs.findIndex(
      (j) => j.company.toLowerCase() === company.toLowerCase() && (j.role.includes(role) || role.includes(j.role))
    )

    const updatedJob: JobApplication = {
      id: existingIndex >= 0 ? currentJobs[existingIndex].id : `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      company,
      role: role || '研发工程师',
      priority,
      applyDate,
      applyStatus,
      category,
      location,
      industry,
      jobUrl: finalJobUrl,
      status: parsedStatus.status,
      lastStage: parsedStatus.lastStage,
      rawStatus: statusText,
      statusTags: statusTags.length > 0 ? statusTags : undefined,
      notes,
      interviews: existingIndex >= 0 && currentJobs[existingIndex].interviews?.length ? currentJobs[existingIndex].interviews : interviews,
      updatedAt: new Date().toISOString(),
    }

    let nextJobs: JobApplication[]
    if (existingIndex >= 0) {
      nextJobs = [...currentJobs]
      nextJobs[existingIndex] = { ...nextJobs[existingIndex], ...updatedJob }
    } else {
      nextJobs = [updatedJob, ...currentJobs]
    }

    // 5. 写入 Supabase 数据库
    const { error: upsertError } = await supabase.from('workspace_storage').upsert({
      key: 'workspace_jobs_v4',
      value: nextJobs,
      updated_at: new Date().toISOString(),
    })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action: existingIndex >= 0 ? 'updated' : 'created',
      company,
      status: parsedStatus.status,
      lastStage: parsedStatus.lastStage,
      totalJobs: nextJobs.length,
    })
  } catch (err: any) {
    console.error('Feishu Webhook Error:', err)
    return NextResponse.json({ error: err.message || '内部处理错误' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Feishu Webhook Receiver',
    description: '用于接收飞书多维表格自动化发送的记录变更，自动秒级同步至秋招求职管家',
    time: new Date().toISOString(),
  })
}
