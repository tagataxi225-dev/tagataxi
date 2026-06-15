-- Fix lottery_wins reward_type constraint to include 'nothing' for losing cards
ALTER TABLE lottery_wins DROP CONSTRAINT IF EXISTS lottery_wins_reward_type_check;

ALTER TABLE lottery_wins ADD CONSTRAINT lottery_wins_reward_type_check 
CHECK (reward_type = ANY (ARRAY[
  'cash'::text, 
  'points'::text, 
  'physical_gift'::text, 
  'voucher'::text, 
  'xp_points'::text, 
  'boost_2x'::text, 
  'discount_5'::text, 
  'internal_credit'::text,
  'nothing'::text
]));