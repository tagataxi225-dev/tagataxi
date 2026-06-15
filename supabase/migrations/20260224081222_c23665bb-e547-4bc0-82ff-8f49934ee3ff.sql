-- Recalculate restaurant rating stats for all existing ratings
UPDATE public.restaurant_profiles rp
SET rating_average = sub.avg_rating,
    rating_count = sub.cnt
FROM (
  SELECT rated_user_id,
         ROUND(AVG(rating)::numeric, 1) as avg_rating,
         COUNT(*) as cnt
  FROM public.user_ratings
  WHERE rating_context = 'restaurant'
  GROUP BY rated_user_id
) sub
WHERE rp.user_id = sub.rated_user_id;