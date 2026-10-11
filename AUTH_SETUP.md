# 单账户登录上线记录

2026-10-11 已在工作台使用的 Supabase 项目完成以下操作：

- 唯一邮箱密码账户已存在，邮箱已确认。
- 在私有 `workspace_backup` schema 中保留迁移前的 `workspace_storage` 快照。快照与原表均为 24 条记录，匿名角色没有读取权限。
- 执行 [supabase_owner_migration.sql](./supabase_owner_migration.sql)，将原有记录归属唯一账户，并把四条公开读写策略替换为仅该账户可用的策略。
- 模拟验证：账户可见 24 条记录，其他已登录身份可见 0 条，匿名身份无法读取。
- 收紧公开数据库函数的执行权限，并固定更新时间函数的 `search_path`。

待在 Supabase Dashboard 的 **Authentication → Providers → Email** 确认 **Allow new users to sign up** 已关闭。即使该开关尚未关闭，数据库策略也只允许上述唯一账户读取和修改工作台记录。

同一账户可在电脑和手机同时登录。不要开启 **Single session per user**；工作台的退出按钮仅结束当前设备的会话。

如果未来要重建数据库，先创建邮箱密码账户，再运行 [supabase_schema.sql](./supabase_schema.sql) 和 [supabase_owner_migration.sql](./supabase_owner_migration.sql)。迁移脚本中的 `REPLACE_WITH_OWNER_EMAIL` 需替换为该账户邮箱；不要把密码写进 SQL 或代码。
