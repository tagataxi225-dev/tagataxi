/**
 * 🔒 LOGGER SÉCURISÉ POUR PRODUCTION
 * 
 * Wrapper autour de console.log qui désactive automatiquement
 * les logs en production pour éviter l'exposition de données sensibles
 */

const IS_PRODUCTION = import.meta.env.PROD;
const IS_DEV = import.meta.env.DEV;

/**
 * Log sécurisé - ne log QUE en développement
 */
export const secureLog = {
  /**
   * Log standard (équivalent console.log)
   */
  log: (...args: any[]): void => {
    if (IS_DEV) {
      console.log(...args);
    }
  },

  /**
   * Log d'erreur (SECURE: Only in development, masked in production)
   */
  error: (...args: any[]): void => {
    if (IS_DEV) {
      console.error(...args);
    }
    // In production, errors should be sent to secure logging service
    // Not logged to console to prevent data leakage
  },

  /**
   * Log d'avertissement
   */
  warn: (...args: any[]): void => {
    if (IS_DEV) {
      console.warn(...args);
    }
  },

  /**
   * Log d'information
   */
  info: (...args: any[]): void => {
    if (IS_DEV) {
      console.info(...args);
    }
  },

  /**
   * Log de debug (uniquement dev)
   */
  debug: (...args: any[]): void => {
    if (IS_DEV) {
      console.debug(...args);
    }
  },

  /**
   * Log de données sensibles (JAMAIS en production)
   * Masque automatiquement les données sensibles
   */
  sensitive: (label: string, data: any): void => {
    if (IS_DEV) {
      console.log(`🔐 [SENSITIVE] ${label}:`, data);
    } else {
      // En production, ne log que le label sans les données
      console.log(`🔐 [SENSITIVE] ${label}: [MASKED]`);
    }
  },

  /**
   * Masque les données sensibles dans un objet
   */
  maskSensitive: (obj: Record<string, any>): Record<string, any> => {
    const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key', 'authorization'];
    const masked = { ...obj };
    
    Object.keys(masked).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '***MASKED***';
      }
    });
    
    return masked;
  }
};

/**
 * Helper pour vérifier si on est en production
 */
export const isProduction = (): boolean => IS_PRODUCTION;

/**
 * Helper pour vérifier si on est en dev
 */
export const isDevelopment = (): boolean => IS_DEV;
