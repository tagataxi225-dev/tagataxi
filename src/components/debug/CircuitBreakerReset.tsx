import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabaseCircuitBreaker } from '@/lib/circuitBreaker';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const CircuitBreakerReset = () => {
  const [state, setState] = useState<'CLOSED' | 'OPEN' | 'HALF_OPEN'>('CLOSED');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentStats = supabaseCircuitBreaker.getStats();
      setState(currentStats.state);
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleReset = () => {
    supabaseCircuitBreaker.reset();
    toast.success('Circuit breaker réinitialisé', {
      description: 'Vous pouvez maintenant vous reconnecter'
    });
    setState('CLOSED');
  };

  // Afficher seulement si circuit OPEN
  if (state !== 'OPEN') return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9999]">
      <div className="bg-destructive/90 backdrop-blur-lg text-destructive-foreground p-4 rounded-xl shadow-2xl border-2 border-destructive animate-in slide-in-from-bottom">
        <div className="flex items-center gap-3 mb-3">
          <AlertCircle className="w-6 h-6 animate-pulse" />
          <div>
            <h3 className="font-bold">Connexion interrompue</h3>
            <p className="text-sm opacity-90">
              Circuit breaker actif - {stats?.failureCount || 0} erreurs détectées
            </p>
          </div>
        </div>
        
        <Button 
          onClick={handleReset}
          variant="secondary"
          className="w-full gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Réinitialiser la connexion
        </Button>
      </div>
    </div>
  );
};
