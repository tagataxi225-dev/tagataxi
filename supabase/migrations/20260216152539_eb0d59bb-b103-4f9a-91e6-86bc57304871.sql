
-- Ajout de colonnes pour la gestion optimale des véhicules partenaires
ALTER TABLE public.partner_taxi_vehicles 
  ADD COLUMN IF NOT EXISTS ownership_type TEXT NOT NULL DEFAULT 'partner' 
    CHECK (ownership_type IN ('partner', 'driver', 'third_party')),
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS owner_phone TEXT,
  ADD COLUMN IF NOT EXISTS chassis_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_expiry DATE,
  ADD COLUMN IF NOT EXISTS inspection_expiry DATE,
  ADD COLUMN IF NOT EXISTS document_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID;

-- Index pour les recherches admin par statut de modération
CREATE INDEX IF NOT EXISTS idx_partner_taxi_vehicles_moderation 
  ON public.partner_taxi_vehicles (moderation_status, created_at DESC);

-- Index pour les recherches par propriétaire
CREATE INDEX IF NOT EXISTS idx_partner_taxi_vehicles_ownership 
  ON public.partner_taxi_vehicles (ownership_type);
