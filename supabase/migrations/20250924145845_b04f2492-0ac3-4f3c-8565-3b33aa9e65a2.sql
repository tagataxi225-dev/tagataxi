-- Ajout des champs de contact pour les livraisons
-- Ajouter les numéros de téléphone du destinataire et de l'expéditeur

ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS sender_phone text,
ADD COLUMN IF NOT EXISTS recipient_phone text,
ADD COLUMN IF NOT EXISTS recipient_name text,
ADD COLUMN IF NOT EXISTS sender_name text;

-- Ajouter des commentaires pour documentation
COMMENT ON COLUMN public.delivery_orders.sender_phone IS 'Numéro de téléphone de l''expéditeur';
COMMENT ON COLUMN public.delivery_orders.recipient_phone IS 'Numéro de téléphone du destinataire';
COMMENT ON COLUMN public.delivery_orders.recipient_name IS 'Nom du destinataire';
COMMENT ON COLUMN public.delivery_orders.sender_name IS 'Nom de l''expéditeur';

-- Ajouter une contrainte pour valider le format des numéros de téléphone
ALTER TABLE public.delivery_orders 
ADD CONSTRAINT valid_sender_phone 
CHECK (sender_phone IS NULL OR sender_phone ~ '^[\+]?[0-9\s\-\(\)]{9,15}$');

ALTER TABLE public.delivery_orders 
ADD CONSTRAINT valid_recipient_phone 
CHECK (recipient_phone IS NULL OR recipient_phone ~ '^[\+]?[0-9\s\-\(\)]{9,15}$');