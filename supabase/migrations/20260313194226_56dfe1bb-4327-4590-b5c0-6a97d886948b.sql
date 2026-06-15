-- Permettre aux passagers authentifiés de voir les chauffeurs en ligne
CREATE POLICY "authenticated_read_online_drivers"
ON public.driver_locations
FOR SELECT
TO authenticated
USING (is_online = true);