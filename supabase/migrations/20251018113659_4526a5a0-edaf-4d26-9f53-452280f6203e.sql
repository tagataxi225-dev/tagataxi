-- ==========================================
-- ACTION 4 : Créer Policy Publique pour Véhicules Location
-- ==========================================
-- Permet aux clients authentifiés de voir les véhicules approuvés

-- Policy SELECT pour clients (véhicules approuvés uniquement)
CREATE POLICY "rental_vehicles_public_read_approved"
ON public.rental_vehicles
FOR SELECT
TO authenticated
USING (
  moderation_status = 'approved' 
  AND is_active = true 
  AND is_available = true
);

-- Policy pour que les partenaires voient LEURS véhicules (tous statuts)
CREATE POLICY "rental_vehicles_partner_own_vehicles"
ON public.rental_vehicles
FOR ALL
TO authenticated
USING (
  partner_id IN (
    SELECT id FROM public.partenaires WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  partner_id IN (
    SELECT id FROM public.partenaires WHERE user_id = auth.uid()
  )
);

-- Vérification : lister toutes les policies
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE tablename = 'rental_vehicles'
-- ORDER BY policyname;