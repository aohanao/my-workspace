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
} from '@/types'

// 初始秋招投递数据：清空，等待用户导入真实飞书表格
export const INITIAL_JOBS: JobApplication[] = []

// 硕士学位论文真实信息（来自西南交通大学开题报告：梅傲寒 - 导师张志强教授）
export const INITIAL_THESIS: ThesisInfo = {
  title: '钻爆法隧道全工序机械化施工智能配置方法及系统研究',
  blindReviewDate: '2027-02-04',
  defenseDate: '2027-05-20',
  chapters: [
    {
      id: 'ch-1',
      title: '第一章 绪论 (工程背景、国内外研究现状及论文主要内容与技术路线)',
      targetWords: 6000,
      currentWords: 0,
      status: 'not_started',
      notes: '明确“少人化、机械化、智能化”需求，综述隧道开挖支护机理与智能决策系统。',
    },
    {
      id: 'ch-2',
      title: '第二章 隧道全工序机械化施工标准工法与装备谱系化配置体系',
      targetWords: 8000,
      currentWords: 0,
      status: 'not_started',
      notes: '研究主洞/平导不同围岩与工法下的机械装备空间适配性与高效谱系化配置。',
    },
    {
      id: 'ch-3',
      title: '第三章 适应全工序机械化施工的隧道支护结构体系与接触力学机理',
      targetWords: 9000,
      currentWords: 0,
      status: 'not_started',
      notes: '揭示围岩应力状态、压力拱演化规律以及岩-支-机相互作用机理。',
    },
    {
      id: 'ch-4',
      title: '第四章 融合力学机理与数据驱动的隧道支护参数智能选择模型',
      targetWords: 8000,
      currentWords: 0,
      status: 'not_started',
      notes: '构建“围岩性态-支护参数-结构安全”数据集，开发物理约束神经网络模型。',
    },
    {
      id: 'ch-5',
      title: '第五章 公路隧道多工序关键参数智能设计与配置系统研发及工程验证',
      targetWords: 7000,
      currentWords: 0,
      status: 'not_started',
      notes: '集成工法选择、支护设计与装备配置算法，选取典型工程算例测试验证。',
    },
    {
      id: 'ch-6',
      title: '第六章 结论与展望',
      targetWords: 2000,
      currentWords: 0,
      status: 'not_started',
      notes: '总结全工序机械化智能配置核心成果与创新点。',
    },
  ],
}

// 模拟与算法台账（全新初始化：0 进度 / 待启动）
export const INITIAL_MODELS: ModelExperiment[] = [
  {
    id: 'exp-1',
    modelName: 'Physics-Informed-NN-SupportPredictor',
    taskType: '支护参数智能匹配力学模型',
    dataset: '隧道工程监测与力学数值模拟数据集 (规划中)',
    hyperparameters: 'lr: 1e-4, loss: MSE + 压力拱力学先验约束',
    metrics: '待运行 (未开始)',
    status: 'not_started',
    date: '2026-09-02',
    notes: '计划用于第四章：构建融合力学机理与数据驱动的支护参数选择模型。',
  },
  {
    id: 'exp-2',
    modelName: 'PSO-SVM-RockClassification-Optimizer',
    taskType: '围岩性态动态分级与匹配算法',
    dataset: '典型公路隧道地质钻探与掌子面素描特征库',
    hyperparameters: 'PSO 粒子群自适应搜索最佳超参数',
    metrics: '待运行 (未开始)',
    status: 'not_started',
    date: '2026-09-02',
    notes: '用于开挖工法自适应匹配与工序协同。',
  },
  {
    id: 'exp-3',
    modelName: 'Equipment-Spatial-Matching-Model',
    taskType: '装备作业空间干涉与选型优化',
    dataset: '三臂凿岩台车、湿喷机械手装备工装谱系库',
    hyperparameters: '多目标优化遗传算法 NSGA-II',
    metrics: '待运行 (未开始)',
    status: 'not_started',
    date: '2026-09-02',
    notes: '用于第二章：装备谱系化选型与断面空间干涉校核。',
  },
]

