/**
 * 🚨 Alerte Abonnement Épuisé
 * Affiche une alerte visuelle quand le chauffeur n'a plus de courses disponibles
 */

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, CreditCard, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SubscriptionDepletedAlertProps {
  ridesRemaining: number;
  subscriptionStatus: string;
  planName?: string;
  onRenew?: () => void;
  className?: string;
}

export default function SubscriptionDepletedAlert({
  ridesRemaining,
  subscriptionStatus,
  planName,
  onRenew,
  className
}: SubscriptionDepletedAlertProps) {
  const navigate = useNavigate();

  // Ne pas afficher si le chauffeur a encore des courses
  if (ridesRemaining > 5) return null;

  // Déterminer le niveau d'urgence
  const isDeplet = ridesRemaining === 0;
  const isCritical = ridesRemaining <= 2 && ridesRemaining > 0;
  const isWarning = ridesRemaining > 2 && ridesRemaining <= 5;

  const handleRenewClick = () => {
    if (onRenew) {
      onRenew();
    } else {
      navigate('/driver?tab=subscription');
    }
  };

  // 🚨 ABONNEMENT ÉPUISÉ (0 courses)
  if (isDeplet) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Alert className="border-2 border-destructive bg-destructive/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive animate-pulse" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-destructive text-lg font-bold mb-2">
                ⚠️ Abonnement épuisé
              </AlertTitle>
              <AlertDescription className="text-destructive/90 space-y-3">
                <p className="font-medium">
                  Vous ne pouvez plus accepter de courses. Renouvelez votre abonnement pour continuer.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="destructive" className="text-sm">
                    {ridesRemaining} course{ridesRemaining > 1 ? 's' : ''} restante{ridesRemaining > 1 ? 's' : ''}
                  </Badge>
                  {planName && (
                    <Badge variant="outline" className="text-sm">
                      Plan: {planName}
                    </Badge>
                  )}
                  <Badge 
                    variant={subscriptionStatus === 'expired' ? 'destructive' : 'outline'}
                    className="text-sm"
                  >
                    {subscriptionStatus === 'expired' ? 'Expiré' : 'Actif'}
                  </Badge>
                </div>
              </AlertDescription>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={handleRenewClick}
              className="flex-1 gap-2 bg-destructive hover:bg-destructive/90"
            >
              <Zap className="h-4 w-4" />
              Renouveler maintenant
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      </motion.div>
    );
  }

  // 🔴 CRITIQUE (1-2 courses)
  if (isCritical) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Alert className="border-2 border-warning bg-warning/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <AlertTitle className="text-warning font-bold mb-1">
                Abonnement presque épuisé
              </AlertTitle>
              <AlertDescription className="text-warning/90">
                <p className="text-sm mb-2">
                  Plus que <strong>{ridesRemaining} course{ridesRemaining > 1 ? 's' : ''}</strong> disponible{ridesRemaining > 1 ? 's' : ''}. 
                  Pensez à renouveler.
                </p>
              </AlertDescription>
            </div>
          </div>
          
          <Button 
            onClick={handleRenewClick}
            variant="outline"
            size="sm"
            className="mt-3 w-full border-warning text-warning hover:bg-warning/10"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Voir les abonnements
          </Button>
        </Alert>
      </motion.div>
    );
  }

  // 🟡 AVERTISSEMENT (3-5 courses)
  if (isWarning) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <Alert className="border border-info/50 bg-info/5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-info" />
            <div className="flex-1">
              <AlertDescription className="text-info text-sm">
                Plus que <strong>{ridesRemaining} courses</strong> disponibles sur votre abonnement
              </AlertDescription>
            </div>
            <Button 
              onClick={handleRenewClick}
              variant="ghost"
              size="sm"
              className="text-info hover:bg-info/10"
            >
              Renouveler
            </Button>
          </div>
        </Alert>
      </motion.div>
    );
  }

  return null;
}
