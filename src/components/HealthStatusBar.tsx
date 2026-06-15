/**
 * 🏥 HEALTH STATUS BAR - LAYER 5: INDICATEUR VISUEL DISCRET
 * Affiche l'état de santé de l'app (uniquement si nécessaire)
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Activity, Battery, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { healthMonitor, type HealthMetrics, type HealthStatus } from '@/services/HealthMonitor';
import { apiHealthChecker } from '@/services/APIHealthChecker';
import { useDegradedMode } from '@/contexts/DegradedModeContext';

export const HealthStatusBar: React.FC = () => {
  // Désactivé en production — icône debug non souhaitée
  return null;

  // eslint-disable-next-line no-unreachable
  const [healthScore, setHealthScore] = useState(100);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [metrics, setMetrics] = useState<HealthMetrics | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const { level, reason } = useDegradedMode();

  useEffect(() => {
    const updateHealth = (newMetrics: HealthMetrics) => {
      const score = healthMonitor.getHealthScore();
      const status = healthMonitor.getHealthStatus();
      
      setHealthScore(score);
      setHealthStatus(status);
      setMetrics(newMetrics);
      
      // N'afficher que si score < 80
      setShowIndicator(score < 80);
    };

    const unsubscribe = healthMonitor.subscribe(updateHealth);
    
    // État initial
    updateHealth(healthMonitor.getMetrics());

    return () => {
      unsubscribe();
    };
  }, []);

  // Ne rien afficher si tout va bien OU si le score est bon (>= 80)
  if (!showIndicator && healthStatus === 'healthy') {
    return null;
  }
  
  // Ne jamais afficher si le score est >= 80 (tout va bien)
  if (healthScore >= 80) {
    return null;
  }

  const getStatusColor = () => {
    if (healthScore >= 80) return 'bg-green-500';
    if (healthScore >= 60) return 'bg-yellow-500';
    if (healthScore >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = () => {
    if (healthScore >= 80) return <CheckCircle2 className="w-4 h-4" />;
    if (healthScore >= 60) return <Activity className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (healthScore >= 80) return 'Bon';
    if (healthScore >= 60) return 'Performance réduite';
    if (healthScore >= 40) return 'Mode économie';
    return 'Mode critique';
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`${getStatusColor()} text-white border-0 hover:opacity-90 shadow-lg`}
          >
            {getStatusIcon()}
            <span className="ml-2 font-medium">{getStatusText()}</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="end">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Activity className="w-4 h-4" />
                État de santé : {healthScore}/100
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {reason || 'Optimisations actives'}
              </p>
            </div>

            <div className="space-y-2">
              {/* Mémoire */}
              {metrics && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      metrics.memory.trend === 'critical' ? 'bg-red-500' :
                      metrics.memory.trend === 'rising' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    Mémoire
                  </span>
                  <span className="font-medium">
                    {metrics.memory.percentage.toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Réseau */}
              {metrics && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {metrics.network.status === 'offline' ? (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    ) : (
                      <Wifi className={`w-4 h-4 ${
                        metrics.network.status === 'stable' ? 'text-green-500' : 'text-yellow-500'
                      }`} />
                    )}
                    Réseau
                  </span>
                  <span className="font-medium">
                    {metrics.network.status === 'offline' ? 'Hors ligne' :
                     metrics.network.status === 'unstable' ? 'Instable' :
                     'Stable'}
                  </span>
                </div>
              )}

              {/* Batterie */}
              {metrics && metrics.battery.level < 100 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Battery className={`w-4 h-4 ${
                      metrics.battery.critical ? 'text-red-500' :
                      metrics.battery.level < 20 ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    Batterie
                  </span>
                  <span className="font-medium">
                    {metrics.battery.level.toFixed(0)}%
                  </span>
                </div>
              )}

              {/* Crashes */}
              {metrics && metrics.crashes.total > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    Crashes détectés
                  </span>
                  <span className="font-medium text-red-500">
                    {metrics.crashes.total}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                L'application ajuste automatiquement ses performances pour garantir la meilleure expérience.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
