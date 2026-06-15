-- Phase 1: Correction des politiques RLS pour user_verification
-- Ajouter les politiques manquantes pour permettre aux utilisateurs d'accéder à leurs propres données de vérification

-- Permettre aux utilisateurs de voir leurs propres données de vérification
CREATE POLICY "Users can view their own verification data" 
ON public.user_verification 
FOR SELECT 
USING (auth.uid() = user_id);

-- Permettre aux utilisateurs de créer leurs propres enregistrements de vérification
CREATE POLICY "Users can create their own verification record" 
ON public.user_verification 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Permettre aux utilisateurs de mettre à jour leurs propres données de vérification
CREATE POLICY "Users can update their own verification data" 
ON public.user_verification 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Permettre aux admins de gérer toutes les vérifications
CREATE POLICY "Admins can manage all verification data" 
ON public.user_verification 
FOR ALL 
USING (is_current_user_admin());