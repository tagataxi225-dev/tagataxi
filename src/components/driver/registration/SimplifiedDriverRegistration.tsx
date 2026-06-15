import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { toast } from 'sonner';
import { useDriverRegistration } from '@/hooks/useDriverRegistration';
import { VehicleOwnershipSelector } from '@/components/auth/VehicleOwnershipSelector';
import { ServiceSpecificFields } from '@/components/auth/ServiceSpecificFields';

interface SimplifiedDriverRegistrationProps {
  serviceCategory: 'taxi' | 'delivery';
  onBack: () => void;
  onSuccess: () => void;
}

export const SimplifiedDriverRegistration: React.FC<SimplifiedDriverRegistrationProps> = ({
  serviceCategory,
  onBack,
  onSuccess
}) => {
  const { registerDriver, isRegistering } = useDriverRegistration();
  const [vehicleMode, setVehicleMode] = useState<'own' | 'partner' | null>(null);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    phoneNumber: '',
    licenseNumber: '',
    licenseExpiry: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    serviceCategory,
    serviceType: '',
    hasOwnVehicle: false,
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlate: '',
    vehicleColor: '',
    insuranceNumber: '',
    insuranceExpiry: '',
    deliveryCapacity: '',
    acceptsTerms: false
  });

  // Debug: tracker les changements de formData
  useEffect(() => {
    console.log('🔄 FormData mis à jour:', formData);
  }, [formData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVehicleModeSelect = (mode: 'own' | 'partner') => {
    setVehicleMode(mode);
    setFormData(prev => ({
      ...prev,
      hasOwnVehicle: mode === 'own'
    }));
  };

  const validateForm = () => {
    if (!vehicleMode) {
      toast.error('Veuillez choisir si vous avez un véhicule ou cherchez un partenaire');
      return false;
    }

    if (!formData.displayName || !formData.email || !formData.password || 
        !formData.phoneNumber || !formData.licenseNumber || !formData.licenseExpiry) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return false;
    }

    // Validation du type de service (obligatoire)
    if (!formData.serviceType) {
      toast.error('Veuillez sélectionner un type de service');
      return false;
    }

    // Validation de la capacité de livraison pour les livreurs
    if (serviceCategory === 'delivery' && !formData.deliveryCapacity) {
      toast.error('Veuillez sélectionner une capacité de chargement');
      return false;
    }

    if (vehicleMode === 'own') {
      if (!formData.vehicleType) {
        toast.error('Veuillez sélectionner un type de véhicule');
        return false;
      }
      if (!formData.vehicleMake || !formData.vehicleModel || 
          !formData.vehiclePlate || !formData.insuranceNumber || !formData.insuranceExpiry) {
        toast.error('Veuillez remplir toutes les informations du véhicule');
        return false;
      }
    }

    if (!formData.acceptsTerms) {
      toast.error('Veuillez accepter les conditions d\'utilisation');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('📦 Données d\'inscription soumises:', {
      serviceType: formData.serviceType,
      vehicleType: formData.vehicleType,
      deliveryCapacity: formData.deliveryCapacity,
      hasOwnVehicle: formData.hasOwnVehicle,
      serviceCategory: formData.serviceCategory,
      allData: formData
    });

    if (!validateForm()) {
      return;
    }

    try {
      const result = await registerDriver(formData);
      if (result.success) {
        if (result.hasOwnVehicle) {
          toast.success('Inscription réussie ! Votre compte est en attente de vérification.');
        } else {
          toast.success('Inscription réussie ! Redirection vers la recherche de partenaires.');
          // Redirect to partner search page
          window.location.href = '/driver/find-partner';
        }
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 overflow-visible">
      <Card className="overflow-visible dark:bg-gray-900/50 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-center dark:text-gray-200">
            Inscription {serviceCategory === 'taxi' ? 'Chauffeur' : 'Livreur'}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection mode véhicule */}
            {!vehicleMode && (
              <VehicleOwnershipSelector
                selectedMode={vehicleMode}
                onModeSelect={handleVehicleModeSelect}
                serviceCategory={serviceCategory}
              />
            )}

            {vehicleMode && (
              <>
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold dark:text-gray-200">Informations personnelles</h3>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setVehicleMode(null)}
                    >
                      Modifier le choix véhicule
                    </Button>
                  </div>
                  
                  <div>
                    <Label htmlFor="displayName" className="dark:text-gray-200">Nom complet *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleFieldChange('displayName', e.target.value)}
                      required
                      className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="dark:text-gray-200">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        required
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="dark:text-gray-200">Mot de passe *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleFieldChange('password', e.target.value)}
                        required
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber" className="dark:text-gray-200">Numéro de téléphone *</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                      placeholder="+243 XXX XXX XXX"
                      required
                      className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Informations du permis */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold dark:text-gray-200">Permis de conduire</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="licenseNumber" className="dark:text-gray-200">Numéro de permis *</Label>
                      <Input
                        id="licenseNumber"
                        value={formData.licenseNumber}
                        onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                        required
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="licenseExpiry" className="dark:text-gray-200">Date d'expiration *</Label>
                      <Input
                        id="licenseExpiry"
                        type="date"
                        value={formData.licenseExpiry}
                        onChange={(e) => handleFieldChange('licenseExpiry', e.target.value)}
                        required
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Champs spécifiques au service et véhicule */}
                <ServiceSpecificFields
                  serviceCategory={serviceCategory}
                  hasOwnVehicle={vehicleMode === 'own'}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                />

                {/* Contact d'urgence */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold dark:text-gray-200">Contact d'urgence</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContactName" className="dark:text-gray-200">Nom du contact</Label>
                      <Input
                        id="emergencyContactName"
                        value={formData.emergencyContactName}
                        onChange={(e) => handleFieldChange('emergencyContactName', e.target.value)}
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyContactPhone" className="dark:text-gray-200">Téléphone du contact</Label>
                      <Input
                        id="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleFieldChange('emergencyContactPhone', e.target.value)}
                        placeholder="+243 XXX XXX XXX"
                        className="dark:bg-gray-800/50 dark:border-gray-600 dark:text-gray-100"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditions d'utilisation */}
                <LegalAcceptanceCheckbox
                  checked={formData.acceptsTerms}
                  onCheckedChange={(checked) => handleFieldChange('acceptsTerms', checked)}
                  accentColor="amber"
                  id="acceptsTerms"
                />

                {/* Boutons */}
                <div className="flex gap-4 pt-6">
                  <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                    Retour
                  </Button>
                  <Button type="submit" disabled={isRegistering} className="flex-1">
                    {isRegistering ? 'Inscription en cours...' : 'Finaliser l\'inscription'}
                  </Button>
                </div>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};