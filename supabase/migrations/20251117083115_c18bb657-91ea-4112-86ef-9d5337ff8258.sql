-- Ajouter la colonne metadata à payment_transactions pour stocker les informations Orange Money
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index pour recherches dans metadata
CREATE INDEX IF NOT EXISTS idx_payment_transactions_metadata 
ON payment_transactions USING gin(metadata);

-- Commentaire explicatif
COMMENT ON COLUMN payment_transactions.metadata IS 'Stocke les informations supplémentaires du paiement (tokens Orange Money, données du provider, etc.)';