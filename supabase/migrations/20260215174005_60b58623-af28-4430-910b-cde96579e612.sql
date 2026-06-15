
-- Add last_reset_date column to lottery_user_limits for daily reset tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lottery_user_limits' AND column_name = 'last_reset_date'
  ) THEN
    ALTER TABLE public.lottery_user_limits ADD COLUMN last_reset_date DATE DEFAULT CURRENT_DATE;
  END IF;
END $$;

-- Create function to reset daily lottery limits
CREATE OR REPLACE FUNCTION public.reset_daily_lottery_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.lottery_user_limits
  SET cards_earned_today = 0,
      last_reset_date = CURRENT_DATE
  WHERE last_reset_date < CURRENT_DATE OR last_reset_date IS NULL;
END;
$$;
