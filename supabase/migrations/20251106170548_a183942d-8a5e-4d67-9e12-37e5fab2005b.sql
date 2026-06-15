-- ✅ MIGRATION: Garantir cohérence entre user_roles et vendor_profiles
-- Empêche les erreurs FK lors de la publication de produits

-- Fonction pour créer automatiquement un profil vendeur quand le rôle est attribué
CREATE OR REPLACE FUNCTION public.create_vendor_profile_on_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si le rôle 'vendor' est ajouté et actif
  IF NEW.role = 'vendor' AND NEW.is_active = true THEN
    -- Vérifier si le profil vendeur existe déjà
    IF NOT EXISTS (
      SELECT 1 FROM public.vendor_profiles WHERE user_id = NEW.user_id
    ) THEN
      -- Créer un profil vendeur minimal
      INSERT INTO public.vendor_profiles (
        user_id,
        shop_name,
        created_at
      ) VALUES (
        NEW.user_id,
        'Ma Boutique', -- Nom par défaut, l'utilisateur pourra le modifier
        now()
      );
      
      RAISE NOTICE 'Profil vendeur créé automatiquement pour user_id: %', NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur user_roles
DROP TRIGGER IF EXISTS create_vendor_profile_trigger ON public.user_roles;
CREATE TRIGGER create_vendor_profile_trigger
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.create_vendor_profile_on_role();

-- Corriger les vendeurs existants qui n'ont pas de profil (backfill)
INSERT INTO public.vendor_profiles (user_id, shop_name, created_at)
SELECT 
  ur.user_id,
  'Ma Boutique',
  now()
FROM public.user_roles ur
WHERE ur.role = 'vendor' 
AND ur.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM public.vendor_profiles vp WHERE vp.user_id = ur.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- Créer un index pour améliorer les performances des vérifications
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id 
ON public.vendor_profiles(user_id);