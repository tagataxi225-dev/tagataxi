import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { MapPin, Loader2, Zap } from 'lucide-react';
import { useDriverArrivalConfirmation } from '@/hooks/useDriverArrivalConfirmation';

interface DriverArrivalButtonProps {
  bookingId: string;
  ridesRemaining: number;
  onArrivalConfirmed?: (ridesRemaining: number) => void;
  className?: string;
}

export const DriverArrivalButton: React.FC<DriverArrivalButtonProps> = ({
  bookingId,
  ridesRemaining,
  onArrivalConfirmed,
  className
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { confirmArrival, confirming } = useDriverArrivalConfirmation();

  const handleConfirm = async () => {
    setShowConfirmDialog(false);
    
    const result = await confirmArrival(bookingId);
    
    if (result.success && result.rides_remaining !== undefined) {
      onArrivalConfirmed?.(result.rides_remaining);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirmDialog(true)}
        disabled={confirming}
        className={className}
        size="lg"
      >
        {confirming ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Vérification...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Je suis arrivé
          </>
        )}
      </Button>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              ⚠️ Confirmation d'arrivée
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-4">
              <p className="font-medium text-foreground">
                Vous vous apprêtez à confirmer votre arrivée
              </p>
              
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>📍 Distance maximum</span>
                  <span className="font-medium">100 mètres</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Crédit à déduire
                  </span>
                  <span className="font-medium">1 course</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Crédits restants</span>
                  <span className="font-bold text-primary">{ridesRemaining - 1} / {ridesRemaining}</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-xs space-y-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  ℹ️ Informations importantes
                </p>
                <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                  <li>Votre position GPS sera vérifiée</li>
                  <li>Vous devez être à moins de 100m du client</li>
                  <li>Le crédit sera immédiatement déduit</li>
                  <li>Le client sera notifié de votre arrivée</li>
                </ul>
              </div>

              {ridesRemaining <= 5 && (
                <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg text-xs">
                  <p className="font-medium text-orange-900 dark:text-orange-100">
                    ⚠️ Crédits faibles : Pensez à renouveler votre abonnement
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-primary"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Confirmer l\'arrivée'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
