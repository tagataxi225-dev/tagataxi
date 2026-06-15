import { supabase } from '@/integrations/supabase/client';

// Configuration centralisée des Edge Functions
export const EDGE_FUNCTIONS = {
  // Fonctions géographiques
  GEOCODE_PROXY: 'geocode-proxy',
  GET_GOOGLE_MAPS_KEY: 'get-google-maps-key',
  
  // Fonctions de transport et livraison
  RIDE_DISPATCHER: 'ride-dispatcher',
  DELIVERY_DISPATCHER: 'delivery-dispatcher',
  NOTIFY_DRIVERS_BIDDING: 'notify-drivers-bidding',
  
  // Fonctions financières
  WALLET_TOPUP: 'wallet-topup',
  MOBILE_MONEY_PAYMENT: 'mobile-money-payment',
  
  // Fonctions de notification
  PUSH_NOTIFICATIONS: 'push-notifications',
  
  // Fonctions de gestion automatique
  AUTO_CANCEL_EXPIRED: 'auto-cancel-expired-orders',
} as const;

export const FUNCTION_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
};

export class EdgeFunctionError extends Error {
  constructor(
    public functionName: string,
    public statusCode: number,
    message: string,
    public retryable: boolean = false
  ) {
    super(`[${functionName}] ${message}`);
    this.name = 'EdgeFunctionError';
  }
}

export const callEdgeFunction = async (
  functionName: string,
  payload: any = {},
  options: {
    retries?: number;
    timeout?: number;
  } = {}
): Promise<any> => {
  const { retries = FUNCTION_RETRY_CONFIG.maxRetries, timeout = 30000 } = options;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload,
      });
      
      clearTimeout(timeoutId);
      
      if (error) {
        throw new EdgeFunctionError(
          functionName,
          error.status || 500,
          error.message || 'Unknown error',
          error.status >= 500 || error.status === 429
        );
      }
      
      return data;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      const isRetryable = error instanceof EdgeFunctionError ? error.retryable : true;
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      // Délai exponentiel
      const delay = Math.min(
        FUNCTION_RETRY_CONFIG.baseDelay * Math.pow(FUNCTION_RETRY_CONFIG.backoffFactor, attempt),
        FUNCTION_RETRY_CONFIG.maxDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};