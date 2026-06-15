-- Mettre à jour le constraint reward_type pour inclure les types Kwenda Gratta
ALTER TABLE public.lottery_wins DROP CONSTRAINT lottery_wins_reward_type_check;

ALTER TABLE public.lottery_wins ADD CONSTRAINT lottery_wins_reward_type_check 
CHECK (reward_type = ANY (ARRAY[
  'cash'::text, 
  'points'::text, 
  'physical_gift'::text, 
  'voucher'::text,
  'xp_points'::text,
  'boost_2x'::text,
  'discount_5'::text,
  'internal_credit'::text
]));