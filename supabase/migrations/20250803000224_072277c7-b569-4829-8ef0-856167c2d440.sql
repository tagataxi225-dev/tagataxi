-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'weekly', 'monthly', 'special')),
  target_value INTEGER NOT NULL,
  target_metric TEXT NOT NULL CHECK (target_metric IN ('rides_count', 'rating_average', 'earnings_amount', 'hours_worked', 'early_morning_rides')),
  reward_type TEXT NOT NULL CHECK (reward_type IN ('wallet_credit', 'badge', 'bonus_multiplier')),
  reward_value NUMERIC NOT NULL DEFAULT 0,
  reward_currency TEXT DEFAULT 'CDF',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver_challenges table for tracking progress
CREATE TABLE public.driver_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(driver_id, challenge_id)
);

-- Create challenge_rewards table for reward history
CREATE TABLE public.challenge_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id),
  driver_challenge_id UUID NOT NULL REFERENCES public.driver_challenges(id),
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL,
  reward_currency TEXT DEFAULT 'CDF',
  wallet_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rewarded')),
  referred_user_type TEXT CHECK (referred_user_type IN ('client', 'chauffeur', 'partenaire')),
  completion_date TIMESTAMP WITH TIME ZONE,
  reward_given_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create referral_rewards table
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referral_id UUID NOT NULL REFERENCES public.referrals(id),
  tier_level TEXT NOT NULL CHECK (tier_level IN ('bronze', 'silver', 'gold', 'platinum')),
  reward_amount NUMERIC NOT NULL,
  reward_currency TEXT DEFAULT 'CDF',
  wallet_transaction_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Everyone can view active challenges" 
ON public.challenges 
FOR SELECT 
USING (is_active = true);

-- RLS Policies for driver_challenges
CREATE POLICY "Drivers can view their own challenges" 
ON public.driver_challenges 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own challenge progress" 
ON public.driver_challenges 
FOR UPDATE 
USING (auth.uid() = driver_id);

CREATE POLICY "System can insert driver challenges" 
ON public.driver_challenges 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for challenge_rewards
CREATE POLICY "Drivers can view their own rewards" 
ON public.challenge_rewards 
FOR SELECT 
USING (auth.uid() = driver_id);

CREATE POLICY "System can insert challenge rewards" 
ON public.challenge_rewards 
FOR INSERT 
WITH CHECK (true);

-- RLS Policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.referrals 
FOR SELECT 
USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Users can create referrals" 
ON public.referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "System can update referrals" 
ON public.referrals 
FOR UPDATE 
USING (true);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view their own referral rewards" 
ON public.referral_rewards 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referral rewards" 
ON public.referral_rewards 
FOR INSERT 
WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_challenges_updated_at
  BEFORE UPDATE ON public.driver_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default challenges
INSERT INTO public.challenges (title, description, challenge_type, target_value, target_metric, reward_type, reward_value, start_date, end_date) VALUES
('Champion du Jour', 'Complétez 5 courses en une journée', 'daily', 5, 'rides_count', 'wallet_credit', 2000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day'),
('Étoile de la Semaine', 'Maintenez une note moyenne de 4.5 étoiles', 'weekly', 45, 'rating_average', 'wallet_credit', 5000, DATE_TRUNC('week', NOW()), DATE_TRUNC('week', NOW()) + INTERVAL '1 week'),
('Conducteur du Mois', 'Réalisez 100 courses ce mois-ci', 'monthly', 100, 'rides_count', 'wallet_credit', 20000, DATE_TRUNC('month', NOW()), DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),
('Lève-tôt', 'Effectuez 3 courses avant 8h du matin', 'daily', 3, 'early_morning_rides', 'wallet_credit', 3000, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day');

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    -- Generate a 8-character alphanumeric code
    code := UPPER(substring(encode(gen_random_bytes(6), 'hex') from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_check FROM public.referrals WHERE referral_code = code;
    
    -- If code doesn't exist, exit loop
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;