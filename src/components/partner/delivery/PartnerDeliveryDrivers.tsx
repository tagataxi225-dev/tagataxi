import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Package, Star, Phone, Car } from "lucide-react";
import { DeliveryDriver } from "@/hooks/usePartnerDeliveries";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  drivers: DeliveryDriver[];
  onToggleStatus: (driverId: string, isActive: boolean) => void;
  loading?: boolean;
}

const getVehicleTypeLabel = (vehicleType: string) => {
  switch (vehicleType.toLowerCase()) {
    case 'moto': return '🏍️ Moto';
    case 'car': return '🚗 Voiture';
    case 'truck': return '🚚 Camion';
    default: return vehicleType;
  }
};

export default function PartnerDeliveryDrivers({ drivers, onToggleStatus, loading }: Props) {
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Chargement des livreurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Livreurs de la flotte</CardTitle>
          <CardDescription>
            Gérez la disponibilité et suivez les performances de vos livreurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {drivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">
                Aucun livreur dans votre flotte
              </p>
              <p className="text-sm text-muted-foreground">
                Les chauffeurs doivent s'inscrire avec votre code partenaire
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'}`}>
              {drivers.map((driver) => (
                <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{driver.full_name || 'Nom inconnu'}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={driver.is_active ? "default" : "secondary"}>
                            {driver.is_active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="font-semibold">
                          {driver.average_rating ? driver.average_rating.toFixed(1) : "N/A"}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Phone */}
                    {driver.phone_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{driver.phone_number}</span>
                      </div>
                    )}

                    {/* Vehicle info */}
                    {driver.vehicle_type && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {getVehicleTypeLabel(driver.vehicle_type)}
                          </span>
                        </div>
                        {driver.license_plate && (
                          <p className="text-xs text-muted-foreground">
                            Immatriculation: {driver.license_plate}
                          </p>
                        )}
                        {driver.vehicle_class && (
                          <p className="text-xs text-muted-foreground">
                            Classe: {driver.vehicle_class}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">{driver.total_deliveries}</p>
                          <p className="text-xs text-muted-foreground">Livraisons</p>
                        </div>
                      </div>
                    </div>

                    {/* Status toggle */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm font-medium">Statut actif</span>
                      <Switch
                        checked={driver.is_active}
                        onCheckedChange={(checked) => onToggleStatus(driver.user_id, checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
