/**
 * Système de logging conditionnel pour production
 * Remplace tous les console.log dans le projet
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

const isProduction = import.meta.env.PROD;

class Logger {
  private config: LogConfig = {
    enabled: !isProduction, // Désactivé en production
    level: 'info',
  };

  setConfig(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || 'Tembea';
    return `[${timestamp}] [${prefix}] [${level.toUpperCase()}] ${message}`;
  }

  info(message: string, data?: any) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), data || '');
    }
  }

  warn(message: string, data?: any) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), data || '');
    }
  }

  error(message: string, error?: any) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error || '');
      
      // En production, envoyer à un service de monitoring (Sentry, etc.)
      if (isProduction && error) {
        // TODO: Intégrer service de monitoring
        this.sendToMonitoring(message, error);
      }
    }
  }

  debug(message: string, data?: any) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), data || '');
    }
  }

  private sendToMonitoring(message: string, error: any) {
    // Placeholder pour intégration future avec Sentry/autre
    // Peut utiliser supabase.functions.invoke('log-error', { message, error })
  }
}

// Instance globale
export const logger = new Logger();

// Configuration par défaut pour développement
if (!isProduction) {
  logger.setConfig({ 
    enabled: true, 
    level: 'debug',
    prefix: 'Tembea'
  });
} else {
  // En production, logger seulement les erreurs
  logger.setConfig({ 
    enabled: true, 
    level: 'error',
    prefix: 'kwenda-Prod'
  });
}
