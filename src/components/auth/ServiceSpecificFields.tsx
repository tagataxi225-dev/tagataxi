import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car, Truck } from 'lucide-react';

interface ServiceSpecificFieldsProps {
  serviceCategory: 'taxi' | 'delivery';
  hasOwnVehicle: boolean;
  formData: any;
  onFieldChange: (field: string, value: any) => void;
}

export const ServiceSpecificFields: React.FC<ServiceSpecificFieldsProps> = ({
  serviceCategory,
  hasOwnVehicle,
  formData,
  onFieldChange
}) => {
  const getServiceTypeOptions = () => {
    if (serviceCategory === 'taxi') {
      return [
        { value: 'moto', label: 'Moto Taxi' },
        { value: 'eco', label: 'ECO' },
        { value: 'confort', label: 'CONFORT' },
        { value: 'premium', label: 'PREMIUM' }
      ];
    } else {
      return [
        { value: 'flash', label: 'Flash (Moto Express)' },
        { value: 'flex', label: 'Flex (Camionnette)' },
        { value: 'maxicharge', label: 'MaxiCharge (Camion)' }
      ];
    }
  };

  const getVehicleTypeOptions = () => {
    if (serviceCategory === 'taxi') {
      return [
        { value: 'voiture', label: 'Voiture' },
        { value: 'moto', label: 'Moto' }
      ];
    } else {
      return [
        { value: 'moto', label: 'Moto' },
        { value: 'voiture', label: 'Voiture' },
        { value: 'camionnette', label: 'Camionnette' },
        { value: 'camion', label: 'Camion' }
      ];
    }
  };

  return (
    <div className="space-y-6">
      {/* Type de service */}
      <Card className="overflow-visible dark:bg-gray-900/50 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 dark:text-gray-200">
            {serviceCategory === 'taxi' ? (
              <Car className="h-5 w-5" />
            ) : (
              <Truck className="h-5 w-5" />
            )}
            {serviceCategory === 'taxi' ? 'Service de transport' : 'Service de livraison'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <div className="space-y-4">
            <div className="relative z-50 overflow-visible">
              <Label htmlFor="serviceType" className="flex items-center gap-1 dark:text-gray-200">
                Type de service <span className="text-destructive">*</span>
              </Label>
              <Select 
                value={formData.serviceType} 
                onValueChange={(value) => {
                  console.log('🚗 Service Type sélectionné:', value, '| ServiceCategory:', serviceCategory);
                  console.log('📋 FormData complet après sélection:', { ...formData, serviceType: value });
                  onFieldChange('serviceType', value);
                }}
              >
                <SelectTrigger className="relative z-50 bg-background dark:bg-card/95 dark:border-border/60 dark:text-foreground">
                  <SelectValue placeholder={`Sélectionnez le type de ${serviceCategory === 'taxi' ? 'transport' : 'livraison'}`} className="dark:placeholder:text-foreground/50" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={5} className="dark:bg-card/95 dark:border-border/60 z-[100]">
                  {getServiceTypeOptions().map(option => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      className="dark:text-foreground dark:hover:bg-muted/40"
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.serviceType && (
                <p className="text-xs text-muted-foreground mt-1">
                  Ce champ est obligatoire
                </p>
              )}
            </div>

            {serviceCategory === 'delivery' && (
              <div className="relative z-50 overflow-visible">
                <Label htmlFor="deliveryCapacity" className="flex items-center gap-1 dark:text-gray-200">
                  Capacité de chargement <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.deliveryCapacity} 
                  onValueChange={(value) => {
                    console.log('📦 Capacité de livraison:', value);
                    onFieldChange('deliveryCapacity', value);
                  }}
                >
                  <SelectTrigger className="relative z-50 bg-background dark:bg-card/95 dark:border-border/60 dark:text-foreground">
                    <SelectValue placeholder="Sélectionnez la capacité" className="dark:placeholder:text-foreground/50" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="dark:bg-card/95 dark:border-border/60 z-[100]">
                    <SelectItem value="small" className="dark:text-foreground dark:hover:bg-muted/40">Petits colis (jusqu'à 10kg)</SelectItem>
                    <SelectItem value="medium" className="dark:text-foreground dark:hover:bg-muted/40">Colis moyens (jusqu'à 50kg)</SelectItem>
                    <SelectItem value="large" className="dark:text-foreground dark:hover:bg-muted/40">Gros colis (jusqu'à 200kg)</SelectItem>
                    <SelectItem value="extra-large" className="dark:text-foreground dark:hover:bg-muted/40">Très gros colis (plus de 200kg)</SelectItem>
                  </SelectContent>
                </Select>
                {!formData.deliveryCapacity && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce champ est obligatoire
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations véhicule si propriétaire */}
      {hasOwnVehicle && (
        <Card className="overflow-visible dark:bg-gray-900/50 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Informations du véhicule</CardTitle>
          </CardHeader>
          <CardContent className="overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative z-50 overflow-visible">
                <Label htmlFor="vehicleType" className="flex items-center gap-1 dark:text-gray-200">
                  Type de véhicule <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.vehicleType} 
                  onValueChange={(value) => {
                    console.log('🚙 Type de véhicule sélectionné:', value, '| ServiceCategory:', serviceCategory);
                    console.log('📋 FormData après sélection véhicule:', { ...formData, vehicleType: value });
                    onFieldChange('vehicleType', value);
                  }}
                >
                  <SelectTrigger className="relative z-50 bg-background dark:bg-card/95 dark:border-border/60 dark:text-foreground">
                    <SelectValue placeholder="Type de véhicule" className="dark:placeholder:text-foreground/50" />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5} className="dark:bg-card/95 dark:border-border/60 z-[100]">
                    {getVehicleTypeOptions().map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="dark:text-foreground dark:hover:bg-muted/40"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!formData.vehicleType && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce champ est obligatoire
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="vehicleMake" className="dark:text-gray-200">Marque *</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake}
                  onChange={(e) => onFieldChange('vehicleMake', e.target.value)}
                  placeholder="Ex: Toyota, Honda"
                  required={hasOwnVehicle}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="vehicleModel" className="dark:text-gray-200">Modèle *</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) => onFieldChange('vehicleModel', e.target.value)}
                  placeholder="Ex: Corolla, Civic"
                  required={hasOwnVehicle}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="vehicleYear" className="dark:text-gray-200">Année *</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  value={formData.vehicleYear}
                  onChange={(e) => onFieldChange('vehicleYear', parseInt(e.target.value))}
                  placeholder="Ex: 2020"
                  min="1990"
                  max={new Date().getFullYear()}
                  required={hasOwnVehicle}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="vehiclePlate" className="dark:text-gray-200">Plaque d'immatriculation *</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) => onFieldChange('vehiclePlate', e.target.value.toUpperCase())}
                  placeholder="Ex: CD-123-ABC"
                  required={hasOwnVehicle}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="vehicleColor" className="dark:text-gray-200">Couleur</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor}
                  onChange={(e) => onFieldChange('vehicleColor', e.target.value)}
                  placeholder="Ex: Rouge, Blanc"
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="insuranceNumber" className="dark:text-gray-200">Numéro d'assurance *</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => onFieldChange('insuranceNumber', e.target.value)}
                  placeholder="Numéro de police d'assurance"
                  required={hasOwnVehicle}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="insuranceExpiry" className="dark:text-gray-200">Expiration assurance</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) => onFieldChange('insuranceExpiry', e.target.value)}
                  className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};