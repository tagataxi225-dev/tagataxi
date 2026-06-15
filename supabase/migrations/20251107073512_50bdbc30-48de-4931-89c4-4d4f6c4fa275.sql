-- ✅ PHASE 1: Fonction RPC pour récupérer le service_type d'un chauffeur
-- Cette fonction est utilisée par useDriverServiceType et les edge functions de dispatch

CREATE OR REPLACE FUNCTION public.get_driver_service_type(driver_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_service_type TEXT;
BEGIN
    -- Récupérer le service_type depuis la table chauffeurs
    SELECT service_type INTO v_service_type
    FROM public.chauffeurs
    WHERE user_id = driver_user_id
    LIMIT 1;
    
    -- Retourner le service_type ou NULL si non trouvé
    RETURN v_service_type;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne fail pas
        RAISE WARNING 'Error in get_driver_service_type: %', SQLERRM;
        RETURN NULL;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.get_driver_service_type(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_driver_service_type(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_driver_service_type(UUID) TO service_role;

-- Commentaire pour documentation
COMMENT ON FUNCTION public.get_driver_service_type(UUID) IS 
'Retourne le service_type (taxi/delivery) d''un chauffeur depuis la table chauffeurs. Utilisé pour router correctement les commandes et afficher l''interface appropriée.';