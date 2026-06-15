-- ============================================
-- MIGRATION: Système de catégories marketplace
-- ============================================

-- 1. Créer la table marketplace_categories
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  name_fr TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Activer RLS
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;

-- 3. Policies RLS
CREATE POLICY "marketplace_categories_public_read"
ON public.marketplace_categories FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "marketplace_categories_admin_manage"
ON public.marketplace_categories FOR ALL
TO authenticated
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

-- 4. Insérer les catégories initiales
INSERT INTO public.marketplace_categories (name, name_fr, slug, icon, sort_order) VALUES
  ('All', 'Tout', 'all', 'Apple', 0),
  ('Electronics', 'Électronique', 'electronics', 'Smartphone', 1),
  ('Fashion', 'Mode & Vêtements', 'fashion', 'Shirt', 2),
  ('Home', 'Maison & Jardin', 'home', 'Home', 3),
  ('Beauty', 'Beauté & Santé', 'beauty', 'Sparkles', 4),
  ('Sports', 'Sports & Loisirs', 'sports', 'Dumbbell', 5),
  ('Food', 'Alimentation', 'food', 'Apple', 6),
  ('Auto', 'Automobile', 'auto', 'Car', 7),
  ('Books', 'Livres & Éducation', 'books', 'Book', 8),
  ('Baby', 'Jouets & Bébé', 'baby', 'Baby', 9),
  ('Games', 'Jeux Vidéo', 'games', 'Gamepad2', 10)
ON CONFLICT (slug) DO NOTHING;

-- 5. Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_marketplace_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_marketplace_categories_updated_at
BEFORE UPDATE ON public.marketplace_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_marketplace_categories_updated_at();