import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Star, 
  Battery,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverData } from '@/hooks/useDriverData';

export const DriverStatusCard = () => {
  const { status, loading, goOnline, goOffline, setAvailable } = useDriverStatus();
  const { stats, recentRides } = useDriverData();

  const handleOnlineToggle = async (checked: boolean) => {
    if (checked) {
      await goOnline();
    } else {
      await goOffline();
    }
  };

  const handleAvailabilityToggle = async (checked: boolean) => {
    await setAvailable(checked);
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-background to-background/50 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Statut Chauffeur
          </span>
          <Badge 
            variant={status?.isOnline ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {status?.isOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {status?.isOnline ? 'En ligne' : 'Hors ligne'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Status Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">En ligne</span>
            <Switch
              checked={status?.isOnline || false}
              onCheckedChange={handleOnlineToggle}
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Disponible</span>
            <Switch
              checked={status?.isAvailable || false}
              onCheckedChange={handleAvailabilityToggle}
              disabled={loading || !status?.isOnline}
            />
          </div>
        </div>

        {/* Driver Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>Zone: Kinshasa</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-amber-500" />
            <span>4.8 (125 avis)</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>Dernière mise à jour: {new Date(status?.lastUpdate || '').toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>

        {/* Today's Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold text-primary">{stats.total_rides}</div>
              <div className="text-xs text-muted-foreground">Courses</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {stats.total_earnings.toLocaleString()} CDF
              </div>
              <div className="text-xs text-muted-foreground">Gains</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">
                8.5h
              </div>
              <div className="text-xs text-muted-foreground">Temps</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.location.href = '/driver/earnings'}
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Gains
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => window.location.href = '/driver/trips'}
          >
            <MapPin className="h-4 w-4 mr-1" />
            Historique
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};