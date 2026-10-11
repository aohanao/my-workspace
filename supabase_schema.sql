-- ==============================================================================
-- 个人工作台 (Personal Workspace) - Supabase 数据库一键建表脚本
-- 在 Supabase 控制台的 SQL Editor 中粘贴并点击 "Run" 执行即可
-- ==============================================================================

-- 1. 创建工作台通用存储表
CREATE TABLE IF NOT EXISTS public.workspace_storage (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 开启行级安全策略 (Row Level Security - RLS)
ALTER TABLE public.workspace_storage ENABLE ROW LEVEL SECURITY;

-- 3. 移除旧版公开策略。创建唯一账户后，运行 supabase_owner_migration.sql
--    建立仅限该账户的读写策略；在迁移前，此表不会向客户端开放。
DROP POLICY IF EXISTS "Allow public read access" ON public.workspace_storage;
DROP POLICY IF EXISTS "Allow public insert access" ON public.workspace_storage;
DROP POLICY IF EXISTS "Allow public update access" ON public.workspace_storage;
DROP POLICY IF EXISTS "Allow public delete access" ON public.workspace_storage;
REVOKE ALL ON public.workspace_storage FROM anon;

-- 4. 创建触发器函数：在更新时自动刷新 updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = pg_catalog;

DROP TRIGGER IF EXISTS set_workspace_storage_updated_at ON public.workspace_storage;
CREATE TRIGGER set_workspace_storage_updated_at
    BEFORE UPDATE ON public.workspace_storage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. 开启 Supabase Realtime 实时数据监听广播（飞书 Webhook 写入后网页秒级自动响应更新）
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_storage;
ALTER TABLE public.workspace_storage REPLICA IDENTITY FULL;

-- 完成！
