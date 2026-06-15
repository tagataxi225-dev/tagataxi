import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Eye, Calendar, DollarSign, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface PendingVehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    brand: string;
    model: string;
    year: number;
    daily_rate: number;
    currency: string;
    city?: string;
    images?: string[];
    created_at: string;
    partner_name?: string;
    category_name?: string;
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (id: string) => void;
  isLoading?: boolean;
}

export const PendingVehicleCard = ({ 
  vehicle, 
  onApprove, 
  onReject, 
  onViewDetails,
  isLoading 
}: PendingVehicleCardProps) => {
  const imageUrl = vehicle.images?.[0] || '/placeholder.svg';
  
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="w-full md:w-48 h-48 bg-muted relative">
          <img 
            src={imageUrl} 
            alt={vehicle.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          {vehicle.category_name && (
            <Badge className="absolute top-2 right-2 bg-primary">
              {vehicle.category_name}
            </Badge>
          )}
        </div>

        {/* Infos */}
        <div className="flex-1 p-4 space-y-3">
          <div>
            <h3 className="text-lg font-bold">{vehicle.name}</h3>
            <p className="text-sm text-muted-foreground">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>{vehicle.daily_rate} CDF/jour</span>
            </div>
            {vehicle.city && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{vehicle.city}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-muted-foreground col-span-2">
              <Calendar className="h-4 w-4" />
              <span>
                Soumis {formatDistanceToNow(new Date(vehicle.created_at), { 
                  addSuffix: true, 
                  locale: fr 
                })}
              </span>
            </div>
          </div>

          {vehicle.partner_name && (
            <p className="text-xs text-muted-foreground">
              👤 Partenaire: <strong>{vehicle.partner_name}</strong>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex md:flex-col gap-2 p-4 border-t md:border-t-0 md:border-l">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(vehicle.id)}
            className="flex-1 md:flex-none"
            disabled={isLoading}
          >
            <Eye className="h-4 w-4 mr-1" />
            Détails
          </Button>
          <Button
            size="sm"
            variant="default"
            onClick={() => onApprove(vehicle.id)}
            className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Approuver
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onReject(vehicle.id)}
            className="flex-1 md:flex-none"
            disabled={isLoading}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Rejeter
          </Button>
        </div>
      </div>
    </Card>
  );
};