-- 在独立个人项目执行。所有测试数据都在同一事务中回滚。
BEGIN;
SELECT set_config('request.jwt.claims', jsonb_build_object('sub', (SELECT owner_id FROM public.workspace_storage LIMIT 1), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;

INSERT INTO public.knowledge_documents (id, title, markdown, topic)
VALUES ('f47c1f6b-29eb-48a5-9b08-0eca033a9121', '知识库事务测试', '中文正文 100%_测试', '论文研究');

DO $$
DECLARE affected integer;
BEGIN
  IF (SELECT count(*) FROM public.knowledge_documents WHERE id = 'f47c1f6b-29eb-48a5-9b08-0eca033a9121' AND search_text ILIKE '%中文正文%') <> 1 THEN
    RAISE EXCEPTION '所有者读取 / 正文检索失败';
  END IF;
  UPDATE public.knowledge_documents SET title = '更新后的测试文档', revision = 2
    WHERE id = 'f47c1f6b-29eb-48a5-9b08-0eca033a9121' AND revision = 1;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION '所有者更新失败'; END IF;
  UPDATE public.knowledge_documents SET title = '不应覆盖的新标题'
    WHERE id = 'f47c1f6b-29eb-48a5-9b08-0eca033a9121' AND revision = 1;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION '旧版本覆盖检测失败'; END IF;
  UPDATE public.knowledge_documents SET deleted_at = now() WHERE id = 'f47c1f6b-29eb-48a5-9b08-0eca033a9121';
  UPDATE public.knowledge_documents SET deleted_at = null WHERE id = 'f47c1f6b-29eb-48a5-9b08-0eca033a9121';
END $$;

SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.knowledge_documents) <> 0 THEN RAISE EXCEPTION '其他账户可以读到个人文档'; END IF;
  BEGIN
    INSERT INTO public.knowledge_documents (title) VALUES ('不应被创建');
    RAISE EXCEPTION '其他账户可以插入文档';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;

RESET ROLE;
SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM id FROM public.knowledge_documents LIMIT 1;
    RAISE EXCEPTION '匿名身份可以读取文档';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END $$;
RESET ROLE;
SELECT jsonb_build_object('owner_crud_and_search', true, 'revision_conflict', true, 'other_user_denied', true, 'anonymous_denied', true, 'test_will_rollback', true) AS verification;
ROLLBACK;
