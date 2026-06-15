import { logger } from './logger';

export const logDataLoss = (context: string, error: any) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    context,
    error: error?.message || 'Unknown error',
    user: localStorage.getItem('kwenda_user_id'),
    route: window.location.pathname,
    sessionValid: !!localStorage.getItem('supabase.auth.token')
  };
  
  logger.error('🚨 [DATA LOSS]', logEntry);
  
  // En production, envoyer à un service de monitoring
  if (import.meta.env.PROD) {
    // TODO: Intégrer Sentry/autre
    // Sentry.captureException(error, { contexts: { logEntry } });
  }
};
