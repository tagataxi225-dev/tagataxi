
-- Ajouter la colonne partner_type à la table partenaires
ALTER TABLE public.partenaires 
ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT NULL;

-- Migrer les données existantes : transport et rental_agency → 'auto'
UPDATE public.partenaires
SET partner_type = 'auto'
WHERE business_type IN ('transport', 'rental_agency', 'company')
  AND partner_type IS NULL;

-- Créer un index pour les requêtes fréquentes par type
CREATE INDEX IF NOT EXISTS idx_partenaires_partner_type 
ON public.partenaires(partner_type);

-- Commentaire de documentation
COMMENT ON COLUMN public.partenaires.partner_type IS 
  'Type de partenaire: delivery (Moto Flash, Flex, MaxiCharge) ou auto (Taxi, Location)';
