import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { supabaseCircuitBreaker } from '@/lib/circuitBreaker';
import { WifiOff, RefreshCw, CloudOff, Loader2, Database } from 'lucide-react';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { Badge } from '@/components/ui/badge';

type AlertState = 'none' | 'offline' | 'circuit-open' | 'recovering';

export const UnifiedConnectionAlert = () => {
  const [alertState, setAlertState] = useState<AlertState>('none');
  const [isResetting, setIsResetting] = useState(false);
  const { pendingCount } = useOfflineSync();

  useEffect(() => {
    const updateStatus = () => {
      const isOnline = navigator.onLine;
      const stats = supabaseCircuitBreaker.getStats();
      
      if (stats.state === 'OPEN') {
        setAlertState('circuit-open');
      } else if (!isOnline) {
        setAlertState('offline');
      } else if (stats.state === 'HALF_OPEN') {
        setAlertState('recovering');
      } else {
        setAlertState('none');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    supabaseCircuitBreaker.reset();
    
    setTimeout(() => {
      setIsResetting(false);
      setAlertState('none');
    }, 500);
  };

  const getAlertConfig = () => {
    switch (alertState) {
      case 'circuit-open':
        return {
          icon: CloudOff,
          title: 'Connexion instable',
          subtitle: 'Vérifiez votre connexion internet',
          showReset: true,
          bgClass: 'bg-destructive/95',
          textClass: 'text-destructive-foreground'
        };
      case 'offline':
        return {
          icon: Database,
          title: 'Mode hors ligne',
          subtitle: 'Données en cache disponibles',
          showReset: false,
          bgClass: 'bg-muted/95',
          textClass: 'text-muted-foreground'
        };
      case 'recovering':
        return {
          icon: Loader2,
          title: 'Reconnexion...',
          subtitle: null,
          showReset: false,
          bgClass: 'bg-amber-500/95',
          textClass: 'text-white'
        };
      default:
        return null;
    }
  };

  const config = getAlertConfig();

  return (
    <AnimatePresence>
      {config && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[9999] pointer-events-none flex justify-center"
        >
          <div 
            className={`
              ${config.bgClass} ${config.textClass}
              backdrop-blur-lg rounded-xl shadow-2xl 
              px-4 py-3 flex items-center gap-3
              max-w-sm w-full pointer-events-auto
              border border-white/10
            `}
          >
            <config.icon className={`h-5 w-5 shrink-0 ${alertState === 'recovering' ? 'animate-spin' : ''}`} />
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{config.title}</p>
              {config.subtitle && (
                <p className="text-xs opacity-80 truncate">{config.subtitle}</p>
              )}
              {alertState === 'offline' && pendingCount > 0 && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {pendingCount} en attente
                  </Badge>
                  <span className="text-[10px] opacity-60">• sync au retour</span>
                </div>
              )}
            </div>

            {config.showReset && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleReset}
                disabled={isResetting}
                className="shrink-0 h-8 px-3 text-xs gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
                Réessayer
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
