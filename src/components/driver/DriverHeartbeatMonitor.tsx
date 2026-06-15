import { useEffect } from 'react';
import { useDriverHeartbeat } from '@/hooks/useDriverHeartbeat';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Wifi, WifiOff } from 'lucide-react';

/**
 * Composant de monitoring du heartbeat chauffeur
 * À intégrer dans le dashboard chauffeur pour maintenir la disponibilité
 */
export const DriverHeartbeatMonitor = () => {
  const { user } = useAuth();
  const { updateHeartbeat } = useDriverHeartbeat();

  useEffect(() => {
    if (user) {
      console.log('🟢 DriverHeartbeatMonitor activé pour:', user.id);
    }
  }, [user]);

  if (!user) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary animate-pulse" />
          <CardTitle className="text-sm">Statut en ligne</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Votre position est mise à jour automatiquement toutes les 2 minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Wifi className="h-3 w-3 text-green-500" />
          <span>Heartbeat actif</span>
        </div>
      </CardContent>
    </Card>
  );
};