// 系统工程台账（全新初始化：0 进度 / 任务全部待办）
export const INITIAL_PROJECTS: ResearchProject[] = [
  {
    id: 'proj-1',
    name: 'Tunnel-SmartConfig: 钻爆法隧道多工序关键参数智能设计与装备配置系统',
    description: '课题核心成果配套系统软件，打通“工法选择-支护设计-装备配置”全链路。',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'React', 'Three.js'],
    progress: 0,
    tasks: [
      { id: 't-1', text: '全工序机械化施工装备谱系库数据建模与实体规范', done: false },
      { id: 't-2', text: '支护参数智能预测模型推理接口开发与力学校验', done: false },
      { id: 't-3', text: '工序协同排产与三维可视化配置界面开发', done: false },
      { id: 't-4', text: '典型公路隧道工程算例验证与测试报告编制', done: false },
    ],
  },
  {
    id: 'proj-2',
    name: 'Rock-Support-FEM: 快速开挖扰动下围岩-支护时空接触力学数值模拟',
    description: '采用 FLAC3D / ABAQUS 针对不同围岩级别开展压力拱演化与支护时机数值仿真。',
    techStack: ['FLAC3D', 'Python Scripting', 'MATLAB'],
    progress: 0,
    tasks: [
      { id: 't-5', text: '全断面法开挖三维数值计算模型建立与网格划分', done: false },
      { id: 't-6', text: '围岩压力拱形成与松动圈动态演化数值仿真', done: false },
      { id: 't-7', text: '多工况下围岩-初支接触时变受力数据提取与分析', done: false },
    ],
  },
]

export const INITIAL_MILESTONES: MilestoneItem[] = [
  {
    id: 'ms-1',
    title: '硕士学位论文开题报告答辩',
    targetDate: '2025-11-15',
    completed: true,
    category: '开题',
    notes: '顺利通过开题考核，确定“钻爆法隧道全工序机械化智能配置”课题方向。',
  },
  {
    id: 'ms-2',
    title: '硕士学位论文中期检查',
    targetDate: '2026-06-20',
    completed: true,
    category: '中期',
    notes: '完成力学仿真机理与数据治理工作，中期检查优秀。',
  },
  {
    id: 'ms-3',
    title: '秋招冲刺截止与意向签约',
    targetDate: '2026-11-20',
    completed: false,
    category: '其他',
    notes: '积极投递目标企业，完成技术面试与三方签约。',
  },
  {
    id: 'ms-4',
    title: '硕士学位论文初稿撰写完成',
    targetDate: '2027-02-04',
    completed: false,
    category: '预答辩',
    notes: '完成全部 6 个章节撰写，交付张志强导师一审。',
  },
  {
    id: 'ms-5',
    title: '学位论文查重与盲审送审',
    targetDate: '2027-03-15',
    completed: false,
    category: '盲审',
    notes: '根据导师修改意见定稿，提交盲审送审。',
  },
  {
    id: 'ms-6',
    title: '硕士研究生毕业正式答辩',
    targetDate: '2027-05-20',
    completed: false,
    category: '答辩',
    notes: '完成论文答辩与毕业离校手续。',
  },
]

