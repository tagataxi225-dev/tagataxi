-- PHASE 1: Ajouter partner_id à driver_codes pour système commission 5%

-- Ajouter colonne partner_id avec foreign key
ALTER TABLE public.driver_codes 
ADD COLUMN partner_id UUID REFERENCES public.partenaires(id) ON DELETE SET NULL;

-- Ajouter index pour performance des jointures
CREATE INDEX idx_driver_codes_partner_id ON public.driver_codes(partner_id);

-- Ajouter index composite pour requêtes fréquentes
CREATE INDEX idx_driver_codes_driver_partner ON public.driver_codes(driver_id, partner_id);

-- Commentaire pour documentation
COMMENT ON COLUMN public.driver_codes.partner_id IS 'ID du partenaire qui a parrainé ce chauffeur (pour calcul commission 5% abonnements)';
