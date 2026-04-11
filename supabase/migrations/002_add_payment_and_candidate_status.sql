-- ================================================================
-- ODC Management System — Migration 002
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- Adds payment status and individual candidate statuses
-- ================================================================

DO $$
DECLARE
    col_type text;
BEGIN
    SELECT data_type INTO col_type
    FROM information_schema.columns 
    WHERE table_name = 'odc_records' AND column_name = 'candidates';

    -- 1. Ensure payment_status exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'odc_records' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE public.odc_records ADD COLUMN payment_status text DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'received_from_company', 'received_from_event_head'));
    END IF;

    -- 2. Drop the generated column for a moment if it exists
    ALTER TABLE public.odc_records DROP COLUMN IF EXISTS candidate_count;

    IF col_type = 'ARRAY' THEN
        -- If it's still the old text array
        ALTER TABLE public.odc_records ADD COLUMN new_candidates jsonb DEFAULT '[]'::jsonb;
        
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

        UPDATE public.odc_records
        SET new_candidates = '[]'::jsonb
        WHERE candidates IS NULL OR array_length(candidates, 1) = 0;

        ALTER TABLE public.odc_records DROP COLUMN candidates;
        ALTER TABLE public.odc_records RENAME COLUMN new_candidates TO candidates;

    ELSIF col_type = 'jsonb' THEN
        -- If an earlier migration already turned it into jsonb, update the object shapes inside
        UPDATE public.odc_records
        SET candidates = (
          SELECT COALESCE(
            jsonb_agg(
                CASE 
                  WHEN jsonb_typeof(elem) = 'string' THEN 
                    jsonb_build_object('name', elem#>>'{}', 'shift_status', 'pending', 'payment_status', 'unpaid')
                  WHEN jsonb_typeof(elem) = 'object' THEN
                    jsonb_build_object(
                      'name', COALESCE(elem->>'name', 'Unknown'), 
                      'shift_status', COALESCE(elem->>'shift_status', elem->>'status', 'pending'), 
                      'payment_status', COALESCE(elem->>'payment_status', 'unpaid')
                    )
                  ELSE elem
                END
            ), 
            '[]'::jsonb
          )
          FROM jsonb_array_elements(candidates) AS elem
        )
        WHERE jsonb_typeof(candidates) = 'array';
    END IF;

    -- 3. Recreate generated column
    ALTER TABLE public.odc_records 
    ADD COLUMN candidate_count int4 
    GENERATED ALWAYS AS (
      COALESCE(jsonb_array_length(candidates), 0)
    ) STORED;

END $$;
