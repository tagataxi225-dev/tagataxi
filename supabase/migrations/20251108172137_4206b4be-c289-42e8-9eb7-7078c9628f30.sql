-- Fix vendor_stats_cache: Convert from MATERIALIZED VIEW to regular TABLE
-- This allows INSERT/UPDATE operations needed by vendor subscription triggers

-- Step 1: Backup existing data if view exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'vendor_stats_cache'
  ) THEN
    CREATE TEMP TABLE vendor_stats_backup AS 
    SELECT * FROM vendor_stats_cache;
  END IF;
END $$;

-- Step 2: Drop materialized view and dependencies
DROP MATERIALIZED VIEW IF EXISTS vendor_stats_cache CASCADE;

-- Step 3: Create regular TABLE with same structure
CREATE TABLE IF NOT EXISTS public.vendor_stats_cache (
  vendor_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_products INTEGER DEFAULT 0 NOT NULL,
  total_sales INTEGER DEFAULT 0 NOT NULL,
  avg_rating NUMERIC(3,2) DEFAULT 0 NOT NULL CHECK (avg_rating >= 0 AND avg_rating <= 5),
  total_reviews INTEGER DEFAULT 0 NOT NULL,
  follower_count INTEGER DEFAULT 0 NOT NULL,
  last_product_date TIMESTAMPTZ,
  last_sale_date TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 4: Restore backed up data
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'pg_temp' AND tablename LIKE 'vendor_stats_backup%') THEN
    INSERT INTO public.vendor_stats_cache 
    SELECT * FROM vendor_stats_backup
    ON CONFLICT (vendor_id) DO NOTHING;
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_vendor_stats_vendor_id 
ON public.vendor_stats_cache(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_stats_last_updated 
ON public.vendor_stats_cache(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_stats_total_sales 
ON public.vendor_stats_cache(total_sales DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_stats_avg_rating 
ON public.vendor_stats_cache(avg_rating DESC);

-- Step 6: Enable Row Level Security
ALTER TABLE public.vendor_stats_cache ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies
CREATE POLICY "Vendors can view their own stats"
ON public.vendor_stats_cache
FOR SELECT
TO authenticated
USING (auth.uid() = vendor_id);

CREATE POLICY "Public can view all vendor stats"
ON public.vendor_stats_cache
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "System can manage vendor stats"
ON public.vendor_stats_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 8: Grant permissions
GRANT SELECT ON public.vendor_stats_cache TO authenticated;
GRANT SELECT ON public.vendor_stats_cache TO anon;
GRANT ALL ON public.vendor_stats_cache TO service_role;

-- Step 9: Add helpful comment
COMMENT ON TABLE public.vendor_stats_cache IS 
'Cache table for vendor statistics. Updated by triggers on vendor_subscriptions, marketplace_products, marketplace_orders, etc. Converted from materialized view to support INSERT/UPDATE operations.';