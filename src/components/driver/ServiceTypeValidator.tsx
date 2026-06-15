import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ServiceTypeValidatorProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  serviceSpecialization: string | null;
}

/**
 * Composant qui détecte et corrige automatiquement les incohérences de service_type
 * Exemple : Un chauffeur enregistré comme "livreur" mais qui devrait être "taxi"
 */
export const ServiceTypeValidator: React.FC<ServiceTypeValidatorProps> = ({
  serviceType,
  serviceSpecialization,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [detectedIssue, setDetectedIssue] = useState<{
    currentType: string;
    suggestedType: 'taxi' | 'delivery';
    suggestedSpecialization: string;
    reason: string;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);

  useEffect(() => {
    if (!user || isChecking) return;

    const checkForInconsistencies = async () => {
      setIsChecking(true);

      try {
        // Récupérer les données complètes du chauffeur
        const { data: driverData, error } = await (supabase as any)
          .from('chauffeurs')
          .select('service_type, service_specialization, vehicle_type')
          .eq('user_id', user.id)
          .single();

        if (error || !driverData) {
          console.error('❌ Error checking driver data:', error);
          setIsChecking(false);
          return;
        }

        // Détecter les incohérences
        let issue = null;

        // Cas 1 : service_specialization suggère un type différent de service_type
        if (driverData.service_specialization) {
          const isTaxiSpecialization = [
            'taxi_moto',
            'taxi_eco',
            'taxi_premium',
            'taxi_bus',
          ].includes(driverData.service_specialization);

          const isDeliverySpecialization = [
            'flash',
            'flex',
            'maxicharge',
          ].includes(driverData.service_specialization);

          if (isTaxiSpecialization && driverData.service_type === 'delivery') {
            issue = {
              currentType: 'Livreur',
              suggestedType: 'taxi' as const,
              suggestedSpecialization: driverData.service_specialization,
              reason: `Votre spécialisation "${driverData.service_specialization}" correspond à un service de taxi`,
            };
          } else if (isDeliverySpecialization && driverData.service_type === 'taxi') {
            issue = {
              currentType: 'Chauffeur Taxi',
              suggestedType: 'delivery' as const,
              suggestedSpecialization: driverData.service_specialization,
              reason: `Votre spécialisation "${driverData.service_specialization}" correspond à un service de livraison`,
            };
          }
        }

        // Cas 2 : vehicle_type suggère un type différent (fallback si pas de specialization)
        if (!issue && driverData.vehicle_type && !driverData.service_specialization) {
          // Si moto et service_type = delivery, mais pas de specialization livraison
          if (
            driverData.vehicle_type === 'moto' &&
            driverData.service_type === 'delivery'
          ) {
            issue = {
              currentType: 'Livreur',
              suggestedType: 'taxi' as const,
              suggestedSpecialization: 'taxi_moto',
              reason: 'Votre véhicule est une moto, ce qui correspond généralement à un service de taxi-moto',
            };
          }
        }

        if (issue) {
          setDetectedIssue(issue);
          setShowDialog(true);
        }
      } catch (err) {
        console.error('💥 Error in ServiceTypeValidator:', err);
      } finally {
        setIsChecking(false);
      }
    };

    // Vérifier uniquement si le service_type n'est pas 'unknown'
    if (serviceType !== 'unknown') {
      checkForInconsistencies();
    }
  }, [user, serviceType, serviceSpecialization]);

  const handleCorrect = async () => {
    if (!user || !detectedIssue) return;

    setIsCorrecting(true);

    try {
      const { error } = await (supabase as any)
        .from('chauffeurs')
        .update({
          service_type: detectedIssue.suggestedType,
          service_specialization: detectedIssue.suggestedSpecialization,
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ Error correcting service type:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de corriger le type de service. Veuillez contacter le support.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Correction effectuée',
          description: `Votre profil a été mis à jour en "${detectedIssue.suggestedType === 'taxi' ? 'Chauffeur Taxi' : 'Livreur'}".`,
          variant: 'default',
        });

        // Recharger la page pour appliquer les changements
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error('💥 Error in handleCorrect:', err);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la correction.',
        variant: 'destructive',
      });
    } finally {
      setIsCorrecting(false);
      setShowDialog(false);
    }
  };

  const handleIgnore = () => {
    setShowDialog(false);
    setDetectedIssue(null);
  };

  if (!detectedIssue) return null;

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <AlertDialogTitle className="text-xl">
              Incohérence détectée
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Vous êtes actuellement enregistré comme{' '}
              <strong className="text-foreground">{detectedIssue.currentType}</strong>,
              mais nous avons détecté que vous devriez probablement être{' '}
              <strong className="text-primary">
                {detectedIssue.suggestedType === 'taxi' ? 'Chauffeur Taxi' : 'Livreur'}
              </strong>.
            </p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Raison :</strong> {detectedIssue.reason}
              </p>
            </div>
            <p className="text-sm">
              Voulez-vous corriger automatiquement votre profil pour afficher la bonne interface ?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleIgnore} disabled={isCorrecting}>
            Ignorer
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCorrect}
            disabled={isCorrecting}
            className="bg-primary hover:bg-primary/90"
          >
            {isCorrecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Correction...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Corriger automatiquement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
