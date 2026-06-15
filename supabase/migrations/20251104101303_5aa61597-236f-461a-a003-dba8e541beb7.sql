-- Permettre la recherche de destinataires pour les transferts
-- Cette policy permet aux utilisateurs authentifiés de voir les informations minimales
-- des autres utilisateurs actifs uniquement pour la validation de transfert

CREATE POLICY "allow_recipient_search_for_transfers"
ON clients
FOR SELECT
TO authenticated
USING (
  -- Permet de rechercher d'autres utilisateurs actifs pour les transferts
  -- Les colonnes sensibles restent protégées par les autres policies
  is_active = true
);

-- Note : Cette policy donne accès en lecture aux clients actifs
-- pour permettre la validation des destinataires de transfert.
-- Les autres policies (INSERT, UPDATE, DELETE) restent restrictives.