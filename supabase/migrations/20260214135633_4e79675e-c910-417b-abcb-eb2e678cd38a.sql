ALTER TABLE referral_codes 
ADD COLUMN IF NOT EXISTS is_ambassador boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS ambassador_name text,
ADD COLUMN IF NOT EXISTS ambassador_note text;