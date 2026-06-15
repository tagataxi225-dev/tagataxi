/**
 * Utility functions for validation
 */

/**
 * Validates if a string is a valid UUID v4
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Validates and sanitizes an order ID
 */
export const validateOrderId = (orderId: string): { isValid: boolean; error?: string } => {
  if (!orderId) {
    return { isValid: false, error: 'ID de commande manquant' };
  }

  if (!isValidUUID(orderId)) {
    return { isValid: false, error: 'Format d\'ID de commande invalide' };
  }

  return { isValid: true };
};