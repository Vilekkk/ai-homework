-- ============================================================
-- Migration: 20261015000100_create_tasks
-- Description: Create tasks table with RLS and policies
-- Database: PostgreSQL (Supabase)
-- ============================================================

BEGIN;

-- -----------------------------------------------------------
-- 1. Table definition
-- -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title         varchar(200) NOT NULL,
    description   text         NOT NULL DEFAULT '',
    completed     boolean      NOT NULL DEFAULT false,
    priority      text         NOT NULL DEFAULT 'medium',
    created_at    timestamptz  NOT NULL DEFAULT now(),

    -- Constraints
    CONSTRAINT chk_tasks_title_not_empty CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_tasks_title_length    CHECK (length(trim(title)) <= 200),
    CONSTRAINT chk_tasks_description_length CHECK (length(description) <= 2000),
    CONSTRAINT chk_tasks_priority        CHECK (priority IN ('low', 'medium', 'high'))
);

-- -----------------------------------------------------------
-- 2. Enable Row Level Security
-- -----------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------
-- 3. Indexes
-- -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks (owner_id);

-- -----------------------------------------------------------
-- 4. RLS Policies — authenticated users only
-- -----------------------------------------------------------

-- SELECT: read only own tasks
CREATE POLICY "Users can view own tasks"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

-- INSERT: create tasks with matching owner
CREATE POLICY "Users can insert own tasks"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

-- UPDATE: modify only own tasks
CREATE POLICY "Users can update own tasks"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- DELETE: remove only own tasks
CREATE POLICY "Users can delete own tasks"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- -----------------------------------------------------------
-- 5. Revoke public access and grant to authenticated only
-- -----------------------------------------------------------
REVOKE ALL ON TABLE public.tasks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.tasks TO authenticated;

COMMIT;
