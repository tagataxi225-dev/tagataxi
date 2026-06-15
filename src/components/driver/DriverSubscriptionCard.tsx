import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';
import { useDriverSubscriptions } from '@/hooks/useDriverSubscriptions';
import { useDriverServiceType } from '@/hooks/useDriverServiceType';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const DriverSubscriptionCard: React.FC = () => {
  const { currentSubscription, loading } = useDriverSubscriptions();
  const { serviceType } = useDriverServiceType();

  // ✅ PHASE 3: Vocabulaire adapté selon le service
  const vocabulary = {
    rides: serviceType === 'delivery' ? 'livraisons' : 'courses',
    ride: serviceType === 'delivery' ? 'livraison' : 'course',
    accept: serviceType === 'delivery' ? 'accepter des livraisons' : 'accepter des courses',
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="h-8 bg-muted rounded animate-pulse" />
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentSubscription) {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-destructive">Aucun abonnement actif</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vous devez souscrire à un abonnement pour {vocabulary.accept}
            </p>
          </div>
          <Button className="w-full">
            Choisir un abonnement
          </Button>
        </CardContent>
      </Card>
    );
  }

  const plan = currentSubscription.subscription_plans;
  const ridesUsed = plan?.max_rides_per_day - currentSubscription.rides_remaining;
  const progress = (currentSubscription.rides_remaining / (plan?.max_rides_per_day || 1)) * 100;
  const isLowCredits = currentSubscription.rides_remaining <= 5;
  const daysUntilExpiry = Math.ceil(
    (new Date(currentSubscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card className={isLowCredits ? 'border-orange-500/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Mon Abonnement
          </span>
          <Badge variant={isLowCredits ? 'destructive' : 'default'}>
            {currentSubscription.status === 'active' ? 'Actif' : 'Inactif'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Name */}
        <div>
          <p className="text-sm text-muted-foreground">Plan actuel</p>
          <p className="font-semibold text-lg">{plan?.name || 'Plan Standard'}</p>
        </div>

        {/* Rides Remaining - BIG NUMBER */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground mb-2">{vocabulary.rides.charAt(0).toUpperCase() + vocabulary.rides.slice(1)} restantes</p>
          <p className={`text-5xl font-bold ${
            isLowCredits ? 'text-orange-500' : 'text-primary'
          }`}>
            {currentSubscription.rides_remaining}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            sur {plan?.max_rides_per_day || 0} {vocabulary.rides}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress 
            value={progress} 
            className={`h-2 ${isLowCredits ? 'bg-orange-100' : ''}`}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Utilisées</p>
            <p className="text-lg font-semibold">{ridesUsed}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">Restantes</p>
            <p className="text-lg font-semibold">{currentSubscription.rides_remaining}</p>
          </div>
        </div>

        {/* Expiration */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Expire dans</span>
          </div>
          <span className={`font-medium ${daysUntilExpiry <= 3 ? 'text-orange-500' : ''}`}>
            {daysUntilExpiry} jours
          </span>
        </div>

        {/* Low Credits Warning */}
        {isLowCredits && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Crédits faibles
            </p>
            <p className="text-xs text-orange-800 dark:text-orange-200 mt-1">
              Il vous reste seulement {currentSubscription.rides_remaining} {vocabulary.rides}. Renouvelez votre abonnement.
            </p>
          </div>
        )}

        {/* Renew Button */}
        <Button 
          className="w-full" 
          variant={isLowCredits ? 'default' : 'outline'}
          disabled={currentSubscription.rides_remaining > 5}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Renouveler l'abonnement
        </Button>

        {/* Auto-renew status */}
        {currentSubscription.auto_renew && (
          <p className="text-xs text-center text-muted-foreground">
            ✅ Renouvellement automatique activé
          </p>
        )}
      </CardContent>
    </Card>
  );
};
