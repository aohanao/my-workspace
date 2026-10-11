-- 在 Supabase Auth > Users 中先创建并确认唯一的邮箱账户。
-- 在 SQL Editor 运行前，将下方 REPLACE_WITH_OWNER_EMAIL 替换成该账户邮箱。
-- 建议先在 Supabase Dashboard 导出 workspace_storage 表作为备份。
-- 本脚本保留现有记录，将其归属到唯一账户，然后关闭匿名访问。

BEGIN;

ALTER TABLE public.workspace_storage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_storage ADD COLUMN IF NOT EXISTS owner_id uuid;

DO $$
DECLARE
  owner_email text := 'REPLACE_WITH_OWNER_EMAIL';
  owner_user_id uuid;
  old_policy record;
BEGIN
  IF position('@' in owner_email) = 0 THEN
    RAISE EXCEPTION '请先填写唯一账户的邮箱';
  END IF;

  SELECT id INTO owner_user_id
  FROM auth.users
  WHERE lower(email) = lower(owner_email)
  LIMIT 1;

  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'Supabase Auth 中找不到该邮箱账户';
  END IF;

  -- 已有数据属于当前工作台主人；不改动已经绑定的记录。
  UPDATE public.workspace_storage
  SET owner_id = owner_user_id
  WHERE owner_id IS NULL;

  -- 删除该表此前的全部策略，避免任何宽松策略与新策略叠加。
  FOR old_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'workspace_storage'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.workspace_storage', old_policy.policyname);
  END LOOP;

  EXECUTE format(
    'CREATE POLICY "Workspace owner select" ON public.workspace_storage FOR SELECT TO authenticated USING (owner_id = (select auth.uid()) AND (select auth.uid()) = %L::uuid)',
    owner_user_id
  );
  EXECUTE format(
    'CREATE POLICY "Workspace owner insert" ON public.workspace_storage FOR INSERT TO authenticated WITH CHECK (owner_id = (select auth.uid()) AND (select auth.uid()) = %L::uuid)',
    owner_user_id
  );
  EXECUTE format(
    'CREATE POLICY "Workspace owner update" ON public.workspace_storage FOR UPDATE TO authenticated USING (owner_id = (select auth.uid()) AND (select auth.uid()) = %L::uuid) WITH CHECK (owner_id = (select auth.uid()) AND (select auth.uid()) = %L::uuid)',
    owner_user_id, owner_user_id
  );
  EXECUTE format(
    'CREATE POLICY "Workspace owner delete" ON public.workspace_storage FOR DELETE TO authenticated USING (owner_id = (select auth.uid()) AND (select auth.uid()) = %L::uuid)',
    owner_user_id
  );
END $$;

ALTER TABLE public.workspace_storage ALTER COLUMN owner_id SET NOT NULL;
ALTER TABLE public.workspace_storage ALTER COLUMN owner_id SET DEFAULT auth.uid();
REVOKE ALL ON public.workspace_storage FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_storage TO authenticated;

COMMIT;
