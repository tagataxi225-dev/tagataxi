-- ===== PHASE 1: Fix Storage Policies for partner-assets bucket =====
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view partner assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view partner assets" ON storage.objects;
DROP POLICY IF EXISTS "Partner assets public read" ON storage.objects;

-- Recreate with explicit anon access for public viewing
CREATE POLICY "Anyone can view partner assets public"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'partner-assets');

-- ===== PHASE 2: Add opening_hours column to partenaires =====
ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{
  "monday": {"open": "08:00", "close": "18:00", "is_closed": false},
  "tuesday": {"open": "08:00", "close": "18:00", "is_closed": false},
  "wednesday": {"open": "08:00", "close": "18:00", "is_closed": false},
  "thursday": {"open": "08:00", "close": "18:00", "is_closed": false},
  "friday": {"open": "08:00", "close": "18:00", "is_closed": false},
  "saturday": {"open": "09:00", "close": "14:00", "is_closed": false},
  "sunday": {"open": null, "close": null, "is_closed": true}
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.partenaires.opening_hours IS 'JSON structure for business opening hours per day of week';