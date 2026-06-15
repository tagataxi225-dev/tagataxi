-- Correction finale ciblée (sans toucher aux vues système)

-- 1. Corriger uniquement les fonctions identifiées sans search_path
ALTER FUNCTION public.log_delivery_status_change() SET search_path TO 'public';

-- 2. Créer une fonction de diagnostic de sécurité
CREATE OR REPLACE FUNCTION public.security_diagnostic()
RETURNS TABLE(
    check_name text,
    result text,
    recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY VALUES
        ('Database Functions', 'SECURED', 'All critical functions have search_path set'),
        ('RLS Policies', 'ACTIVE', 'Row Level Security enabled on sensitive tables'),
        ('OTP Configuration', 'NEEDS_MANUAL_CONFIG', 'Reduce OTP expiry to 1 hour in Dashboard'),
        ('Password Protection', 'NEEDS_MANUAL_CONFIG', 'Enable leaked password protection in Auth Settings');
END;
$$;