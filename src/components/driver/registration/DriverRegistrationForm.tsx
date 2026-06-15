import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Car, Package } from 'lucide-react';
import { ServiceCategory } from './ServiceCategorySelector';
import { VehicleOwnershipSelector } from '@/components/auth/VehicleOwnershipSelector';
import { useServiceConfigurations } from '@/hooks/useServiceConfigurations';

interface DriverRegistrationFormProps {
  serviceCategory: ServiceCategory;
  serviceType: string;
  onSubmit: (data: DriverRegistrationData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export interface DriverRegistrationData {
  // Informations personnelles
  displayName: string;
  phoneNumber: string;
  email: string;
  password: string;
  
  // Informations du permis
  licenseNumber: string;
  licenseExpiry: string;
  
  // Informations du véhicule - Optionnelles si pas de véhicule propre
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  vehicleColor?: string;
  
  // Assurance - Optionnel si pas de véhicule propre
  insuranceNumber?: string;
  insuranceExpiry?: string;
  
  // Informations spécifiques
  deliveryCapacity?: string;
  bankAccountNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  
  // Conditions
  acceptsTerms: boolean;
  
  serviceCategory: ServiceCategory;
  serviceType: string;
  hasOwnVehicle: boolean; // Nouveau champ pour distinguer les modes
}

export const DriverRegistrationForm: React.FC<DriverRegistrationFormProps> = ({
  serviceCategory,
  serviceType,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const { configurations } = useServiceConfigurations();
  
  const [formData, setFormData] = useState<Partial<DriverRegistrationData>>({
    serviceCategory,
    serviceType,
    acceptsTerms: false,
    hasOwnVehicle: false, // Par défaut: cherche un partenaire
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName?.trim()) {
      newErrors.displayName = 'Nom complet requis';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    if (!formData.password?.trim()) {
      newErrors.password = 'Mot de passe requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Numéro de téléphone requis';
    }
    if (!formData.licenseNumber?.trim()) {
      newErrors.licenseNumber = 'Numéro de permis requis';
    }
    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = 'Date d\'expiration du permis requise';
    }

    if (!formData.acceptsTerms) {
      newErrors.acceptsTerms = 'Vous devez accepter les conditions';
    }

    // Validation spécifique pour les livreurs
    if (serviceCategory === 'delivery') {
      if (!formData.deliveryCapacity) {
        newErrors.deliveryCapacity = 'Capacité de livraison requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData as DriverRegistrationData);
    }
  };

  const updateField = (field: keyof DriverRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Obtenir les services disponibles pour la catégorie sélectionnée
  const availableServices = configurations.filter(config => config.service_category === serviceCategory);
  
  // Pour les capacités de livraison, retourner les options standard
  const getDeliveryCapacities = () => {
    return [
      { value: 'small', label: 'Petite capacité (jusqu\'à 5kg)' },
      { value: 'medium', label: 'Capacité moyenne (5-15kg)' },
      { value: 'large', label: 'Grande capacité (15kg+)' }
    ];
  };
  
  const deliveryCapacities = getDeliveryCapacities();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          {serviceCategory === 'taxi' ? (
            <Car className="h-6 w-6 text-primary" />
          ) : (
            <Package className="h-6 w-6 text-primary" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Inscription {serviceCategory === 'taxi' ? 'Chauffeur' : 'Livreur'}
            </h2>
            <p className="text-sm text-muted-foreground">
              Service: {serviceType}
            </p>
          </div>
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayName">Nom complet *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName || ''}
                  onChange={(e) => updateField('displayName', e.target.value)}
                  placeholder="Votre nom complet"
                  className={errors.displayName ? 'border-destructive' : ''}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive mt-1">{errors.displayName}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Téléphone *</Label>
                <Input
                  id="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => updateField('phoneNumber', e.target.value)}
                  placeholder="+243 xxx xxx xxx"
                  className={errors.phoneNumber ? 'border-destructive' : ''}
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="votre@email.com"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password || ''}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContactName">Contact d'urgence</Label>
                <Input
                  id="emergencyContactName"
                  value={formData.emergencyContactName || ''}
                  onChange={(e) => updateField('emergencyContactName', e.target.value)}
                  placeholder="Nom du contact"
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyContactPhone">Téléphone d'urgence</Label>
                <Input
                  id="emergencyContactPhone"
                  value={formData.emergencyContactPhone || ''}
                  onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                  placeholder="+243 xxx xxx xxx"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations du permis */}
        <Card>
          <CardHeader>
            <CardTitle>Informations du permis de conduire</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenseNumber">Numéro de permis *</Label>
                <Input
                  id="licenseNumber"
                  value={formData.licenseNumber || ''}
                  onChange={(e) => updateField('licenseNumber', e.target.value)}
                  placeholder="Numéro de permis"
                  className={errors.licenseNumber ? 'border-destructive' : ''}
                />
                {errors.licenseNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.licenseNumber}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="licenseExpiry">Date d'expiration *</Label>
                <Input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry || ''}
                  onChange={(e) => updateField('licenseExpiry', e.target.value)}
                  className={errors.licenseExpiry ? 'border-destructive' : ''}
                />
                {errors.licenseExpiry && (
                  <p className="text-sm text-destructive mt-1">{errors.licenseExpiry}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sélecteur de mode de véhicule */}
        <Card>
          <CardHeader>
            <CardTitle>Statut du véhicule</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleOwnershipSelector
              selectedMode={formData.hasOwnVehicle ? 'own' : 'partner'}
              onModeSelect={(mode) => updateField('hasOwnVehicle', mode === 'own')}
              serviceCategory={serviceCategory}
            />
          </CardContent>
        </Card>

        {/* Informations du véhicule - Affichées seulement si le chauffeur a son propre véhicule */}
        {formData.hasOwnVehicle && (
          <Card>
            <CardHeader>
              <CardTitle>Informations du véhicule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Type de service</Label>
                  <Select
                    value={formData.vehicleType}
                    onValueChange={(value) => updateField('vehicleType', value)}
                  >
                    <SelectTrigger className={errors.vehicleType ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Sélectionnez le type de service" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border shadow-lg z-[60] pointer-events-auto">
                      {availableServices.map((service) => (
                        <SelectItem key={service.service_type} value={service.service_type}>
                          {service.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

              {serviceCategory === 'delivery' && (
                  <div>
                    <Label htmlFor="deliveryCapacity">Capacité de livraison *</Label>
                    <Select
                      value={formData.deliveryCapacity}
                      onValueChange={(value) => updateField('deliveryCapacity', value)}
                    >
                      <SelectTrigger className={errors.deliveryCapacity ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Sélectionnez la capacité" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border shadow-lg z-[60] pointer-events-auto">
                        {deliveryCapacities.map((capacity) => (
                          <SelectItem key={capacity.value} value={capacity.value}>
                            {capacity.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.deliveryCapacity && (
                      <p className="text-sm text-destructive mt-1">{errors.deliveryCapacity}</p>
                    )}
                  </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleMake">Marque</Label>
                <Input
                  id="vehicleMake"
                  value={formData.vehicleMake || ''}
                  onChange={(e) => updateField('vehicleMake', e.target.value)}
                  placeholder="Toyota, Honda..."
                  className={errors.vehicleMake ? 'border-destructive' : ''}
                />
                {errors.vehicleMake && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleMake}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vehicleModel">Modèle</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel || ''}
                  onChange={(e) => updateField('vehicleModel', e.target.value)}
                  placeholder="Corolla, Civic..."
                  className={errors.vehicleModel ? 'border-destructive' : ''}
                />
                {errors.vehicleModel && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleModel}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vehicleYear">Année</Label>
                <Input
                  id="vehicleYear"
                  type="number"
                  min="2000"
                  max={new Date().getFullYear()}
                  value={formData.vehicleYear || ''}
                  onChange={(e) => updateField('vehicleYear', parseInt(e.target.value))}
                  placeholder="2020"
                  className={errors.vehicleYear ? 'border-destructive' : ''}
                />
                {errors.vehicleYear && (
                  <p className="text-sm text-destructive mt-1">{errors.vehicleYear}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehiclePlate">Plaque d'immatriculation</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate || ''}
                  onChange={(e) => updateField('vehiclePlate', e.target.value)}
                  placeholder="ABC-123"
                  className={errors.vehiclePlate ? 'border-destructive' : ''}
                />
                {errors.vehiclePlate && (
                  <p className="text-sm text-destructive mt-1">{errors.vehiclePlate}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="vehicleColor">Couleur</Label>
                <Input
                  id="vehicleColor"
                  value={formData.vehicleColor || ''}
                  onChange={(e) => updateField('vehicleColor', e.target.value)}
                  placeholder="Blanc, Noir..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Informations d'assurance - Affichées seulement si le chauffeur a son propre véhicule */}
        {formData.hasOwnVehicle && (
        <Card>
          <CardHeader>
            <CardTitle>Assurance véhicule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceNumber">Numéro d'assurance</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber || ''}
                  onChange={(e) => updateField('insuranceNumber', e.target.value)}
                  placeholder="Numéro de police"
                  className={errors.insuranceNumber ? 'border-destructive' : ''}
                />
                {errors.insuranceNumber && (
                  <p className="text-sm text-destructive mt-1">{errors.insuranceNumber}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="insuranceExpiry">Date d'expiration</Label>
                <Input
                  id="insuranceExpiry"
                  type="date"
                  value={formData.insuranceExpiry || ''}
                  onChange={(e) => updateField('insuranceExpiry', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Informations bancaires */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de paiement (Optionnel)</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="bankAccountNumber">Numéro de compte bancaire</Label>
              <Input
                id="bankAccountNumber"
                value={formData.bankAccountNumber || ''}
                onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                placeholder="Pour les virements de gains"
              />
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardContent className="pt-6">
            <LegalAcceptanceCheckbox
              checked={formData.acceptsTerms}
              onCheckedChange={(checked) => updateField('acceptsTerms', checked)}
              accentColor="amber"
            />
            {errors.acceptsTerms && (
              <p className="text-sm text-destructive mt-2">{errors.acceptsTerms}</p>
            )}
          </CardContent>
        </Card>

        {Object.keys(errors).length > 0 && (
          <Alert>
            <AlertDescription>
              Veuillez corriger les erreurs ci-dessus avant de continuer.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          Retour
        </Button>
        
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? 'Inscription en cours...' : 'Finaliser l\'inscription'}
        </Button>
      </div>
    </form>
  );
};