import React from 'react';
import { Car, MapPin, Fuel, Users, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface Vehicle {
  id: string;
  model: string;
  plate: string;
  driver: string;
  status: string;
  mileage: string;
  fuel: number;
  color: string;
}

interface ResponsiveVehicleGridProps {
  vehicles: Vehicle[];
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (vehicleId: string) => void;
}

export const ResponsiveVehicleGrid: React.FC<ResponsiveVehicleGridProps> = ({
  vehicles,
  onEdit,
  onDelete
}) => {
  const isMobile = useIsMobile();

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
      {vehicles.map((vehicle, index) => (
        <Card 
          key={vehicle.id} 
          className="card-floating border-0 hover:shadow-lg transition-all duration-200"
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={`w-12 h-12 ${vehicle.color} rounded-xl flex items-center justify-center shadow-sm flex-shrink-0`}>
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`font-semibold text-card-foreground truncate ${isMobile ? 'text-sm' : 'text-body-md'}`}>
                    {vehicle.model}
                  </p>
                  <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-body-sm'}`}>
                    {vehicle.plate}
                  </p>
                </div>
              </div>
              <Badge 
                variant={
                  vehicle.status === "Disponible" ? "default" :
                  vehicle.status === "En course" ? "secondary" : "outline"
                }
                className={`rounded-md flex-shrink-0 ${isMobile ? 'text-xs' : ''}`}
              >
                {vehicle.status}
              </Badge>
            </div>

            <div className={`grid gap-3 mb-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-body-sm'}`}>
                  {vehicle.mileage}
                </span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Fuel className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-body-sm'}`}>
                  {vehicle.fuel}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-body-sm'}`}>
                  {vehicle.driver}
                </span>
              </div>
              
              {(onEdit || onDelete) && (
                <div className="flex gap-1 flex-shrink-0">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(vehicle)}
                      className={`rounded-lg ${isMobile ? 'h-8 w-8 p-0' : 'h-9 px-3'}`}
                    >
                      <Edit className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Modifier</span>}
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(vehicle.id)}
                      className={`rounded-lg text-destructive hover:text-destructive ${isMobile ? 'h-8 w-8 p-0' : 'h-9 px-3'}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      {!isMobile && <span className="ml-1">Supprimer</span>}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};