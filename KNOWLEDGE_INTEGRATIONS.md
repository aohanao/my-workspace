# 知识库接入契约 v1

本版本完成工作区和可调用的接口边界。尚未配置真实 RAG、图谱或问答服务，不启动分块、嵌入、索引任务或模型调用，也不返回演示答案或伪造的图谱数据。

## 页面

- `/knowledge`：知识总览，真实文档数、收藏数、复盘数量、主题入口、最近文档与服务入口。
- `/knowledge/documents`：Markdown 文档库；支持 `q`、`topic` 查询参数。
- `/knowledge/search`：RAG 检索工作区，展示真实片段、相关分数、章节与原文链接。
- `/knowledge/graph`：图谱画布，实体、关系、缩放、选中实体和来源文档。
- `/knowledge/review`：原有算法和记忆卡。
- 右下角 AI 助手：独立的知识问答入口，在文档页自动携带当前文档 ID。问答仅在配置服务后启用，对话暂存在当前页面内存，不写入数据库。
- 首页的周 / 月计划在每日待办右侧独立小窗内，移动端顺序排列；不再占据右下角。

## 浏览器到工作台 API

所有接口携带当前 Supabase 登录的 `Authorization: Bearer <access_token>`。服务器调用 `getUser` 验证令牌，并通过原工作台的 RLS 记录确认是该独立工作台的所有者。不会把浏览器的 JWT 转发给外部知识服务。成功结果和错误均设置 `private, no-store`。

| 接口 | 用途 |
| --- | --- |
| `GET /api/knowledge/status` | 各服务是否已配置（不是运行健康检查） |
| `POST /api/knowledge/search` | RAG 检索 |
| `POST /api/knowledge/graph` | 图谱查询 |
| `POST /api/knowledge/chat` | 带引用的知识问答，v1 使用完整 JSON 响应 |
| `GET /api/knowledge/documents?limit=50&cursor=...&since=...` | 按更新时间和 ID 排序的文档清单，包含回收站记录 |
| `GET /api/knowledge/documents/{uuid}` | 原始 Markdown、来源与 revision；回收站记录正文为 null |

`status` 返回：

```json
{ "version": "1", "rag": { "configured": false }, "graph": { "configured": false }, "assistant": { "configured": false } }
```

错误统一返回 `{ "error": { "code": "NOT_CONFIGURED", "message": "RAG 检索服务尚未接入" }, "request_id": "..." }`。状态包括 400 参数错误、401 未登录、403 非所有者、404 文档不可读、413 请求过大、415 内容类型错误、502 上游不可用或响应格式错误、503 未配置或内部服务暂不可用。

文档清单结果为 `{ documents: [...摘要], next_cursor: string | null }`，不包含正文。`since` 使用 ISO 时间，`cursor` 原样传回，使用 since 时后续分页保持相同 since。清单按 ID / revision 去重；回收站记录用于撤销索引。正式建立持续同步时，还需结合现有 RAG 的索引任务、水位、重试和更新时间策略设计，不将本接口当作已经运行的可靠消息队列。初次入库可完整遍历清单，再逐篇读取原文，单篇上限沿用 2 MB。

## 服务端到已有知识服务

六个服务端环境变量见 `.env.example`。BASE_URL 与 API_KEY 均配置后才启用对应能力；密钥通过外部请求的 `Authorization: Bearer <service_api_key>` 传递。三个服务可以是同一个项目的不同前缀，也可以分别部署。生产环境要求可从 Vercel 访问的 HTTPS 服务，本地 localhost 不能作为线上服务地址。

下面格式是工作台的标准协议；已有 RAG 如果字段或路径不同，在 `src/lib/server/knowledge-integrations.ts` 的 provider / 归一化层中适配，不改页面。TypeScript 类型在 `src/types/knowledge-integrations.ts`，浏览器客户端在 `src/lib/knowledge-api.ts`。

### RAG：POST `{KNOWLEDGE_RAG_BASE_URL}/search`

请求：`{ query: string, top_k: 1..20, topic?: string, owner_id: string }`。query 最多 2000 字。topic 为工作台主题之一。owner_id 由服务器填入，不信任用户自报身份。

响应：

```json
{
  "hits": [{
    "id": "chunk-id",
    "document_id": "11111111-1111-4111-8111-111111111111",
    "title": "文档标题",
    "excerpt": "原文片段",
    "section": "章节位置（可选）",
    "score": 0.82
  }]
}
```

score 是服务返回的有限数值，不假定是百分比或特定相似度。document_id 必须映射到工作台的真实文档，页面跳回 `/knowledge/documents/{document_id}`。

### 图谱：POST `{KNOWLEDGE_GRAPH_BASE_URL}/graph`

请求：`{ query: string, limit: 1..120, depth: 1..3, owner_id: string }`。画布默认请求 60 个实体、深度 1；空 query 表示读取默认子图。

响应：

```json
{
  "nodes": [
    { "id": "entity-a", "label": "围岩分级", "type": "concept", "document_ids": ["11111111-1111-4111-8111-111111111111"] },
    { "id": "entity-b", "label": "支护参数预测", "type": "method", "document_ids": ["11111111-1111-4111-8111-111111111111"] }
  ],
  "edges": [{ "source": "entity-a", "target": "entity-b", "label": "用于" }]
}
```

节点类型为 concept / method / paper / project / document。节点 ID 唯一，每条边的两端都必须在本次 nodes 中；最多 500 条边。这里只查询并展示图谱，不在前端抽取实体或创建假关系。document_ids 可为空，但有来源时应保留真实文档 ID。

### 问答：POST `{KNOWLEDGE_ASSISTANT_BASE_URL}/chat`

请求：`{ messages: [{ role: "user" | "assistant", content: string }], document_id?: string, owner_id: string }`。最多 12 条消息，总计不超过 24000 字，单条最多 8000 字，最后一条必须是用户问题。浮窗当前只传最近 6 条，每条最多 4000 字；document_id 只在文档页提供，服务端再次验证该文档的访问权限。

响应：`{ answer: string, citations: [{ document_id: uuid, title: string, excerpt?: string, section?: string }] }`。answer 最多 50000 字，最多 20 个引用；回答按安全 Markdown 渲染。当前协议是完整 JSON，不假装已实现流式输出或持久化聊天。已有 RAG 如自带问答链，可适配为此端点；具体模型和提示词等用户确认接入系统后再确定。

## 实施边界

调用超时、输入大小、上游响应大小、引用格式和图谱端点关系都有校验。上游地址仅由服务端环境变量指定，不接受用户提供的代理目标；不跟随重定向，不返回密钥或原始上游错误。配置项只代表已填写，实际健康通过真实查询判断。

当前版本不自动把知识库上传到任何外部服务。真实接入前，应先明确原系统的文档 ID 对应、索引更新与删除策略、引用结构；接入时不需要再重做导航、画布和 AI 浮窗。
