-- Выполнено 15.10.2026 через Supabase SQL Editor.
-- Только чтение public.tasks; временная таблица содержит результаты.
-- Моделирование ролей, не создание второго аккаунта Auth.
BEGIN;
CREATE TEMP TABLE IF NOT EXISTS hw5_access_results (
  check_name text,
  passed boolean
);
TRUNCATE pg_temp.hw5_access_results;
DO $$
DECLARE
  original_role text := current_user;
  owner_uuid uuid;
  other_uuid uuid := gen_random_uuid();
  expected_count bigint;
  owner_count bigint;
  other_count bigint;
  anon_blocked boolean := false;
BEGIN
  SELECT owner_id INTO owner_uuid FROM public.tasks LIMIT 1;
  IF owner_uuid IS NULL THEN
    RAISE EXCEPTION 'Для проверки нужна хотя бы одна задача';
  END IF;
  SELECT count(*) INTO expected_count FROM public.tasks WHERE owner_id = owner_uuid;
  WHILE EXISTS (SELECT 1 FROM public.tasks WHERE owner_id = other_uuid) LOOP
    other_uuid := gen_random_uuid();
  END LOOP;
  PERFORM set_config('request.jwt.claim.sub', owner_uuid::text, true);
  PERFORM set_config('role', 'authenticated', true);
  SELECT count(*) INTO owner_count FROM public.tasks;
  PERFORM set_config('request.jwt.claim.sub', other_uuid::text, true);
  SELECT count(*) INTO other_count FROM public.tasks;
  PERFORM set_config('request.jwt.claim.sub', '', true);
  PERFORM set_config('role', 'anon', true);
  BEGIN
    PERFORM count(*) FROM public.tasks;
  EXCEPTION WHEN insufficient_privilege THEN
    anon_blocked := true;
  END;
  PERFORM set_config('role', original_role, true);
  INSERT INTO pg_temp.hw5_access_results VALUES
    ('Owner sees own tasks', owner_count = expected_count),
    ('Other user sees no tasks', other_count = 0),
    ('Anonymous access denied', anon_blocked);
END $$;
COMMIT;
SELECT * FROM pg_temp.hw5_access_results;
