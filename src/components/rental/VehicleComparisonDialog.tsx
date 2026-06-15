import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Car, Users, Fuel, Cog, Calendar, Clock, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  images: string[];
  seats: number;
  fuel_type: string;
  transmission: string;
  comfort_level: string;
  equipment: string[];
  hourly_rate: number;
  daily_rate: number;
  city: string;
}

interface VehicleComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicles: Vehicle[];
  onRemove: (vehicleId: string) => void;
  onBook: (vehicleId: string) => void;
}

export const VehicleComparisonDialog = ({
  open,
  onOpenChange,
  vehicles,
  onRemove,
  onBook,
}: VehicleComparisonDialogProps) => {
  if (vehicles.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comparaison de véhicules ({vehicles.length})</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => onRemove(vehicle.id)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              <CardContent className="p-4 space-y-4">
                {/* Image */}
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  {vehicle.images[0] ? (
                    <img
                      src={vehicle.images[0]}
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Car className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className="absolute bottom-2 right-2">
                    {vehicle.comfort_level}
                  </Badge>
                </div>

                {/* Nom */}
                <div>
                  <h3 className="font-bold text-lg">{vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {vehicle.brand} {vehicle.model} ({vehicle.year})
                  </p>
                </div>

                {/* Spécifications */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      Places
                    </span>
                    <span className="font-semibold">{vehicle.seats}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Fuel className="h-4 w-4" />
                      Carburant
                    </span>
                    <span className="font-semibold">{vehicle.fuel_type}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Cog className="h-4 w-4" />
                      Transmission
                    </span>
                    <span className="font-semibold">{vehicle.transmission}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Tarif horaire
                    </span>
                    <span className="font-semibold text-primary">
                      {vehicle.hourly_rate.toLocaleString()} CDF
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Tarif journalier
                    </span>
                    <span className="font-semibold text-primary">
                      {vehicle.daily_rate.toLocaleString()} CDF
                    </span>
                  </div>
                </div>

                {/* Équipements */}
                <div>
                  <p className="text-sm font-medium mb-2">Équipements</p>
                  <div className="flex flex-wrap gap-1">
                    {vehicle.equipment.slice(0, 4).map((eq) => (
                      <Badge key={eq} variant="secondary" className="text-xs">
                        {eq.replace('_', ' ')}
                      </Badge>
                    ))}
                    {vehicle.equipment.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{vehicle.equipment.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action */}
                <Button
                  className="w-full"
                  onClick={() => {
                    onBook(vehicle.id);
                    onOpenChange(false);
                  }}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Réserver
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
