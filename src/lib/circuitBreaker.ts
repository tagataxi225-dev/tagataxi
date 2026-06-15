/**
 * CIRCUIT BREAKER PATTERN - OPTIMISÉ MOBILE AFRIQUE
 * Seuils adaptés pour réseaux instables (3G/4G Afrique)
 */
import { logger } from '@/utils/logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;

  constructor(
    private name: string,
    private threshold: number = 50,
    private timeout: number = 5000,
    private halfOpenRequests: number = 3,
    private onStateChange?: (state: CircuitState) => void
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.setState('HALF_OPEN');
        this.successCount = 0;
        this.halfOpenAttempts = 0;
      } else {
        throw new Error(`Circuit [${this.name}] OPEN`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      this.halfOpenAttempts++;

      if (this.successCount >= this.halfOpenRequests) {
        this.setState('CLOSED');
      }
    }
  }

  private shouldCountAsFailure(error: any): boolean {
    if (error?.name === 'AbortError' || error?.message?.includes('AbortError')) {
      return false;
    }
    if (error?.name === 'TypeError' && error?.message?.includes('Failed to fetch')) {
      return false;
    }
    if (error?.message?.includes('NetworkError') || error?.message?.includes('network')) {
      return false;
    }
    if (error?.message?.includes('timeout')) {
      return true;
    }
    if (error?.status >= 500) {
      return true;
    }
    if (error?.status === 401 || error?.status === 404 || error?.status === 400) {
      return false;
    }
    return true;
  }

  private onFailure(error: any) {
    if (!this.shouldCountAsFailure(error)) {
      return;
    }
    
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.setState('OPEN');
      return;
    }

    if (this.failureCount >= this.threshold) {
      this.setState('OPEN');
    }
  }

  private setState(newState: CircuitState) {
    if (this.state !== newState) {
      logger.info(`[Circuit: ${this.name}] ${this.state} -> ${newState}`);
      this.state = newState;
      this.onStateChange?.(newState);
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.threshold
    };
  }

  getDetailedStats() {
    return {
      ...this.getStats(),
      nextRetryTime: this.state === 'OPEN' 
        ? new Date(this.lastFailureTime + this.timeout).toISOString()
        : null,
      isAvailable: this.state !== 'OPEN'
    };
  }

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
    this.halfOpenAttempts = 0;
    if (this.state !== 'CLOSED') {
      this.setState('CLOSED');
    }
  }
}

export const supabaseCircuitBreaker = new CircuitBreaker(
  'Supabase',
  50,
  5000,
  3,
  (state) => {
    if (state === 'OPEN') {
      logger.warn('⚠️ Supabase circuit OPEN - 5s cooldown');
    } else if (state === 'CLOSED') {
      logger.info('✅ Supabase circuit CLOSED');
    }
  }
);

export async function fetchWithCircuitBreaker<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return supabaseCircuitBreaker.execute(async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  });
}

export async function supabaseWithCircuitBreaker<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  return supabaseCircuitBreaker.execute(async () => {
    const { data, error } = await queryFn();
    if (error) throw error;
    if (data === null) throw new Error('No data returned');
    return data;
  });
}
