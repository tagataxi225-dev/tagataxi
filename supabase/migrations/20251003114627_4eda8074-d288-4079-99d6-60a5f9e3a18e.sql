-- Activer la réplication pour la synchronisation temps réel de pricing_rules
ALTER TABLE public.pricing_rules REPLICA IDENTITY FULL;

-- Note: Les données de pricing_rules sont déjà gérées par l'admin via AdminPricingManager
-- Cette migration active simplement le realtime sync