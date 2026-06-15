-- PHASE 6: Ajouter verification_level aux partenaires pour auto-modération

-- Ajouter colonne verification_level à la table partenaires
ALTER TABLE partenaires 
ADD COLUMN IF NOT EXISTS verification_level TEXT DEFAULT 'basic' CHECK (verification_level IN ('basic', 'verified', 'premium')),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_partner_verification ON partenaires(verification_level);

-- Commentaires pour documentation
COMMENT ON COLUMN partenaires.verification_level IS 'Niveau de vérification du partenaire: basic (défaut), verified (vérifié manuellement), premium (partenaire de confiance)';
COMMENT ON COLUMN partenaires.verified_at IS 'Date de vérification du partenaire';
COMMENT ON COLUMN partenaires.verified_by IS 'ID de l''admin qui a vérifié le partenaire';

-- Fonction trigger pour auto-approbation des véhicules de partenaires vérifiés
CREATE OR REPLACE FUNCTION auto_approve_verified_partner_vehicles()
RETURNS TRIGGER AS $$
DECLARE
  partner_verification_level TEXT;
BEGIN
  -- Récupérer le niveau de vérification du partenaire
  SELECT verification_level INTO partner_verification_level
  FROM partenaires
  WHERE id = NEW.partner_id;

  -- Si partenaire vérifié ou premium, auto-approuver le véhicule
  IF partner_verification_level IN ('verified', 'premium') THEN
    NEW.moderation_status := 'approved';
    NEW.is_active := true;
    NEW.moderated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur rental_vehicles
DROP TRIGGER IF EXISTS auto_approve_verified_partner_vehicles_trigger ON rental_vehicles;
CREATE TRIGGER auto_approve_verified_partner_vehicles_trigger
BEFORE INSERT ON rental_vehicles
FOR EACH ROW
EXECUTE FUNCTION auto_approve_verified_partner_vehicles();

-- Log de la migration
INSERT INTO activity_logs (activity_type, description, metadata)
VALUES (
  'system_migration',
  'Ajout du système de vérification partenaires et auto-modération',
  '{"migration": "partner_verification_system", "features": ["verification_level", "auto_approval"]}'
);