# 个人知识库：第一阶段

本版本包含知识总览、Markdown 文档管理、RAG 与知识图谱工作区、AI 助手浮窗和原有复盘栏目。接入协议与鉴权适配层见 `KNOWLEDGE_INTEGRATIONS.md`；未配置真实服务时不调用模型、不查询外部 RAG、不生成知识图谱。

## 页面与原有数据

- `/knowledge`：知识总览，资料统计、主题入口、最近更新和服务工作区入口。
- `/knowledge/documents`：文档库，支持标题 / 正文 / 文件名搜索、主题筛选、收藏、分页和回收站。
- `/knowledge/search`：RAG 检索工作区。
- `/knowledge/graph`：知识图谱画布与来源面板。
- `/knowledge/documents/[id]`：稳定的文档地址，阅读、编辑、导出与恢复文档。
- `/knowledge/review`：原有知识与算法复盘，包含 LeetCode、技术记忆卡片。
- `/study`：兼容旧入口，跳转至 `/knowledge/review`。

LeetCode、记忆卡片和复习日期继续使用原存储键，无需搬迁或重建。

## 文档与保存方式

知识文档单独保存在现有个人 Supabase 项目的 `public.knowledge_documents` 表中。新表沿用 `workspace_storage` 唯一账户的访问边界，匿名身份和其他账户无法访问。

- `id`：稳定 UUID，后续 RAG、图谱和任务关联均引用这个 ID。
- `markdown`：UTF-8 Markdown 原文。保留原文，不把解析结果作为唯一正文。
- `title`、`topic`、`tags`：人工整理的资料信息。
- `source_kind`、`source_name`：工作台笔记、Markdown 文件或本地 PDF 转换结果的来源信息。
- `revision`：乐观锁，检测其他页面或设备修改，避免静默覆盖；当前不提供版本历史。
- `deleted_at`：软删除，文档可以从回收站恢复。

列表仅查询摘要信息，每页 20 条，打开文档时才加载正文。写入按篇进行，不进入 `StorageService.initCloudSync` 的全量同步，也不将整库正文复制到 localStorage。工作台的旧版 JSON 导出不含独立文档；当前可逐篇导出 Markdown，原始本地文件也应保留。

编辑草稿在当前标签页的 sessionStorage 暂存，键包含账户 ID 和文档 ID。成功保存或取消编辑时清理，退出登录时清理本标签页的知识草稿。关闭标签页后不保证恢复草稿，最终持久化以保存到云端为准。

数据库搜索当前为不区分大小写的子串匹配，覆盖标题、Markdown 正文与来源文件名。它是第一阶段的普通文档查找功能，不提供语义检索或中文分词索引；资料规模增长时再评估索引与已有 RAG 的分工。

## 导入约定

已有 Markdown → 导入；PDF → 用户在本地转换成 Markdown → 导入 → 在来源中选择「PDF 本地转 Markdown」。

- 每篇最多 2 MB；每批最多 20 篇、总计 20 MB。
- 文件以 UTF-8 读取，去除 BOM，Markdown 正文保留。
- 批量导入逐篇反馈失败文件，同名文件不会覆盖已有文档。
- 本阶段不托管图片附件、PDF 原件或 Obsidian 目录；相对图片路径与 `[[双链]]` 不自动迁移。
- 阅读支持常用 Markdown、代码块、表格和任务列表；原始 HTML 不执行，危险链接不直接开放。

## 后续真实接入工作（服务适配接口已留出）

1. RAG：通过文档 ID 与 revision 同步原文、分块和索引状态，检索结果带回原文地址。索引作为派生数据，删除或改文档时同步失效。
2. 知识图谱：实体 / 关系独立存储，保留文档 ID、来源段落和提取版本，点击图谱关系可追溯原文。无需现在创建空图谱或模拟节点。
3. AI：在资料管理、来源和引用机制确认后单独设计，不与文档保存流程绑定。

建表快照见 `supabase_knowledge_schema.sql`，仅适用于独立个人项目，不能对通用多用户项目运行。
