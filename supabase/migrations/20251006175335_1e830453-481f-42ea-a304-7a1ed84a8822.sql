-- Migration: Correction des contraintes de validation des numéros de téléphone pour delivery_orders

-- Étape 1: Supprimer les anciennes contraintes trop strictes
ALTER TABLE public.delivery_orders 
DROP CONSTRAINT IF EXISTS valid_recipient_phone;

ALTER TABLE public.delivery_orders 
DROP CONSTRAINT IF EXISTS valid_sender_phone;

-- Étape 2: Créer des nouvelles contraintes plus flexibles
-- Format accepté: +243878754545 ou 243878754545 ou 0878754545 (9 à 15 chiffres)
ALTER TABLE public.delivery_orders 
ADD CONSTRAINT valid_recipient_phone 
CHECK (
  recipient_phone IS NULL OR 
  recipient_phone ~ '^\+?[0-9]{9,15}$'
);

ALTER TABLE public.delivery_orders 
ADD CONSTRAINT valid_sender_phone 
CHECK (
  sender_phone IS NULL OR 
  sender_phone ~ '^\+?[0-9]{9,15}$'
);

-- Étape 3: Nettoyer les numéros existants (enlever espaces et caractères spéciaux)
UPDATE public.delivery_orders
SET 
  recipient_phone = regexp_replace(recipient_phone, '[^0-9+]', '', 'g'),
  sender_phone = regexp_replace(sender_phone, '[^0-9+]', '', 'g')
WHERE 
  recipient_phone IS NOT NULL 
  OR sender_phone IS NOT NULL;