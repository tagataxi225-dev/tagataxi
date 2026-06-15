import React from 'react';
import { DollarSign, Calendar, User, Car } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface CommissionHistoryCardProps {
  commission: {
    id: string;
    activity_type: string;
    description: string;
    amount: number | null;
    currency: string | null;
    created_at: string;
    metadata: any;
  };
}

export const CommissionHistoryCard: React.FC<CommissionHistoryCardProps> = ({ commission }) => {
  const isSubscription = commission.activity_type === 'subscription_payment_received';

  const getCommissionType = () => {
    if (isSubscription) {
      return {
        label: 'Abonnement',
        icon: Car,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      };
    }
    return {
      label: 'Commission',
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    };
  };

  const type = getCommissionType();
  const Icon = type.icon;

  return (
    <Card className="card-floating border-0 hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Icône et type */}
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${type.bgColor}`}>
              <Icon className={`h-5 w-5 ${type.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`${type.bgColor} ${type.color} border-0`}>
                  {type.label}
                </Badge>
              </div>
              <p className="text-body-md font-medium text-card-foreground truncate">
                {commission.description}
              </p>
              <div className="flex items-center gap-4 mt-2 text-caption text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: fr })}
                </div>
                <div className="flex items-center gap-1">
                  <span>{format(new Date(commission.created_at), 'HH:mm')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Montant */}
          <div className="text-right">
            <p className="text-heading-md font-bold text-green-600">
              +{(commission.amount || 0).toLocaleString()} {commission.currency || 'CDF'}
            </p>
            <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
              Payée
            </Badge>
          </div>
        </div>

        {/* Métadonnées supplémentaires si disponibles */}
        {commission.metadata && Object.keys(commission.metadata).length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="grid grid-cols-2 gap-2 text-caption">
              {commission.metadata.driver_name && (
                <div>
                  <span className="text-muted-foreground">Chauffeur: </span>
                  <span className="text-card-foreground font-medium">
                    {commission.metadata.driver_name}
                  </span>
                </div>
              )}
              {commission.metadata.vehicle_plate && (
                <div>
                  <span className="text-muted-foreground">Véhicule: </span>
                  <span className="text-card-foreground font-medium">
                    {commission.metadata.vehicle_plate}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
