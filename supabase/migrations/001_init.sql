-- ================================================================
-- ODC Management System — Supabase SQL Migration
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ================================================================

-- 1. Create the odc_records table
CREATE TABLE IF NOT EXISTS public.odc_records (
  id                  uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name        text        NOT NULL,
  odc_name            text        NOT NULL,
  candidates          text[]      NOT NULL DEFAULT '{}',
  candidate_count     int4        GENERATED ALWAYS AS (
                                    COALESCE(array_length(candidates, 1), 0)
                                  ) STORED,
  stipend             numeric     NOT NULL DEFAULT 0,
  total_amount        numeric     NOT NULL DEFAULT 0,
  remarks             text,
  document_urls       text[]      DEFAULT '{}',
  guider_signature    text,
  manager_signature   text,
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','approved','rejected')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- 2. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS odc_records_updated_at ON public.odc_records;
CREATE TRIGGER odc_records_updated_at
  BEFORE UPDATE ON public.odc_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Enable Row Level Security
ALTER TABLE public.odc_records ENABLE ROW LEVEL SECURITY;

-- 4. DEVELOPMENT policy — allows all operations (disable in production)
--    Comment this out and use the role-based policies below for production.
CREATE POLICY "dev_allow_all" ON public.odc_records
  FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------
-- PRODUCTION Role-Based Policies (uncomment when auth is set up)
-- ----------------------------------------------------------------
-- These use a custom JWT claim 'user_role' set via Supabase Auth hooks.

-- Managers: full read access
-- CREATE POLICY "managers_read_all" ON public.odc_records
--   FOR SELECT TO authenticated
--   USING (auth.jwt() ->> 'user_role' = 'manager');

-- Managers: can also approve/reject (update status)
-- CREATE POLICY "managers_update_status" ON public.odc_records
--   FOR UPDATE TO authenticated
--   USING  (auth.jwt() ->> 'user_role' = 'manager')
--   WITH CHECK (auth.jwt() ->> 'user_role' = 'manager');

-- Guiders: can insert new ODC records
-- CREATE POLICY "guiders_insert" ON public.odc_records
--   FOR INSERT TO authenticated
--   WITH CHECK (
--     auth.jwt() ->> 'user_role' IN ('guider', 'manager')
--   );

-- Guiders: can read their own submissions
-- CREATE POLICY "guiders_read_own" ON public.odc_records
--   FOR SELECT TO authenticated
--   USING (auth.jwt() ->> 'user_role' = 'guider');

-- 5. Storage bucket for ODC documents
--    NOTE: Storage buckets cannot be created via SQL.
--    Go to: Supabase Dashboard > Storage > New Bucket
--    Name: odc-documents | Public: YES | Allowed MIME types:
--    image/jpeg, image/png, application/pdf,
--    application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document
