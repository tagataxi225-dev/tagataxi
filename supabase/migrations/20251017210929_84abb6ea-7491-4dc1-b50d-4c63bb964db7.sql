-- Correction URGENTE des probabilités de la tombola
-- Actuellement TOUTES à 0.70 (70%) ce qui rend le système déséquilibré

-- Mettre à jour les probabilités selon la rareté RÉELLE basée sur la valeur des prix
UPDATE lottery_prize_types SET probability = 0.70, rarity = 'common' 
WHERE value <= 10000 AND is_active = true;

UPDATE lottery_prize_types SET probability = 0.20, rarity = 'rare'
WHERE value > 10000 AND value <= 50000 AND is_active = true;

UPDATE lottery_prize_types SET probability = 0.08, rarity = 'epic'
WHERE value > 50000 AND value <= 100000 AND is_active = true;

UPDATE lottery_prize_types SET probability = 0.02, rarity = 'legendary'
WHERE value > 100000 AND is_active = true;

-- Cas spéciaux : Services et bonus tickets
UPDATE lottery_prize_types SET probability = 0.20, rarity = 'rare'
WHERE category = 'service' AND name IN ('Course Gratuite', 'Livraison Gratuite') AND is_active = true;

UPDATE lottery_prize_types SET probability = 0.08, rarity = 'epic'
WHERE category = 'service' AND name = 'Bonus Tickets' AND is_active = true;

-- Vérification : afficher la distribution
SELECT rarity, COUNT(*) as count, AVG(probability) as avg_prob
FROM lottery_prize_types
WHERE is_active = true
GROUP BY rarity
ORDER BY avg_prob DESC;