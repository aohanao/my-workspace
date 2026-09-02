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
  EnergyMoodLog,
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

export const INITIAL_MODELS: ModelExperiment[] = [
  {
    id: 'exp-1',
    modelName: 'Physics-Informed-NN-SupportPredictor-v1',
    taskType: '支护参数智能匹配',
    dataset: '隧道工程监测与力学数值模拟数据集 (15k样本)',
    hyperparameters: 'lr: 1e-4, batch: 32, loss: MSE + 压力拱物理约束项',
    metrics: 'Accuracy: 93.5%, MAE: 0.08, 满足力学上界约束',
    status: 'completed',
    date: '2026-08-25',
    notes: '用于章节 4 的混合驱动模型，预测初支喷砼与钢架选型。',
  },
  {
    id: 'exp-2',
    modelName: 'PSO-SVM-RockClassification-Optimizer',
    taskType: '围岩性态动态分级与匹配',
    dataset: '典型公路隧道地质钻探与掌子面素描数据',
    hyperparameters: 'C: 10.5, gamma: 0.12, PSO 粒子群迭代 100 轮',
    metrics: 'F1-Score: 0.91, 泛化准确率: 89.6%',
    status: 'completed',
    date: '2026-08-28',
    notes: '用于开挖工法自适应匹配。',
  },
  {
    id: 'exp-3',
    modelName: 'Equipment-Spatial-Matching-Model',
    taskType: '全断面/台阶法装备作业空间干涉与选型',
    dataset: '三臂凿岩台车、湿喷机械手装备工装谱系库',
    hyperparameters: '多目标优化遗传算法 NSGA-II',
    metrics: '作业效率提升: 28%, 空间干涉率: 0%',
    status: 'training',
    date: '2026-09-01',
    notes: '正在进行大断面公路隧道装备协同排产验证。',
  },
]

export const INITIAL_PROJECTS: ResearchProject[] = [
  {
    id: 'proj-1',
    name: 'Tunnel-SmartConfig: 钻爆法隧道多工序关键参数智能设计与装备配置系统',
    description: '课题核心成果配套系统软件，打通“工法选择-支护设计-装备配置”全链路。',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'React', 'Three.js'],
    progress: 40,
    tasks: [
      { id: 't-1', text: '完成全工序机械化施工装备谱系库数据建模', done: true },
      { id: 't-2', text: '搭建支护参数智能预测模型推理接口', done: true },
      { id: 't-3', text: '开发工序协同排产与可视化三维配置界面', done: false },
      { id: 't-4', text: '典型公路隧道工程算例验证与测试报告', done: false },
    ],
  },
  {
    id: 'proj-2',
    name: 'Rock-Support-FEM: 快速开挖扰动下围岩-支护时空接触力学数值模拟',
    description: '采用 FLAC3D / ABAQUS 针对不同围岩级别开展压力拱演化与支护时机数值仿真。',
    techStack: ['FLAC3D', 'Python Scripting', 'MATLAB'],
    progress: 65,
    tasks: [
      { id: 't-5', text: '完成全断面法开挖三维数值模型建立与网格划分', done: true },
      { id: 't-6', text: '完成围岩压力拱形成与松动圈演化分析', done: true },
      { id: 't-7', text: '提取多工况支护受力时变数据并导出样本集', done: false },
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

export const INITIAL_LEETCODE: LeetCodeItem[] = [
  {
    id: 'lc-1',
    number: 25,
    title: 'K 个一组翻转链表',
    difficulty: 'Hard',
    tags: ['链表', '递归', '高频'],
    lastReviewed: '2026-08-25',
    nextReview: '2026-09-02',
    reviewStage: 3,
    notes: '核心是维护 pre, cur, next 以及头尾指针接驳，注意剩余不足 k 个时不翻转。',
  },
  {
    id: 'lc-2',
    number: 42,
    title: '接雨水',
    difficulty: 'Hard',
    tags: ['双指针', '单调栈', '动态规划'],
    lastReviewed: '2026-08-28',
    nextReview: '2026-09-04',
    reviewStage: 2,
    notes: '双指针法空间复杂度 O(1)，左右两侧维护 max_left 和 max_right。',
  },
  {
    id: 'lc-3',
    number: 300,
    title: '最长递增子序列 (LIS)',
    difficulty: 'Medium',
    tags: ['二分查找', '动态规划'],
    lastReviewed: '2026-08-30',
    nextReview: '2026-09-01',
    reviewStage: 1,
    notes: '贪心 + 二分查找 tails 数组，O(N log N) 解法。',
  },
]

export const INITIAL_FLASHCARDS: KnowledgeFlashcard[] = [
  {
    id: 'fc-1',
    category: '算法与数据结构',
    question: '快速排序的最优、平均和最坏时间复杂度分别是多少？如何避免快排退化？',
    answer: '最优和平均为 O(N log N)，最坏退化为 O(N^2)（如已有序时）。避免退化策略：1. 三数取中法（头部、中间、尾部取中位数作为 Pivot）；2. 随机选取 Pivot；3. 双轴快排；4. 递归深度过大时切换为堆排序（Introsort）。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-30',
  },
  {
    id: 'fc-2',
    category: '计算机网络与操作系统',
    question: 'TCP 为什么是三次握手和四次挥手？',
    answer: '握手三次是为了确认双方的发送和接收能力均正常，并同步初始序号 ISN；挥手四次是因为 TCP 是全双工的，被动关闭方收到 FIN 只能代表对方不再发数据，自己可能还有数据要发送，因此 ACK 与自己的 FIN 需要分开发送。',
    mastery: 'mastered',
    lastReviewDate: '2026-08-29',
  },
]

export const INITIAL_TOP3: DailyTop3Item[] = [
  { id: 'top-1', text: '完善开题报告中全工序机械化施工装备谱系化选型表', done: false, category: 'research' },
  { id: 'top-2', text: '导入并跟进飞书表格秋招投递企业进展', done: false, category: 'career' },
  { id: 'top-3', text: '复习 2 道高频算法真题保持代码手感', done: false, category: 'study' },
]

export const INITIAL_HABITS: HabitItem[] = [
  {
    id: 'h-1',
    name: '算法/专业复习打卡',
    color: '#10b981',
    icon: 'Code',
    logs: {
      '2026-08-30': true,
      '2026-08-31': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-2',
    name: '论文撰写/科研推进 > 1h',
    color: '#6366f1',
    icon: 'BookOpen',
    logs: {
      '2026-08-30': true,
      '2026-08-31': true,
      '2026-09-01': true,
    },
  },
  {
    id: 'h-3',
    name: '作息规律 / 运动充能',
    color: '#f59e0b',
    icon: 'Flame',
    logs: {
      '2026-08-31': true,
      '2026-09-01': true,
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
]
