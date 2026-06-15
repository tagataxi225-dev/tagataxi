import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Car, Bike, Edit, RefreshCw } from 'lucide-react';
import { useVehicleTypeConfig, VehicleTypeConfig } from '@/hooks/admin/useVehicleTypeConfig';
import { EditVehicleTypeModal } from './EditVehicleTypeModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];

export const VehicleTypeConfigManager = () => {
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [editingVehicle, setEditingVehicle] = useState<VehicleTypeConfig | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { vehicleTypes, isLoading, refetch, updateConfig, updatePricing } = useVehicleTypeConfig(selectedCity);

  const getIcon = (serviceType: string) => {
    if (serviceType === 'taxi_moto') return Bike;
    return Car;
  };

  const handleEdit = (vehicle: VehicleTypeConfig) => {
    setEditingVehicle(vehicle);
    setModalOpen(true);
  };

  const handleToggleActive = (vehicle: VehicleTypeConfig) => {
    updateConfig.mutate({
      serviceType: vehicle.service_type,
      displayName: vehicle.display_name,
      description: vehicle.description,
      isActive: !vehicle.is_active
    });
  };

  const handleSave = (updates: {
    displayName: string;
    description: string;
    isActive: boolean;
    basePrice: number;
    pricePerKm: number;
    minimumFare: number;
  }) => {
    if (!editingVehicle) return;

    // Mettre à jour la configuration
    updateConfig.mutate({
      serviceType: editingVehicle.service_type,
      displayName: updates.displayName,
      description: updates.description,
      isActive: updates.isActive
    });

    // Mettre à jour les tarifs
    if (editingVehicle.pricing_id) {
      updatePricing.mutate({
        pricingId: editingVehicle.pricing_id,
        basePrice: updates.basePrice,
        pricePerKm: updates.pricePerKm,
        minimumFare: updates.minimumFare
      });
    }

    setModalOpen(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestion des Types de Véhicules</CardTitle>
              <CardDescription>
                Configurez les types de véhicules et leurs tarifs par ville
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <label className="text-sm font-medium mb-2 block">Ville</label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!vehicleTypes || vehicleTypes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun type de véhicule configuré pour {selectedCity}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicleTypes.map((vehicle) => {
                const Icon = getIcon(vehicle.service_type);

                return (
                  <div
                    key={vehicle.service_type}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{vehicle.display_name}</h3>
                        {vehicle.is_active ? (
                          <Badge variant="default" className="text-xs">Actif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {vehicle.description}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Base: {vehicle.base_price} {vehicle.currency}</span>
                        <span>Par km: {vehicle.price_per_km} {vehicle.currency}</span>
                        <span>Minimum: {vehicle.minimum_fare} {vehicle.currency}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={vehicle.is_active}
                        onCheckedChange={() => handleToggleActive(vehicle)}
                        disabled={updateConfig.isPending}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(vehicle)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EditVehicleTypeModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vehicleType={editingVehicle}
        onSave={handleSave}
      />
    </>
  );
};
