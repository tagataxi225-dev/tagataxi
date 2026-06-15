-- Nettoyer les policies dupliquées pour user_wallets
DROP POLICY IF EXISTS "wallet_self_access" ON public.user_wallets;

-- La policy "user_wallets_own_only" suffit déjà pour tous les accès utilisateur

-- Ajouter des logs pour débugger les erreurs de wallet
CREATE OR REPLACE FUNCTION public.log_wallet_error(
  p_user_id uuid,
  p_error_type text,
  p_error_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id,
    activity_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'wallet_error',
    p_error_type || ': ' || p_error_message,
    p_metadata || jsonb_build_object(
      'error_type', p_error_type,
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Silent failure for logging
  NULL;
END;
$$;