# 个人工作台项目记忆 (Project Memory & Guidelines)

本文档是该项目的专属核心记忆与研发规范，所有与本项目的交互与开发必须严格遵守以下准则。

---

## 🚀 核心工作流与部署法则（强制执行）

### 1. 所有操作最后必须同步到 Vercel
- **自动同步流水线**：本项目通过 GitHub 仓库 `main` 分支绑定 Vercel 进行自动化 CI/CD 构建部署。
- **强制收尾闭环**：在每次完成代码修改、功能迭代或 Bug 修复后，**最后必须自动执行**以下流程同步到 Vercel，无需等待用户反复催促：
  1. 本地构建校验：`npm run build` 确保类型与构建 100% 通过（Exit Code 0）。
  2. 暂存与提交：`git add -A` 并撰写符合规范的中文或清晰的语义化提交信息 `git commit -m "..."`。
  3. 推送触发部署：`git push origin main`，触发 Vercel 自动化部署。
  4. 向用户明确汇报同步与部署状态。

---

## 💼 核心业务模块与设计规范

### 1. 秋招求职管家 (Career Pipeline)
- **纯净手动导入机制**：
  - 已彻底移除飞书实时 Webhook 同步与后台通道，避免后台静默覆盖本地数据；
  - 纯净依托「导入飞书」手动模块（支持粘贴 TSV/CSV 文本或直接上传 Excel 表格）；
  - 数据存储在 `localStorage`（Key: `workspace_jobs_v4`），且可选通过 Supabase 云端备份。
- **状态智能互锁引擎 (`smartTransformJob`)**：
  - 任何针对投递状态（`status`）的修改，必须通过 `smartTransformJob` 管道进行自洽转换：
    - `wishlist`（意向准备）⇄ `applyStatus` 为 `'未投递'`，展示标签自动为 `['意向备战']`；
    - 进入 `applied`、`assessment`、`interview1`~`3`、`hr`、`offer` 流程时，`applyStatus` 自动为 `'已投递'`，展示标签与当前轮次严格对齐；
    - 进入 `rejected`（流程终止/已挂）时，自动保留终止前最高阶段（`lastStage`），UI 呈现对应阶段徽章（如 `已挂·一面`、`已挂·二面` 等），并自动补全该轮次记录，确保量化大屏漏斗与各轮转化率统计精准不漏；
    - 从 `rejected` 恢复推进时，自动清理终止标记并恢复为正常推进标签。
- **多板块实时响应**：
  - 看板模式 (`KanbanBoard`)、表格模式 (`JobTable`)、详情复盘弹窗 (`JobDetailModal`)、量化大屏 (`CareerAnalyticsPage`) 与主页概览在状态编辑后必须毫秒级联动更新。
  - `StorageService.getJobs()` 仅做状态合法性规范化，不得根据备注中残留的历史文字粗暴覆盖用户当前设置的正常状态。

### 2. 硕士毕业与学术科研 (Research & Thesis)
- 硕士论文写作进展、盲审/答辩倒计时、论文章节字数跟踪与模型实验追踪。

### 3. 力扣算法刷题与复习 (LeetCode & Ebbinghaus)
- 艾宾浩斯记忆曲线复习机制，独立于面试模块，每日到期题目实时提醒。

### 4. 个人生活与待办四象限 (Daily Life & Top3)
- 精力/心情日记、时间块（TimeBlock）、四象限待办任务（重急 / 重缓 / 轻急 / 轻缓）。

---

## 🌐 语言与回复规范
- 严格使用**中文**回答用户。
- 代码与路径引用必须使用标准的可点击 Markdown 链接。
