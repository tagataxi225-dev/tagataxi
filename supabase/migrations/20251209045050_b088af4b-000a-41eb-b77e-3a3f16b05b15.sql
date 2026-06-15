-- Ajouter les colonnes pour le système d'acompte
ALTER TABLE rental_bookings 
ADD COLUMN IF NOT EXISTS deposit_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deposit_percentage INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS remaining_amount NUMERIC DEFAULT 0;

-- Mettre à jour les réservations existantes pour calculer le montant d'acompte
UPDATE rental_bookings 
SET 
  deposit_amount = COALESCE(total_amount, 0) * 0.30,
  remaining_amount = COALESCE(total_amount, 0) * 0.70
WHERE deposit_amount = 0 OR deposit_amount IS NULL;

-- Index pour les requêtes sur les acomptes non payés
CREATE INDEX IF NOT EXISTS idx_rental_bookings_deposit_pending 
ON rental_bookings (deposit_paid, status) 
WHERE deposit_paid = FALSE AND status IN ('approved_by_partner', 'pending');