-- Corriger la contrainte NOT NULL sur subscription_id dans rental_subscription_payments
ALTER TABLE public.rental_subscription_payments 
ALTER COLUMN subscription_id DROP NOT NULL;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_rental_subscription_payments_partner_id 
ON public.rental_subscription_payments(partner_id);

CREATE INDEX IF NOT EXISTS idx_rental_subscription_payments_transaction_id 
ON public.rental_subscription_payments(transaction_id);

-- Ajouter une fonction pour lier le paiement à l'abonnement après création
CREATE OR REPLACE FUNCTION public.link_payment_to_subscription(
  payment_id uuid,
  subscription_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.rental_subscription_payments 
  SET subscription_id = link_payment_to_subscription.subscription_id,
      updated_at = now()
  WHERE id = payment_id;
  
  RETURN FOUND;
END;
$$;