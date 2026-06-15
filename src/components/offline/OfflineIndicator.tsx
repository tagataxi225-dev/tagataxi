/**
 * Indicateur de statut offline avec compteur de synchronisation
 */

import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { cn } from '@/lib/utils';

export const OfflineIndicator = () => {
  const { isOnline, isSyncing, pendingCount, syncProgress, sync } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border px-4 py-2 shadow-lg backdrop-blur-sm",
      isOnline ? "bg-background/80 border-primary/20" : "bg-destructive/10 border-destructive/20"
    )}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-primary" />
      ) : (
        <WifiOff className="h-4 w-4 text-destructive" />
      )}
      
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </span>
        
        {pendingCount > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {pendingCount} en attente
            </Badge>
            
            {isSyncing && syncProgress.total > 0 && (
              <span className="text-xs text-muted-foreground">
                {syncProgress.current}/{syncProgress.total}
              </span>
            )}
          </div>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <Button
          size="sm"
          variant="ghost"
          onClick={sync}
          disabled={isSyncing}
          className="ml-2"
        >
          <RefreshCw className={cn(
            "h-4 w-4",
            isSyncing && "animate-spin"
          )} />
        </Button>
      )}
    </div>
  );
};
