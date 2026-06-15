
-- Trigger function to auto-update restaurant_profiles rating stats
CREATE OR REPLACE FUNCTION public.update_restaurant_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_avg numeric;
  v_count integer;
BEGIN
  -- Determine which user_id to recalculate for
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.rated_user_id;
  ELSE
    v_user_id := NEW.rated_user_id;
  END IF;

  -- Only process restaurant context ratings
  IF TG_OP = 'DELETE' AND OLD.rating_context IS DISTINCT FROM 'restaurant' THEN
    RETURN OLD;
  END IF;
  IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.rating_context IS DISTINCT FROM 'restaurant' THEN
    RETURN NEW;
  END IF;

  -- Recalculate stats
  SELECT COALESCE(AVG(rating), 0), COUNT(*)
  INTO v_avg, v_count
  FROM public.user_ratings
  WHERE rated_user_id = v_user_id
    AND rating_context = 'restaurant';

  -- Update restaurant_profiles
  UPDATE public.restaurant_profiles
  SET rating_average = ROUND(v_avg::numeric, 1),
      rating_count = v_count
  WHERE user_id = v_user_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_restaurant_rating_stats ON public.user_ratings;
CREATE TRIGGER trg_update_restaurant_rating_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.user_ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_restaurant_rating_stats();
