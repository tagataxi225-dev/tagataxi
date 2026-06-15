/**
 * 🧠 HEALTH ORCHESTRATOR - LAYER 4: CERVEAU CENTRAL
 * Coordonne tous les systèmes de santé et déclenche les actions automatiques
 */

import { healthMonitor, type HealthMetrics, type HealthStatus } from './HealthMonitor';
import { apiHealthChecker } from './APIHealthChecker';
import { memoryPressureManager } from './MemoryPressureManager';
import { smartReloader } from './SmartReloader';
import { DegradedLevel } from '@/contexts/DegradedModeContext';

export class HealthOrchestrator {
  private evaluationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastAutoFix = 0;

  public start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('🧠 [HealthOrchestrator] Démarré');

    // Évaluation toutes les 60 secondes (réduit la charge CPU/batterie)
    this.evaluationInterval = setInterval(() => {
      this.evaluateAndAct();
    }, 60000);

    // Évaluation initiale différée (laisser l'app se stabiliser)
    setTimeout(() => this.evaluateAndAct(), 10000);
  }

  private async evaluateAndAct() {
    const metrics = healthMonitor.getMetrics();
    const healthScore = healthMonitor.getHealthScore();
    const healthStatus = healthMonitor.getHealthStatus();

    if (import.meta.env.DEV) {
      console.log(`🧠 [Health] Score: ${healthScore}/100 | Status: ${healthStatus}`);
    }

    // Décisions basées sur le score
    if (healthScore < 30) {
      this.handleCriticalHealth(metrics);
    } else if (healthScore < 50) {
      this.handleSevereHealth(metrics);
    } else if (healthScore < 70) {
      this.handleModerateHealth(metrics);
    } else if (healthScore < 90) {
      this.handleLightHealth(metrics);
    }

    // Auto-fixes spécifiques
    await this.attemptAutoFixes(metrics);
  }

  private handleCriticalHealth(metrics: HealthMetrics) {
    console.error('🔴 [HealthOrchestrator] État CRITIQUE');
    
    // 🛡️ Sur mobile natif, JAMAIS de reload automatique (risque de perte de session)
    const isNative = !!(window as any)?.Capacitor?.isNativePlatform?.();
    
    // Log les crashes mais ne PAS déclencher de reload automatique
    const recentCrashes = metrics.crashes.lastCrashTime > Date.now() - 60000;
    if (metrics.crashes.total >= 5 && recentCrashes) {
      console.error('💥 5+ crashes récents détectés — pas de reload auto, l\'utilisateur décide');
    }

    // Mémoire critique → Cleanup agressif SANS reload
    if (metrics.memory.trend === 'critical' || metrics.memory.percentage > 95) {
      console.error('🧹 Mémoire critique, cleanup urgence (sans reload)');
      memoryPressureManager.forceCleanup();
    }
  }

  private handleSevereHealth(metrics: HealthMetrics) {
    console.warn('🟠 [HealthOrchestrator] État SÉVÈRE');
    
    // Mode dégradé sévère déjà activé par DegradedModeContext
    // Ici on peut faire des actions supplémentaires
    
    if (metrics.network.status === 'offline') {
      console.warn('📴 Mode offline, désactivation services réseau');
    }

    if (metrics.battery.critical && !metrics.battery.charging) {
      console.warn('🔋 Batterie critique, mode ultra-économie');
    }
  }

  private handleModerateHealth(metrics: HealthMetrics) {
    console.warn('🟡 [HealthOrchestrator] État MODÉRÉ');
    
    // Cleanup préventif si mémoire élevée
    if (metrics.memory.percentage > 75) {
      const now = Date.now();
      // Éviter les cleanups trop fréquents
      if (now - this.lastAutoFix > 120000) {
        console.log('🧹 Cleanup préventif');
        memoryPressureManager.forceCleanup();
        this.lastAutoFix = now;
      }
    }
  }

  private handleLightHealth(metrics: HealthMetrics) {
    // Mode dégradé léger
    if (import.meta.env.DEV) {
      console.log('🟢 [HealthOrchestrator] État LÉGER (optimisations mineures)');
    }
  }

  private async attemptAutoFixes(metrics: HealthMetrics) {
    // Fix 1: Mémoire en augmentation continue
    if (metrics.memory.trend === 'rising') {
      const now = Date.now();
      if (now - this.lastAutoFix > 60000) {
        console.log('🔧 Auto-fix: Cleanup préventif mémoire');
        await memoryPressureManager.forceCleanup();
        this.lastAutoFix = now;
      }
    }

    // Fix 2: APIs en échec → Vérifier fallbacks
    Object.entries(metrics.apis).forEach(([name, api]) => {
      if (api.consecutiveFailures >= 3) {
        console.log(`🔧 Auto-fix: API ${name} en échec, vérification fallback`);
        // Les fallbacks sont gérés dans APIHealthChecker
      }
    });

    // Fix 3: Réseau instable → Augmenter les timeouts
    if (metrics.network.status === 'unstable' && metrics.network.latency > 2000) {
      console.log('🔧 Auto-fix: Réseau instable, ajustements');
      // Émettre événement pour ajuster les timeouts
      window.dispatchEvent(new CustomEvent('network-unstable', {
        detail: { latency: metrics.network.latency }
      }));
    }
  }

  public getDetailedStatus() {
    return {
      health: {
        score: healthMonitor.getHealthScore(),
        status: healthMonitor.getHealthStatus(),
        metrics: healthMonitor.getMetrics()
      },
      apis: apiHealthChecker.getDetailedStatus(),
      memory: {
        usage: memoryPressureManager.getMemoryUsage(),
      },
      timestamp: Date.now()
    };
  }

  public async runDiagnostic() {
    console.log('🔍 [HealthOrchestrator] Diagnostic complet...');
    
    const status = this.getDetailedStatus();
    
    console.table({
      'Health Score': status.health.score,
      'Status': status.health.status,
      'Memory %': status.memory.usage?.toFixed(1) + '%',
      'Memory Trend': status.health.metrics.memory.trend,
      'Network': status.health.metrics.network.status,
      'Battery': status.health.metrics.battery.level + '%',
      'Crashes': status.health.metrics.crashes.total
    });

    console.log('APIs Status:', status.apis);
    
    return status;
  }

  public forceRecovery() {
    console.log('🛡️ [HealthOrchestrator] Recovery forcé');
    
    // 1. Cleanup mémoire
    memoryPressureManager.forceCleanup();
    
    // 2. Reload intelligent
    smartReloader.scheduleReload({
      type: 'recovery',
      severity: 'high',
      message: 'Récupération manuelle déclenchée'
    }, 5000);
  }

  public stop() {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
    
    healthMonitor.cleanup();
    apiHealthChecker.cleanup();
    memoryPressureManager.cleanup();
    smartReloader.cleanup();
    
    this.isRunning = false;
    console.log('🛑 [HealthOrchestrator] Arrêté');
  }
}

// Instance singleton
export const healthOrchestrator = new HealthOrchestrator();

// Exposer pour debug
if (typeof window !== 'undefined') {
  (window as any).healthOrchestrator = healthOrchestrator;
}
