-- Supprimer la fonction RPC défectueuse qui ne peut pas fonctionner
DROP FUNCTION IF EXISTS public.register_partner_with_metadata(text, text, text, text, text, text[], text, text, text);