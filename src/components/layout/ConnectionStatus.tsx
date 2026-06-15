import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { supabaseCircuitBreaker } from '@/lib/circuitBreaker';

export const ConnectionStatus = () => {
  const [state, setState] = useState<'CLOSED' | 'OPEN' | 'HALF_OPEN'>('CLOSED');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateStatus = () => {
      const stats = supabaseCircuitBreaker.getStats();
      setState(stats.state);
      setIsOnline(navigator.onLine);
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

  if (state === 'CLOSED' && isOnline) return null;

  return (
    <Badge 
      variant={state === 'OPEN' ? 'destructive' : isOnline ? 'default' : 'secondary'}
      className="fixed top-4 right-4 z-50 gap-2"
    >
      {state === 'OPEN' ? (
        <>
          <WifiOff className="w-3 h-3 animate-pulse" />
          Service instable
        </>
      ) : !isOnline ? (
        <>
          <WifiOff className="w-3 h-3" />
          Hors ligne
        </>
      ) : (
        <>
          <AlertTriangle className="w-3 h-3" />
          Récupération...
        </>
      )}
    </Badge>
  );
};