// 严格来源于 D:\GitHub\My-Typora-Notes\力扣算法总结.md 的真实高频真题
export const INITIAL_LEETCODE: LeetCodeItem[] = [
  {
    id: 'lc-1',
    number: 1,
    title: '两数之和 (Two Sum)',
    difficulty: 'Easy',
    tags: ['哈希表', '高频'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '遍历数组用 hashtable 记录 {num: i}，检查 target-num 是否在表中，O(n) 空间换时间。',
  },
  {
    id: 'lc-2',
    number: 49,
    title: '字母异位词分组 (Group Anagrams)',
    difficulty: 'Medium',
    tags: ['哈希表', '排序', '字符串'],
    lastReviewed: '2026-08-28',
    nextReview: '2026-09-03',
    reviewStage: 2,
    notes: '异位词排序后字符串相同作为 key 归类，时间复杂度 O(n * k log k)。',
  },
  {
    id: 'lc-3',
    number: 128,
    title: '最长连续序列 (Longest Consecutive Sequence)',
    difficulty: 'Medium',
    tags: ['哈希集合', '并查集'],
    lastReviewed: '2026-08-29',
    nextReview: '2026-09-04',
    reviewStage: 2,
    notes: 'set 去重，只从连续序列起点（即 num-1 不在 set 中）开始向后统计长度，实现严格 O(n)。',
  },
  {
    id: 'lc-4',
    number: 42,
    title: '接雨水 (Trapping Rain Water)',
    difficulty: 'Hard',
    tags: ['双指针', '单调栈', '高频'],
    lastReviewed: '2026-08-25',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '双指针法左右夹逼，维护 max_left 与 max_right，短板决定容量，空间复杂度 O(1)。',
  },
  {
    id: 'lc-5',
    number: 3,
    title: '无重复字符的最长子串',
    difficulty: 'Medium',
    tags: ['滑动窗口', '哈希表'],
    lastReviewed: '2026-08-26',
    nextReview: '2026-09-03',
    reviewStage: 3,
    notes: '滑动窗口维护 [left, right]，用 set/dict 动态收缩左边界，记录窗口最大值。',
  },
  {
    id: 'lc-6',
    number: 25,
    title: 'K 个一组翻转链表',
    difficulty: 'Hard',
    tags: ['链表', '递归/迭代', '高频'],
    lastReviewed: '2026-08-27',
    nextReview: '2026-09-04',
    reviewStage: 2,
    notes: '维护 pre, cur, next 及头尾指针接驳，注意剩余不足 k 个时不翻转处理。',
  },
  {
    id: 'lc-7',
    number: 300,
    title: '最长递增子序列 (LIS)',
    difficulty: 'Medium',
    tags: ['二分查找', '动态规划'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-02',
    reviewStage: 1,
    notes: '贪心 + 二分查找 tails 数组，O(N log N) 解法。',
  },
]

// 严格来源于 D:\GitHub\My-Typora-Notes\计算机与大模型八股.md 的真实高频八股
export const INITIAL_FLASHCARDS: KnowledgeFlashcard[] = [
  {
    id: 'fc-1',
    category: '大模型与 Agent 架构',
    question: '什么是 ReAct（Reason + Act）范式？与纯思维链（CoT）的核心区别是什么？',
    answer: 'ReAct 是 Agent 核心范式：思考(Thought) ➔ 行动(Action/工具调用) ➔ 观察(Observation/解析返回) ➔ 再思考。与 CoT 仅暴露内部推理过程不同，ReAct 将推理与外部工具/环境交互深度结合，形成闭环。',
    mastery: 'mastered',
    lastReviewDate: '2026-09-01',
  },
  {
    id: 'fc-2',
    category: '大模型与推理加速',
    question: '为什么长文本推理显存瓶颈在 KV Cache？Prompt Caching 原理是什么？',
    answer: '自回归生成每步需要保留历史 Token 的 Key 和 Value 矩阵，显存占用随长度线性增长且受限于 GPU HBM 带宽。Prompt Caching 将固定 System Prompt 的 KV 向量持久化缓存，后续请求直接复用跳过重复前缀计算，显著降低成本并缩短首字时间 (TTFT)。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-31',
  },
  {
    id: 'fc-3',
    category: '大模型框架与消息流',
    question: 'LangChain / FastMCP 中的四种标准 Message 类型及其作用分别是什么？',
    answer: '1. SystemMessage: 上帝视角/人设设定与规则约束；2. HumanMessage: 用户实际提问；3. AIMessage: 大模型输出历史与思维链；4. ToolMessage/FunctionMessage: 工具调用执行完毕后返回的结构化查询结果。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-30',
  },
  {
    id: 'fc-4',
    category: 'Python 异步与高性能并发',
    question: 'Python asyncio 协程与事件循环是如何实现高并发非阻塞 I/O 的？',
    answer: '单线程事件循环驱动就绪协程。遇到 await 阻塞 I/O 时主动挂起协程并交出 CPU 控制权，底层由 epoll/IOCP 监听网络/文件就绪，就绪后恢复执行，极大减少线程切换与锁竞争开销。',
    mastery: 'medium',
    lastReviewDate: '2026-08-29',
  },
  {
    id: 'fc-5',
    category: 'MySQL 与数据库基础',
    question: 'MySQL 事务可重复读（RR）隔离级别是如何利用 MVCC 和锁解决幻读的？',
    answer: '1. 快照读：通过 Undo Log 版本链 + ReadView（事务首次 SELECT 生成快照）保证读一致性；2. 当前读：通过 Next-Key Lock（记录锁 + 间隙锁 Gap Lock）在 UPDATE/FOR UPDATE 时锁住记录与开闭区间，防止并发插入。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-28',
  },
]

export const INITIAL_TOP3: DailyTop3Item[] = [
  { id: 'top-1', text: '完善开题报告中全工序机械化施工装备谱系化选型表', done: false, category: 'research' },
  { id: 'top-2', text: '导入并跟进飞书表格秋招投递企业进展', done: false, category: 'career' },
  { id: 'top-3', text: '复习 2 道力扣高频题（哈希/双指针）与大模型八股', done: false, category: 'study' },
]

// 严格来源于用户周计划图片的项目清单与习惯矩阵
export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'h-1',
    name: '毕业论文 / 文献阅读',
    color: '#6366f1',
    icon: 'BookOpen',
    category: '学业',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-2',
    name: '力扣刷题 / 算法总结',
    color: '#10b981',
    icon: 'Code',
    category: '技能学习',
    logs: {
      '2026-08-30': true,
      '2026-08-31': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-3',
    name: 'ML/DL / CAE / AI应用',
    color: '#3b82f6',
    icon: 'Cpu',
    category: '技能学习',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-4',
    name: '秋招投递 / 选调行测',
    color: '#f59e0b',
    icon: 'Briefcase',
    category: '个人',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
      '2026-09-02': true,
    },
  },
  {
    id: 'h-5',
    name: '健身锻炼 (肩/胸/背/腿/核心)',
    color: '#ef4444',
    icon: 'Flame',
    category: '健身',
    logs: {
      '2026-08-30': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-6',
    name: 'English Vocabulary & 听说',
    color: '#8b5cf6',
    icon: 'Smile',
    category: 'English',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-7',
    name: '阅读《当下的力量》',
    color: '#ec4899',
    icon: 'BookOpen',
    category: '阅读',
    logs: {
      '2026-08-31': true,
    },
  },
]

export const INITIAL_NOTES: QuickCaptureNote[] = [
  {
    id: 'note-1',
    content: '导师张志强教授指导意见：学位论文要突出“岩-支-机”时空协同机理，将全工序机械化施工的标准工法与智能化参数配置系统紧密结合，兼具理论深度与工程实用价值。',
    createdAt: '2026-09-01 10:00',
    tags: ['导师意见', '开题'],
  },
  {
    id: 'note-2',
    content: '面试追问点备忘：CAE Agent 与 Agentic RAG 中的 Prompt Caching 是如何降低首字生成延迟（TTFT）与 Token 成本的？核心在于持久化前缀 KV Cache。',
    createdAt: '2026-09-02 09:30',
    tags: ['八股复盘', '大模型'],
  },
]
