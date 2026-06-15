/**
 * 📊 COMPOSANT DE MONITORING DU TRACKING
 * 
 * Dashboard temps réel pour surveiller les performances
 * du système de géolocalisation moderne
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Battery, 
  Wifi, 
  MapPin, 
  Clock, 
  Zap,
  Signal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { useModernTracking } from '@/hooks/useModernTracking';

interface TrackingMonitorProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export const TrackingMonitor: React.FC<TrackingMonitorProps> = ({ 
  variant = 'compact',
  className = ""
}) => {
  const tracking = useModernTracking();
  const [showDetails, setShowDetails] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'degraded': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'good': return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const CompactView = () => (
    <Card className={`${className} border-l-4 ${
      tracking.isTracking 
        ? tracking.healthStatus === 'excellent' 
          ? 'border-l-green-500' 
          : tracking.healthStatus === 'good'
          ? 'border-l-blue-500'
          : tracking.healthStatus === 'degraded'
          ? 'border-l-yellow-500'
          : 'border-l-red-500'
        : 'border-l-gray-400'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(tracking.healthStatus)}
            <div>
              <div className="font-medium text-sm">
                Tracking {tracking.isTracking ? 'Actif' : 'Inactif'}
              </div>
              <div className="text-xs text-muted-foreground">
                {tracking.isTracking ? (
                  `${tracking.stats.totalUpdates} positions • ${tracking.getLocationAccuracy()}`
                ) : (
                  'Géolocalisation arrêtée'
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {tracking.isTracking && (
              <>
                <Badge variant="outline" className="text-xs">
                  <Battery className="h-3 w-3 mr-1" />
                  {tracking.status.batteryLevel}%
                </Badge>
                <Badge variant={tracking.status.networkStatus === 'online' ? 'default' : 'destructive'} className="text-xs">
                  <Wifi className="h-3 w-3 mr-1" />
                  {tracking.status.networkStatus}
                </Badge>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {tracking.error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            {tracking.error}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const DetailedView = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Status Principal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              {getStatusIcon(tracking.healthStatus)}
              <span>Tracking Moderne</span>
            </span>
            <Badge className={getStatusColor(tracking.healthStatus)}>
              {tracking.healthStatus}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{tracking.stats.totalUpdates}</div>
              <div className="text-xs text-muted-foreground">Positions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {tracking.currentPosition?.accuracy.toFixed(0) || '—'}m
              </div>
              <div className="text-xs text-muted-foreground">Précision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatUptime(tracking.stats.uptime)}
              </div>
              <div className="text-xs text-muted-foreground">Temps actif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {tracking.stats.dataCompression.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Compression</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques Détaillées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batterie & Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Battery className="h-4 w-4" />
              <span>Optimisation Batterie</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Niveau actuel</span>
                <span>{tracking.status.batteryLevel}%</span>
              </div>
              <Progress value={tracking.status.batteryLevel} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Consommation tracking</span>
                <span>{tracking.stats.batteryUsage}%</span>
              </div>
              <Progress value={tracking.stats.batteryUsage} className="h-2" />
            </div>
            <div className="text-xs text-muted-foreground">
              Interval adaptatif: {tracking.status.currentInterval}ms
            </div>
          </CardContent>
        </Card>

        {/* Réseau & Cache */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Signal className="h-4 w-4" />
              <span>Réseau & Cache</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Statut réseau</span>
              <Badge variant={tracking.status.networkStatus === 'online' ? 'default' : 'destructive'}>
                <Wifi className="h-3 w-3 mr-1" />
                {tracking.status.networkStatus}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Buffer hors ligne</span>
              <span>{tracking.status.bufferSize} positions</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cache zones</span>
              <span>{tracking.status.cacheSize} entrées</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Erreurs réseau</span>
              <span className={tracking.stats.networkErrors > 0 ? 'text-red-600' : 'text-green-600'}>
                {tracking.stats.networkErrors}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Actuelle */}
      {tracking.currentPosition && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Position Actuelle</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Latitude</div>
                <div className="font-mono">{tracking.currentPosition.latitude.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Longitude</div>
                <div className="font-mono">{tracking.currentPosition.longitude.toFixed(6)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Vitesse</div>
                <div>{tracking.currentPosition.speed ? `${(tracking.currentPosition.speed * 3.6).toFixed(1)} km/h` : '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Cap</div>
                <div>{tracking.currentPosition.heading ? `${tracking.currentPosition.heading.toFixed(0)}°` : '—'}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 inline mr-1" />
              Dernière mise à jour: {new Date(tracking.currentPosition.timestamp).toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erreurs */}
      {tracking.error && (
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Erreur de tracking</span>
            </div>
            <div className="mt-2 text-sm text-red-700">{tracking.error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={tracking.clearError}
              className="mt-3"
            >
              Effacer l'erreur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Button
              onClick={() => tracking.isTracking ? tracking.stopTracking() : tracking.startTracking()}
              className={tracking.isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              <Zap className="h-4 w-4 mr-2" />
              {tracking.isTracking ? 'Arrêter' : 'Démarrer'} Tracking
            </Button>
            
            {tracking.error && (
              <Button variant="outline" onClick={tracking.clearError}>
                Effacer Erreur
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (variant === 'compact' && !showDetails) {
    return <CompactView />;
  }

  return <DetailedView />;
};

export default TrackingMonitor;