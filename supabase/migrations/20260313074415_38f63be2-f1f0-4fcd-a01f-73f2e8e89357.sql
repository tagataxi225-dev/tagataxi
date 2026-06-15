-- Fix: Remove policies exposing partner PII to unauthenticated users
DROP POLICY IF EXISTS "partenaires_public_read_safe" ON public.partenaires;
DROP POLICY IF EXISTS "admins_view_partenaires" ON public.partenaires;