import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertTriangle, RefreshCw, ArrowUpCircle, XCircle, Truck, Car } from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { VehicleSubscription } from '@/hooks/useRentalVehicleSubscription';
import { cn } from '@/lib/utils';

interface VehicleSubscriptionCardProps {
  subscription: VehicleSubscription;
  onRenew: (id: string) => void;
  onUpgrade: (id: string) => void;
  onCancel: (id: string) => void;
  isProcessing?: boolean;
}

export const VehicleSubscriptionCard: React.FC<VehicleSubscriptionCardProps> = ({
  subscription,
  onRenew,
  onUpgrade,
  onCancel,
  isProcessing = false
}) => {
  const endDate = new Date(subscription.end_date);
  const daysRemaining = differenceInDays(endDate, new Date());
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  const getStatusBadge = () => {
    if (isExpired) {
      return <Badge variant="destructive">Expiré</Badge>;
    }
    if (isExpiringSoon) {
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Expire bientôt
      </Badge>;
    }
    if (subscription.status === 'active') {
      return <Badge variant="default" className="bg-green-500">Actif</Badge>;
    }
    if (subscription.status === 'cancelled') {
      return <Badge variant="secondary">Annulé</Badge>;
    }
    return <Badge variant="outline">{subscription.status}</Badge>;
  };

  const getTierColor = (tier?: string) => {
    switch (tier?.toUpperCase()) {
      case 'PLATINUM': return 'from-purple-500 to-indigo-600';
      case 'GOLD': return 'from-amber-400 to-yellow-500';
      case 'SILVER': return 'from-gray-400 to-slate-500';
      default: return 'from-blue-400 to-cyan-500';
    }
  };

  const isTruckCategory = subscription.category_name?.includes('Camion') || 
                          subscription.category_name === 'Semi-Remorque';

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300",
      isExpiringSoon && "ring-2 ring-amber-500/50",
      isExpired && "opacity-75"
    )}>
      {/* Tier gradient bar */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
        getTierColor(subscription.tier_name)
      )} />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isTruckCategory ? (
              <Truck className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Car className="h-5 w-5 text-muted-foreground" />
            )}
            <CardTitle className="text-base">
              {subscription.vehicle_name || 'Véhicule non assigné'}
            </CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground">
          {subscription.category_name} • {subscription.tier_name}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Expiration info */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className={cn(
            isExpired && "text-destructive",
            isExpiringSoon && "text-amber-600"
          )}>
            {isExpired 
              ? `Expiré le ${format(endDate, 'dd MMM yyyy', { locale: fr })}`
              : `Expire ${formatDistanceToNow(endDate, { locale: fr, addSuffix: true })}`
            }
          </span>
        </div>

        {/* Days remaining */}
        {!isExpired && subscription.status === 'active' && (
          <div className="bg-muted/50 rounded-lg p-2 text-center">
            <span className={cn(
              "text-2xl font-bold",
              isExpiringSoon ? "text-amber-600" : "text-primary"
            )}>
              {daysRemaining}
            </span>
            <span className="text-sm text-muted-foreground ml-1">jours restants</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {subscription.status === 'active' && (
            <>
              <Button 
                variant="default" 
                size="sm" 
                className="flex-1"
                onClick={() => onRenew(subscription.id)}
                disabled={isProcessing}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Renouveler
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onUpgrade(subscription.id)}
                disabled={isProcessing}
              >
                <ArrowUpCircle className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onCancel(subscription.id)}
                disabled={isProcessing}
                className="text-destructive hover:text-destructive"
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </>
          )}
          {(isExpired || subscription.status === 'cancelled') && (
            <Button 
              variant="default" 
              size="sm" 
              className="w-full"
              onClick={() => onRenew(subscription.id)}
              disabled={isProcessing}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Réactiver l'abonnement
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
