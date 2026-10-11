# 单账户登录上线步骤

登录界面和权限迁移已在代码中准备好。**先完成数据库步骤，再部署新版网站**；否则新版网站会要求登录，但数据库可能仍允许匿名访问。

1. 在 Supabase Dashboard 的 **Authentication → Users** 中，用 **Add user → Create new user** 为你的唯一邮箱创建邮箱密码账户，并确认邮箱。密码只在 Dashboard 中输入，不要写进代码、SQL 或聊天。
2. 在 **Authentication → Providers → Email** 中关闭允许新用户注册（Allow new users to sign up）。保留 Email 登录方式。确认该账户能用邮箱和密码登录。
3. 在 **Table Editor** 导出 `public.workspace_storage` 作为迁移前备份。
4. 打开 [supabase_owner_migration.sql](./supabase_owner_migration.sql)，只将 `REPLACE_WITH_OWNER_EMAIL` 替换为唯一账户的邮箱，然后复制到 Supabase **SQL Editor** 执行。脚本会把旧记录归属到该账户，并删除此表原有的全部开放策略。
5. 在 SQL Editor 检查策略：

   ```sql
   select policyname, roles, cmd
   from pg_policies
   where schemaname = 'public' and tablename = 'workspace_storage';
   ```

   应只有四条 `Workspace owner ...` 策略，角色均为 `authenticated`。不要再次运行旧版公开策略 SQL。
6. 部署代码后，分别在电脑和手机用同一邮箱和密码登录。修改一条测试记录，在另一台设备刷新并确认同步。退出按钮只退出当前设备。

Supabase 默认允许同一用户在多台设备保持会话。不要开启 **Single session per user**，否则新设备登录会挤掉旧设备。
