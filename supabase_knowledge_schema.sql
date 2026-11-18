-- 独立个人工作台知识库。文档逐篇保存，正文不参与 workspace_storage 全量同步。
-- 仅适用于项目 yepfdgxkfenuercdsvjl；保留原有单账户权限边界。
BEGIN;

CREATE TABLE public.knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
  markdown text NOT NULL DEFAULT '' CHECK (octet_length(markdown) <= 2097152),
  topic text NOT NULL DEFAULT '未分类' CHECK (topic IN ('未分类', '论文研究', '技术学习', '求职面试', '生活随记')),
  tags text[] NOT NULL DEFAULT '{}' CHECK (cardinality(tags) <= 32),
  source_kind text NOT NULL DEFAULT 'note' CHECK (source_kind IN ('note', 'markdown', 'pdf-markdown')),
  source_name text NOT NULL DEFAULT '' CHECK (char_length(source_name) <= 512),
  favorite boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  search_text text GENERATED ALWAYS AS (title || E'\n' || markdown || E'\n' || source_name) STORED
);

CREATE INDEX knowledge_documents_owner_updated_idx ON public.knowledge_documents (owner_id, updated_at DESC, id);
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.knowledge_documents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.knowledge_documents TO authenticated;

DO $$
DECLARE
  workspace_owner uuid;
BEGIN
  IF (SELECT count(DISTINCT owner_id) FROM public.workspace_storage) <> 1 THEN
    RAISE EXCEPTION '知识库初始化要求工作台已有唯一的数据所有者';
  END IF;
  SELECT owner_id INTO workspace_owner FROM public.workspace_storage LIMIT 1;
  EXECUTE format('CREATE POLICY "Personal knowledge select" ON public.knowledge_documents FOR SELECT TO authenticated USING (owner_id = (SELECT auth.uid()) AND (SELECT auth.uid()) = %L::uuid)', workspace_owner);
  EXECUTE format('CREATE POLICY "Personal knowledge insert" ON public.knowledge_documents FOR INSERT TO authenticated WITH CHECK (owner_id = (SELECT auth.uid()) AND (SELECT auth.uid()) = %L::uuid)', workspace_owner);
  EXECUTE format('CREATE POLICY "Personal knowledge update" ON public.knowledge_documents FOR UPDATE TO authenticated USING (owner_id = (SELECT auth.uid()) AND (SELECT auth.uid()) = %L::uuid) WITH CHECK (owner_id = (SELECT auth.uid()) AND (SELECT auth.uid()) = %L::uuid)', workspace_owner, workspace_owner);
END $$;

COMMIT;
