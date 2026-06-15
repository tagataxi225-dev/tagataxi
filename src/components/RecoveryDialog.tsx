/**
 * 🛡️ RECOVERY DIALOG - LAYER 5: NOTIFICATIONS DE RÉCUPÉRATION
 * Informe l'utilisateur des actions automatiques critiques
 */

import React, { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { memoryPressureManager } from '@/services/MemoryPressureManager';

interface RecoveryEvent {
  type: 'memory-critical' | 'crash-recovery' | 'auto-optimization';
  message: string;
  action?: string;
  severity: 'info' | 'warning' | 'error';
}

export const RecoveryDialog: React.FC = () => {
  const [event, setEvent] = useState<RecoveryEvent | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Écouter les événements de mémoire critique
    const handleMemoryCritical = (e: CustomEvent) => {
      setEvent({
        type: 'memory-critical',
        message: 'La mémoire de l\'application est saturée',
        action: e.detail.action,
        severity: 'error'
      });
      setIsOpen(true);
    };

    // Écouter les événements de crash recovery
    const handleCrashRecovery = (e: CustomEvent) => {
      setEvent({
        type: 'crash-recovery',
        message: 'L\'application se rétablit après une erreur',
        severity: 'warning'
      });
      setIsOpen(true);
    };

    // Écouter les événements d'optimisation automatique
    const handleAutoOptimization = (e: CustomEvent) => {
      setEvent({
        type: 'auto-optimization',
        message: 'Optimisations automatiques activées',
        severity: 'info'
      });
      setIsOpen(true);
    };

    window.addEventListener('memory-critical', handleMemoryCritical as EventListener);
    window.addEventListener('crash-recovery', handleCrashRecovery as EventListener);
    window.addEventListener('auto-optimization', handleAutoOptimization as EventListener);

    return () => {
      window.removeEventListener('memory-critical', handleMemoryCritical as EventListener);
      window.removeEventListener('crash-recovery', handleCrashRecovery as EventListener);
      window.removeEventListener('auto-optimization', handleAutoOptimization as EventListener);
    };
  }, []);

  const handleOptimize = async () => {
    if (event?.type === 'memory-critical') {
      await memoryPressureManager.forceCleanup();
      
      // Vérifier si le cleanup a résolu le problème
      setTimeout(() => {
        const usage = memoryPressureManager.getMemoryUsage();
        if (usage && usage > 90) {
          // Toujours critique, proposer reload
          if (confirm('La mémoire est toujours saturée. Redémarrer l\'application ?')) {
            window.location.reload();
          }
        }
      }, 2000);
    }
    
    setIsOpen(false);
  };

  const handleReload = () => {
    localStorage.removeItem('kwenda_user_roles_cache');
    window.location.reload();
  };

  const handleContinue = () => {
    setIsOpen(false);
  };

  if (!event) return null;

  const getIcon = () => {
    switch (event.severity) {
      case 'error':
        return <AlertTriangle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <RefreshCw className="w-12 h-12 text-yellow-500" />;
      default:
        return <Zap className="w-12 h-12 text-blue-500" />;
    }
  };

  const getTitle = () => {
    switch (event.type) {
      case 'memory-critical':
        return 'Mémoire critique';
      case 'crash-recovery':
        return 'Récupération en cours';
      case 'auto-optimization':
        return 'Optimisation automatique';
      default:
        return 'Notification';
    }
  };

  const getDescription = () => {
    return event.message;
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <AlertDialogTitle className="text-center">
            {getTitle()}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          {event.type === 'memory-critical' && (
            <>
              <AlertDialogCancel onClick={handleContinue}>
                Continuer
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleOptimize}>
                Optimiser maintenant
              </AlertDialogAction>
              {event.action === 'reload-recommended' && (
                <AlertDialogAction onClick={handleReload} className="bg-red-500 hover:bg-red-600">
                  Redémarrer
                </AlertDialogAction>
              )}
            </>
          )}
          
          {event.type === 'crash-recovery' && (
            <>
              <AlertDialogCancel onClick={handleContinue}>
                OK
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleReload}>
                Redémarrer
              </AlertDialogAction>
            </>
          )}
          
          {event.type === 'auto-optimization' && (
            <AlertDialogAction onClick={handleContinue}>
              Compris
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
