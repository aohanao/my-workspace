import type { ModelExperiment, ResearchProject } from '@/types'

// 依据项目 thesis-outline.ts 制定；候选架构和评测指标均为研究计划，非已完成结果。
export const RESEARCH_MODELS: ModelExperiment[] = [
  {
    "id": "exp-plan-mechanism",
    "modelName": "01 · 围岩损伤与压力拱机理特征",
    "taskType": "第2章｜数值试验与机理特征提取",
    "dataset": "地质、侧压力系数、埋深、工法、循环进尺和支护时机 → 应力/位移时序、塑性区、压力拱边界及荷载传递特征",
    "hyperparameters": "MATLAB–FLAC3D 参数化试验；先做网格与边界敏感性分析，再提取压力拱和损伤特征",
    "metrics": "待验证：数值收敛性、监测趋势一致性、机理特征稳定性",
    "notes": "交付参数空间、基准算例和机理特征字典，作为第3章数据库和第4章机理约束的依据。",
    "status": "not_started",
    "date": "2026-10-19"
  },
  {
    "id": "exp-plan-dataset",
    "modelName": "02 · 力学时序数据库与数据质量控制",
    "taskType": "第3章 3.2｜批量仿真与序列样本构建",
    "dataset": "地质—开挖—支护参数矩阵；按里程、施工工序提取围岩—支护全过程状态与响应",
    "hyperparameters": "MATLAB–FLAC3D 自动批处理；统一单位、工序索引、缺失值与异常样本规则；归一化仅拟合训练集",
    "metrics": "待统计：有效工况覆盖率、仿真成功率、缺失率与划分后的分布差异",
    "notes": "按工程或完整仿真工况分组划分训练/验证/测试集；相邻里程和同一轨迹不跨集合，防止时序泄漏；交付可复现实验数据版本。",
    "status": "not_started",
    "date": "2026-10-19"
  },
  {
    "id": "exp-plan-world-model",
    "modelName": "03 · 围岩—支护力学响应世界模型",
    "taskType": "第3章 3.3｜状态演化代理模型与多步推演",
    "dataset": "输入当前状态、地质条件及开挖/支护动作；输出下一工序状态、变形、应力、塑性区与支护内力",
    "hyperparameters": "先建 MLP 基线，再比较 LSTM/GRU 与时序 Transformer 代理模型；层数、窗口、学习率通过验证集选择",
    "metrics": "待评测：各响应量 MAE/RMSE/R²、多步滚动误差、推演耗时及未见工况泛化",
    "notes": "这里的世界模型是施工状态演化代理模型。先验证单步预测，再评估多步误差累积；保留 DNN 作为对照，交付带数据版本和适用域的模型。",
    "status": "not_started",
    "date": "2026-10-19"
  },
  {
    "id": "exp-plan-safety",
    "modelName": "04 · 世界模型驱动的支护安全评价",
    "taskType": "第3章 3.4｜规范约束与多指标适配度",
    "dataset": "候选支护方案 + 世界模型推演响应 → 围岩变形、结构受力与安全控制指标及适配度",
    "hyperparameters": "建立可追溯的规范阈值、指标计算和约束筛选；安全阈值按采用规范及工程条件确认",
    "metrics": "待验证：危险方案漏判率、误报率、与数值模拟评价一致率及评价耗时",
    "notes": "先完成安全判据和基准算例复核，再接入代理模型；记录条文来源、适用条件和超限原因，不能将预测精度直接当作安全保证。",
    "status": "not_started",
    "date": "2026-10-19"
  },
  {
    "id": "exp-plan-transformer",
    "modelName": "05 · 机理驱动的时空 Transformer 支护决策",
    "taskType": "第4章 4.2–4.3｜多类型支护参数联合预测",
    "dataset": "地质—工法—历史支护序列 + 里程/工序编码 + 压力拱与损伤特征 → 锚杆、喷混凝土、钢拱架等参数",
    "hyperparameters": "空间与时间注意力、多输出预测头；监督损失 + 机理/安全约束；窗口、层数、头数和损失权重由验证集确定",
    "metrics": "待评测：连续参数 MAE/RMSE、离散参数准确率、方案可行率与安全约束违反率",
    "notes": "在第2章机理特征和第3章数据可用后训练；比较典型机器学习与时序模型，分别消融空间注意力、时间注意力、机理特征和约束损失。",
    "status": "not_started",
    "date": "2026-10-19"
  },
  {
    "id": "exp-plan-feedback",
    "modelName": "06 · 决策—推演—评价反馈优化与工程验证",
    "taskType": "第4章 4.4–4.5 / 第5章 5.4｜闭环修正及工程验证",
    "dataset": "Transformer 候选方案 → 世界模型推演 → 安全评价 → 参数反馈修正 → 工法/装备协同配置",
    "hyperparameters": "约束筛选与有界参数搜索；记录修正次数与停止条件，未找到可行解时交由人工复核",
    "metrics": "待验证：修正前后安全可行率、配置代价、决策耗时；SHAP/注意力解释；独立工程算例对比",
    "notes": "依次验证无反馈、无机理约束和完整闭环；关键推荐方案返回 FLAC3D 复核，再评价工程合理性与系统效率。所有指标均待实验，暂不承诺固定精度。",
    "status": "not_started",
    "date": "2026-10-19"
  }
]

