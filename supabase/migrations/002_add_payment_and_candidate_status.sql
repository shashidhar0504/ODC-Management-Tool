-- ================================================================
-- ODC Management System — Migration 002
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Adds payment status and individual candidate statuses
-- ================================================================

-- 1. Add payment status column
ALTER TABLE public.odc_records 
ADD COLUMN IF NOT EXISTS payment_status text 
DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'received_from_company', 'received_from_event_head'));

-- 2. Modify candidates array to JSONB for individual tracking
-- Drop the generated column that depends on candidates
ALTER TABLE public.odc_records DROP COLUMN IF EXISTS candidate_count;

-- Create a temporary column for the new json data
ALTER TABLE public.odc_records ADD COLUMN IF NOT EXISTS new_candidates jsonb DEFAULT '[]'::jsonb;

-- Convert existing text[] candidates to the new jsonb format
-- e.g. text 'John' -> jsonb '{"name": "John", "status": "pending"}'
UPDATE public.odc_records
SET new_candidates = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('name', c, 'shift_status', 'pending', 'payment_status', 'unpaid')
    ), 
    '[]'::jsonb
  )
  FROM unnest(candidates) AS c
)
WHERE candidates IS NOT NULL;

-- Make sure empty arrays or nulls are properly converted to empty json arrays
UPDATE public.odc_records
SET new_candidates = '[]'::jsonb
WHERE candidates IS NULL OR array_length(candidates, 1) = 0;

-- Drop the old column and rename the new one
ALTER TABLE public.odc_records DROP COLUMN candidates;
ALTER TABLE public.odc_records RENAME COLUMN new_candidates TO candidates;

-- Recreate the candidate_count generated column using jsonb_array_length
-- Note: it is safe to use jsonb_array_length because our jsonb will always be an array
ALTER TABLE public.odc_records 
ADD COLUMN candidate_count int4 
GENERATED ALWAYS AS (
  COALESCE(jsonb_array_length(candidates), 0)
) STORED;
