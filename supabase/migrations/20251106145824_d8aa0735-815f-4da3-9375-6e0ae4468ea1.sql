-- Ajouter colonnes de contact manquantes à partenaires
ALTER TABLE partenaires 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Index pour recherche par email
CREATE INDEX IF NOT EXISTS idx_partenaires_email ON partenaires(email);

-- Commentaires
COMMENT ON COLUMN partenaires.phone IS 'Numéro de téléphone de contact du partenaire';
COMMENT ON COLUMN partenaires.email IS 'Email de contact du partenaire';
COMMENT ON COLUMN partenaires.website IS 'Site web du partenaire';
