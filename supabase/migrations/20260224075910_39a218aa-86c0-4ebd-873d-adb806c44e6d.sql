
-- 1. Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Clients can rate completed services" ON public.user_ratings;

-- 2. Recreate INSERT policy with restaurant support
CREATE POLICY "Clients can rate completed services"
ON public.user_ratings
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = rater_user_id
  AND (
    -- Existing: transport/delivery/marketplace ratings linked to completed orders
    booking_id IS NOT NULL
    OR delivery_id IS NOT NULL
    OR marketplace_order_id IS NOT NULL
    -- New: restaurant ratings (no order required)
    OR (
      rating_context = 'restaurant'
      AND booking_id IS NULL
      AND delivery_id IS NULL
      AND marketplace_order_id IS NULL
    )
  )
);

-- 3. Add UPDATE policy (missing entirely)
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.user_ratings;
CREATE POLICY "Users can update their own ratings"
ON public.user_ratings
FOR UPDATE
TO authenticated
USING (auth.uid() = rater_user_id)
WITH CHECK (auth.uid() = rater_user_id);