export const RESEARCH_PROJECTS: ResearchProject[] = [
  {
    "id": "proj-tunnel-integrated-system",
    "name": "钻爆法隧道全工序机械化施工智能配置系统",
    "description": "依据第2—5章构建“机理与数据底座 → 力学响应世界模型 → 支护安全评价 → 时空 Transformer 支护决策与反馈修正 → 工法—支护—装备协同配置 → 工程验证”主线。系统集成训练后的模型与评价规则，形成可追溯、可复核的配置方案。",
    "techStack": [
      "MATLAB",
      "FLAC3D",
      "Python",
      "PyTorch",
      "FastAPI",
      "React"
    ],
    "progress": 0,
    "tasks": [
      {
        "id": "task-plan-data",
        "text": "【数据与机理底座｜第2章/3.2】统一工程、地质、里程、工序和支护数据；管理 MATLAB–FLAC3D 仿真数据、压力拱/损伤特征及版本。",
        "done": false
      },
      {
        "id": "task-plan-world",
        "text": "【力学响应预测｜3.3】加载世界模型，支持单步预测、施工过程多步推演、模型版本及适用工况提示。",
        "done": false
      },
      {
        "id": "task-plan-safety",
        "text": "【支护安全评价｜3.4】配置规范来源与安全阈值，展示变形、结构受力、超限原因和方案综合适配度。",
        "done": false
      },
      {
        "id": "task-plan-decision",
        "text": "【支护智能决策｜第4章】接入时空 Transformer，完成候选生成—世界模型推演—安全评价—反馈修正闭环，保留人工复核入口。",
        "done": false
      },
      {
        "id": "task-plan-equipment",
        "text": "【工法—支护—装备配置｜5.2/5.3】结合工程工法条件与支护方案，构建装备谱系、断面空间约束校核、循环时间及数量/工效匹配。",
        "done": false
      },
      {
        "id": "task-plan-ui",
        "text": "【系统集成与可编辑管理｜5.3】组织输入、方案对比、响应曲线、配置结果及报告导出；支持项目说明、技术栈和模块任务维护。",
        "done": false
      },
      {
        "id": "task-plan-validation",
        "text": "【工程应用验证｜5.4】以独立工程算例对比配置结果、FLAC3D 力学响应、安全性、系统耗时及工程适用性，保存模型与数据版本。",
        "done": false
      },
      {
        "id": "task-plan-optional",
        "text": "【可选扩展】规范检索/RAG、工程智能体与三维展示按需求扩展；优先完成大纲中的力学预测、支护决策与装备配置核心链路。",
        "done": false
      }
    ]
  }
]
