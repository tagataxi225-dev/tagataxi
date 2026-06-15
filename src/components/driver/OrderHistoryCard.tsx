import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, DollarSign, Star, Package, Car } from 'lucide-react';

interface OrderHistoryCardProps {
  order: {
    id: string;
    service_type: 'transport' | 'delivery';
    status: string;
    pickup_location: string;
    destination_location: string;
    actual_price: number;
    rating?: number;
    created_at: string;
    duration_minutes?: number;
  };
}

export const OrderHistoryCard: React.FC<OrderHistoryCardProps> = ({ order }) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive', label: string, className?: string }> = {
      completed: { variant: 'default', label: 'Complétée', className: 'bg-green-500' },
      delivered: { variant: 'default', label: 'Livrée', className: 'bg-green-500' },
      cancelled: { variant: 'destructive', label: 'Annulée' },
      default: { variant: 'secondary', label: status },
    };

    const config = variants[status] || variants.default;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icône du service */}
          <div className={`p-2 rounded-lg ${
            order.service_type === 'transport' 
              ? 'bg-blue-50 text-blue-600' 
              : 'bg-orange-50 text-orange-600'
          }`}>
            {order.service_type === 'transport' ? (
              <Car className="h-5 w-5" />
            ) : (
              <Package className="h-5 w-5" />
            )}
          </div>

          {/* Détails de la course */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  #{order.id.slice(0, 8)}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Trajet */}
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm line-clamp-1">{order.pickup_location}</p>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm line-clamp-1">{order.destination_location}</p>
              </div>
            </div>

            {/* Infos complémentaires */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">{order.actual_price?.toLocaleString() || 0} CDF</span>
              </div>

              {order.duration_minutes && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{order.duration_minutes} min</span>
                </div>
              )}

              {order.rating && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="h-4 w-4 fill-current" />
                  <span>{order.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderHistoryCard;
