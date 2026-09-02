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

-- 3. 创建匿名/公开读写策略 (适用于个人工作台的 anon key 访问)
DROP POLICY IF EXISTS "Allow public read access" ON public.workspace_storage;
CREATE POLICY "Allow public read access"
ON public.workspace_storage
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert access" ON public.workspace_storage;
CREATE POLICY "Allow public insert access"
ON public.workspace_storage
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update access" ON public.workspace_storage;
CREATE POLICY "Allow public update access"
ON public.workspace_storage
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete access" ON public.workspace_storage;
CREATE POLICY "Allow public delete access"
ON public.workspace_storage
FOR DELETE
TO anon, authenticated
USING (true);

-- 4. 创建触发器函数：在更新时自动刷新 updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_workspace_storage_updated_at ON public.workspace_storage;
CREATE TRIGGER set_workspace_storage_updated_at
    BEFORE UPDATE ON public.workspace_storage
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 完成！
