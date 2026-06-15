-- PHASE 1: SÉCURITÉ CRITIQUE - Correction des vulnérabilités RLS
-- Toutes les tables publiques sont actuellement accessibles sans restrictions

-- 1. Sécuriser la table admins (CRITIQUE)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Politique pour que seuls les super admins peuvent voir tous les profils admin
CREATE POLICY "Super admins can view all admin profiles" ON public.admins
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins admin_check
    WHERE admin_check.user_id = auth.uid() 
    AND admin_check.admin_level = 'super_admin' 
    AND admin_check.is_active = true
  )
);

-- Politique pour que les admins peuvent voir leur propre profil
CREATE POLICY "Admins can view their own profile" ON public.admins
FOR SELECT USING (auth.uid() = user_id AND is_active = true);

-- Politique pour que les admins peuvent modifier leur propre profil
CREATE POLICY "Admins can update their own profile" ON public.admins
FOR UPDATE USING (auth.uid() = user_id AND is_active = true);

-- 2. Sécuriser la table clients (CRITIQUE)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Politique pour que les clients peuvent voir leur propre profil
CREATE POLICY "Clients can view their own profile" ON public.clients
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les clients peuvent modifier leur propre profil
CREATE POLICY "Clients can update their own profile" ON public.clients
FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour que les admins peuvent voir tous les clients
CREATE POLICY "Admins can view all clients" ON public.clients
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 3. Sécuriser la table chauffeurs (CRITIQUE)
ALTER TABLE public.chauffeurs ENABLE ROW LEVEL SECURITY;

-- Politique pour que les chauffeurs peuvent voir leur propre profil
CREATE POLICY "Chauffeurs can view their own profile" ON public.chauffeurs
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les chauffeurs peuvent modifier leur propre profil
CREATE POLICY "Chauffeurs can update their own profile" ON public.chauffeurs
FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour que les admins peuvent voir tous les chauffeurs
CREATE POLICY "Admins can view all chauffeurs" ON public.chauffeurs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- Politique pour que les clients peuvent voir seulement les chauffeurs vérifiés et actifs
CREATE POLICY "Clients can view verified active chauffeurs" ON public.chauffeurs
FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- 4. Sécuriser la table partenaires (CRITIQUE)
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;

-- Politique pour que les partenaires peuvent voir leur propre profil
CREATE POLICY "Partenaires can view their own profile" ON public.partenaires
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les partenaires peuvent modifier leur propre profil
CREATE POLICY "Partenaires can update their own profile" ON public.partenaires
FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour que les admins peuvent voir tous les partenaires
CREATE POLICY "Admins can view all partenaires" ON public.partenaires
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid() AND is_active = true
  )
);

-- 5. Sécuriser la table profiles (AVERTISSEMENT)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour que les profils publics sont visibles par tous les utilisateurs authentifiés
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles
FOR SELECT USING (is_public = true AND auth.uid() IS NOT NULL);

-- 6. Sécuriser la table payment_methods (CRITIQUE)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs peuvent voir leurs propres méthodes de paiement
CREATE POLICY "Users can view their own payment methods" ON public.payment_methods
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs peuvent modifier leurs propres méthodes de paiement
CREATE POLICY "Users can manage their own payment methods" ON public.payment_methods
FOR ALL USING (auth.uid() = user_id);

-- 7. Sécuriser la table user_places (CRITIQUE - données de localisation)
ALTER TABLE public.user_places ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs peuvent voir leurs propres lieux
CREATE POLICY "Users can view their own places" ON public.user_places
FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs peuvent gérer leurs propres lieux
CREATE POLICY "Users can manage their own places" ON public.user_places
FOR ALL USING (auth.uid() = user_id);

-- 8. Sécuriser la table driver_locations (CRITIQUE - localisation en temps réel)
-- Cette table existe déjà avec RLS mais vérifions les politiques

-- Politique restrictive pour l'accès aux localisations des chauffeurs
CREATE POLICY "Restricted driver location access" ON public.driver_locations
FOR SELECT USING (
  -- Le chauffeur peut voir sa propre localisation
  auth.uid() = driver_id 
  OR 
  -- Les admins peuvent voir toutes les localisations
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR
  -- Utilisation via les fonctions système pour le matching seulement
  current_setting('role') = 'service_role'
);