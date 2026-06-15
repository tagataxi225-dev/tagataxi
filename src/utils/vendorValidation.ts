/**
 * Validation utilities pour les IDs vendeurs
 * Empêche les erreurs de routing et améliore la sécurité
 */

/**
 * Valide qu'un ID vendeur est bien un UUID v4 valide
 * @param vendorId - ID à valider
 * @returns true si UUID valide, false sinon
 */
export const isValidVendorId = (vendorId: string | undefined): boolean => {
  if (!vendorId) return false;
  
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(vendorId);
};

/**
 * Valide et redirige vers marketplace si l'ID vendeur est invalide
 * @param vendorId - ID à valider
 * @param navigate - Fonction de navigation React Router
 * @returns true si valide, false si invalide (et redirection effectuée)
 */
export const validateVendorIdOrRedirect = (
  vendorId: string | undefined,
  navigate: (path: string) => void
): boolean => {
  if (!isValidVendorId(vendorId)) {
    console.error('[Security] Invalid vendor ID format:', vendorId);
    navigate('/marketplace');
    return false;
  }
  return true;
};
