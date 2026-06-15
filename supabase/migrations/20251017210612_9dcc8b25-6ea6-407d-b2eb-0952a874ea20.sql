-- Corriger les probabilités des types de prix de loterie
-- Les probabilités doivent suivre le système de rareté standard

UPDATE lottery_prize_types 
SET probability = CASE rarity
  WHEN 'common' THEN 0.70
  WHEN 'rare' THEN 0.20
  WHEN 'epic' THEN 0.08
  WHEN 'legendary' THEN 0.02
  ELSE 0.70
END
WHERE is_active = true;

-- Vérifier les résultats
COMMENT ON TABLE lottery_prize_types IS 'Probabilités mises à jour: Common 70%, Rare 20%, Epic 8%, Legendary 2%';