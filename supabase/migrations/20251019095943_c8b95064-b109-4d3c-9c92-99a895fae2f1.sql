-- Ajouter le rôle vendeur à l'utilisateur actuel
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES ('c9ee2b59-2c9b-4bf5-833d-3473cc1aba71', 'vendor', true)
ON CONFLICT (user_id, role) 
DO UPDATE SET is_active = true;

-- Créer également un profil vendeur de base avec les bonnes colonnes
INSERT INTO public.vendor_profiles (
  user_id,
  shop_name,
  shop_description
)
VALUES (
  'c9ee2b59-2c9b-4bf5-833d-3473cc1aba71',
  'Ma Boutique',
  'Bienvenue dans ma boutique Kwenda Market'
)
ON CONFLICT (user_id) DO NOTHING;