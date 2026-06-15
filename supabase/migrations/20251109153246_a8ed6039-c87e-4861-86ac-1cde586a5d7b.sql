-- Phase 1: Rendre les contacts obligatoires

-- 1. Nettoyer les commandes existantes avec contacts NULL
UPDATE delivery_orders 
SET 
  sender_phone = '+243000000000',
  recipient_phone = '+243000000000',
  sender_name = COALESCE(sender_name, 'Expéditeur inconnu'),
  recipient_name = COALESCE(recipient_name, 'Destinataire inconnu')
WHERE sender_phone IS NULL OR recipient_phone IS NULL;

-- 2. Rendre les colonnes NOT NULL
ALTER TABLE delivery_orders 
  ALTER COLUMN sender_phone SET NOT NULL,
  ALTER COLUMN recipient_phone SET NOT NULL,
  ALTER COLUMN sender_name SET NOT NULL,
  ALTER COLUMN recipient_name SET NOT NULL;

-- 3. Ajouter une contrainte CHECK pour format téléphone et nom
ALTER TABLE delivery_orders
ADD CONSTRAINT valid_phone_format CHECK (
  sender_phone ~ '^\+?[0-9]{9,15}$' AND
  recipient_phone ~ '^\+?[0-9]{9,15}$' AND
  LENGTH(sender_name) >= 2 AND
  LENGTH(recipient_name) >= 2
);

-- 4. Ajouter un index pour performance
CREATE INDEX IF NOT EXISTS idx_delivery_orders_phones 
ON delivery_orders(sender_phone, recipient_phone);

-- 5. Commentaires pour documentation
COMMENT ON COLUMN delivery_orders.sender_phone IS 'Numéro de téléphone expéditeur (obligatoire, format: +243XXXXXXXXX)';
COMMENT ON COLUMN delivery_orders.recipient_phone IS 'Numéro de téléphone destinataire (obligatoire, format: +243XXXXXXXXX)';
COMMENT ON COLUMN delivery_orders.sender_name IS 'Nom de l''expéditeur (obligatoire, minimum 2 caractères)';
COMMENT ON COLUMN delivery_orders.recipient_name IS 'Nom du destinataire (obligatoire, minimum 2 caractères)';