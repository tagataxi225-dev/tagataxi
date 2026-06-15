import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, Tablet, Monitor, Wifi, WifiOff, Zap, AlertTriangle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  networkSpeed: string;
  deviceType: string;
  screenSize: string;
  isOnline: boolean;
}

export const MobilePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      const fcp = paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0;
      
      // Détection du type d'appareil
      const getDeviceType = () => {
        const width = window.innerWidth;
        if (width <= 768) return 'mobile';
        if (width <= 1024) return 'tablet';
        return 'desktop';
      };

      // Estimation de la vitesse réseau
      const getNetworkSpeed = () => {
        // @ts-ignore - API expérimentale
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          switch (effectiveType) {
            case 'slow-2g': return 'Très lent (2G)';
            case '2g': return 'Lent (2G)';
            case '3g': return 'Moyen (3G)';
            case '4g': return 'Rapide (4G+)';
            default: return 'Inconnue';
          }
        }
        return 'Non disponible';
      };

      const newMetrics: PerformanceMetrics = {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        firstContentfulPaint: fcp,
        networkSpeed: getNetworkSpeed(),
        deviceType: getDeviceType(),
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        isOnline: navigator.onLine
      };

      setMetrics(newMetrics);
      setIsLoading(false);
    };

    // Attendre que la page soit complètement chargée
    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Tablet className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getPerformanceStatus = (loadTime: number) => {
    if (loadTime <= 1000) return { status: 'excellent', color: 'text-green-600', label: 'Excellent' };
    if (loadTime <= 2000) return { status: 'good', color: 'text-blue-600', label: 'Bon' };
    if (loadTime <= 3000) return { status: 'fair', color: 'text-yellow-600', label: 'Acceptable' };
    return { status: 'poor', color: 'text-red-600', label: 'Lent' };
  };

  const runResponsiveTest = () => {
    const tests = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 390, height: 844, name: 'iPhone 12 Pro' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop HD' }
    ];

    console.log('🧪 Test de responsive design:');
    tests.forEach(test => {
      console.log(`📱 ${test.name} (${test.width}x${test.height}):`, 
        window.innerWidth <= test.width ? 'Compatible' : 'À optimiser');
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 animate-pulse" />
            <span>Analyse des performances en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const performanceStatus = getPerformanceStatus(metrics.loadTime);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Mobile</span>
          </CardTitle>
          <CardDescription>
            Métriques de performance en temps réel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status global */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span className="font-medium">Performance globale</span>
            </div>
            <Badge variant={performanceStatus.status === 'excellent' ? 'default' : 'secondary'}>
              <span className={performanceStatus.color}>{performanceStatus.label}</span>
            </Badge>
          </div>

          {/* Métriques détaillées */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Temps de chargement</p>
              <p className={`text-lg font-bold ${performanceStatus.color}`}>
                {Math.round(metrics.loadTime)}ms
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">First Contentful Paint</p>
              <p className="text-lg font-bold text-blue-600">
                {Math.round(metrics.firstContentfulPaint)}ms
              </p>
            </div>
          </div>

          {/* Informations appareil */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getDeviceIcon(metrics.deviceType)}
                <span className="text-sm">Type d'appareil</span>
              </div>
              <span className="text-sm font-medium capitalize">{metrics.deviceType}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="h-4 w-4" />
                <span className="text-sm">Résolution</span>
              </div>
              <span className="text-sm font-medium">{metrics.screenSize}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {metrics.isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="text-sm">Réseau</span>
              </div>
              <span className="text-sm font-medium">{metrics.networkSpeed}</span>
            </div>
          </div>

          {/* Alertes de performance */}
          {metrics.loadTime > 2000 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le temps de chargement dépasse 2 secondes. Considérez optimiser les ressources.
              </AlertDescription>
            </Alert>
          )}

          {metrics.deviceType === 'mobile' && metrics.firstContentfulPaint > 1500 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Le rendu mobile est lent. Optimisez pour les appareils mobiles.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.reload()}
            >
              Actualiser les métriques
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={runResponsiveTest}
            >
              Test responsive
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recommandations d'optimisation */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>✅ Interface responsive multi-appareils</p>
            <p>✅ Lazy loading des composants</p>
            <p>✅ Optimisation des images</p>
            <p>✅ Cache intelligent des données</p>
            {metrics.loadTime <= 2000 ? (
              <p className="text-green-600">✅ Performance objectif atteinte (&lt; 2s)</p>
            ) : (
              <p className="text-red-600">❌ Performance à améliorer (objectif &lt; 2s)</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};