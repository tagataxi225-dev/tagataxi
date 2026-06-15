import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { 
  Zap, 
  Battery, 
  Wifi, 
  WifiOff, 
  TrendingUp, 
  TrendingDown, 
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface PerformanceIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({ 
  showDetails = false,
  className = ''
}) => {
  const { 
    metrics, 
    optimizations, 
    performanceScore, 
    isSlowConnection, 
    isOffline, 
    isLowMemory,
    isLowBattery,
    autoOptimize 
  } = usePerformanceMonitor();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  if (!showDetails) {
    return (
      <div className={`fixed bottom-20 right-4 z-40 ${className}`}>
        <Badge 
          variant="secondary" 
          className={`${getScoreColor(performanceScore)} flex items-center space-x-2 px-3 py-2 shadow-lg border transition-all duration-300`}
        >
          {getScoreIcon(performanceScore)}
          <span className="font-medium">{performanceScore}%</span>
          {isSlowConnection && <WifiOff className="w-3 h-3" />}
          {isLowBattery && <Battery className="w-3 h-3" />}
        </Badge>
      </div>
    );
  }

  return (
    <Card className={`${className} cultural-card`}>
      <CardContent className="p-4 space-y-4">
        {/* Performance Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Performance</span>
          </div>
          <Badge className={getScoreColor(performanceScore)}>
            {getScoreIcon(performanceScore)}
            <span className="ml-1">{performanceScore}%</span>
          </Badge>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isOffline ? (
              <WifiOff className="w-4 h-4 text-red-500" />
            ) : (
              <Wifi className="w-4 h-4 text-green-500" />
            )}
            <span className="text-sm text-muted-foreground">
              {isOffline ? 'Hors ligne' : isSlowConnection ? 'Connexion lente' : 'Connexion rapide'}
            </span>
          </div>
          {isSlowConnection && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Lent
            </Badge>
          )}
        </div>

        {/* Battery Status */}
        {metrics.batteryLevel && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Battery className={`w-4 h-4 ${isLowBattery ? 'text-red-500' : 'text-green-500'}`} />
              <span className="text-sm text-muted-foreground">
                Batterie: {metrics.batteryLevel}%
              </span>
            </div>
            {isLowBattery && (
              <Badge variant="outline" className="text-red-600 border-red-200">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Faible
              </Badge>
            )}
          </div>
        )}

        {/* Memory Usage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary/20 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-primary rounded-sm" />
            </div>
            <span className="text-sm text-muted-foreground">
              Mémoire: {Math.round(metrics.memoryUsage)}%
            </span>
          </div>
          {isLowMemory && (
            <Badge variant="outline" className="text-orange-600 border-orange-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Élevé
            </Badge>
          )}
        </div>

        {/* Active Optimizations */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Optimisations actives</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(optimizations).map(([key, enabled]) => (
              <div
                key={key}
                className={`flex items-center space-x-2 p-2 rounded-lg ${
                  enabled ? 'bg-green-50 text-green-700' : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {enabled ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <div className="w-3 h-3 border border-current rounded-full" />
                )}
                <span className="text-xs capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Auto Optimize Button */}
        <Button 
          onClick={autoOptimize} 
          variant="outline" 
          size="sm" 
          className="w-full touch-friendly"
        >
          <Settings className="w-4 h-4 mr-2" />
          Optimiser automatiquement
        </Button>
      </CardContent>
    </Card>
  );
};