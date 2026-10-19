import type { ModelExperiment, ResearchProject } from '@/types'

export const LEGACY_MODELS: ModelExperiment[] = [
  {
    id: 'exp-geo-rock-support-safety-net',
    modelName: 'GeoSupportSafety-DNN: 地质参数-围岩等级-支护参数-结构安全性映射神经网络',
    taskType: '多维非线性高维力学映射与结构安全性智能预测',
    dataset: '隧道原位地质钻探监测库 + 三维围岩数值仿真高维矩阵 (地应力/弹性模量/Kv/围岩分级II~V/支护工况/安全系数与收敛变形)',
    hyperparameters: 'DNN (4隐含层: 256-128-64-32) + AdamW (lr: 1e-4), Loss: MSE + 压力拱极限平衡先验物理惩罚项',
    metrics: '待启动训练 (目标: 安全性预测 R² ≥ 0.94, MAE ≤ 3.2%)',
    status: 'not_started',
    date: '2026-09-03',
    notes: '核心算法目标：训练深度神经网络，精准拟合地质参数（地应力场、岩体弹性模量、完整性系数Kv、地下水状态）、围岩级别（II~V级）和支护参数（锚杆间距排距、喷混凝土厚度、格栅/型钢拱架型号）与结构安全性指标（开挖后围岩塑性区深度、接触应力、拱顶沉降、支护安全系数）之间的非线性全局映射关系，支撑智能选配与安全校验。',
  },
]

// 系统工程台账（包含一个大系统，涵盖装备配置、工法选配、支护参数配置等子系统，并深度介入 RAG 与施工智能体板块）
export const LEGACY_PROJECTS: ResearchProject[] = [
  {
    id: 'proj-tunnel-integrated-system',
    name: '钻爆法隧道全工序机械化施工智能决策与协同配置系统 (核心大系统)',
    description: '课题核心综合成果大系统，打通“工法选配 - 支护参数配置 - 机械装备谱系化选型 - Agentic RAG规程问答与自主调度智能体”的全链路数字孪生与协同配置平台。',
    techStack: ['Python', 'FastAPI', 'PyTorch', 'Agentic RAG', 'LangChain', 'React', 'Three.js'],
    progress: 0,
    tasks: [
      {
        id: 'task-sub-equipment',
        text: '【装备配置子系统】构建三臂凿岩台车、湿喷机械手、拱架安装机装备作业工装谱系库，研发开挖断面空间作业干涉校核与智能选型算法',
        done: false,
      },
      {
        id: 'task-sub-method',
        text: '【工法选配子系统】依据围岩性态动态分级，实现开挖工法（全断面法、台阶法、双侧壁导坑法、CD/CRD法）自适应匹配与工序时空协同调度',
        done: false,
      },
      {
        id: 'task-sub-support',
        text: '【支护参数配置子系统】调用地质-围岩-支护-安全性映射神经网络，实现初期支护（锚杆/喷混/钢拱架）参数快速推荐与受力安全校核',
        done: false,
      },
      {
        id: 'task-sub-rag-agent',
        text: '【RAG 与智能体板块】接入行业标准规范与工程案例知识库（Agentic RAG），构建施工协同决策智能体（Agent），实现方案自检、推理与工程预警',
        done: false,
      },
    ],
  },
]

