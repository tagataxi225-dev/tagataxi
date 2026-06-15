import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { LegalAcceptanceCheckbox } from '@/components/shared/LegalAcceptanceCheckbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface DriverPersonalDataFormProps {
  serviceCategory: 'taxi' | 'delivery';
  serviceType: string;
  onSubmit: (data: any) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export const DriverPersonalDataForm: React.FC<DriverPersonalDataFormProps> = ({
  serviceCategory,
  serviceType,
  onSubmit,
  onBack,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    dateOfBirth: undefined as Date | undefined,
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    address: '',
    
    // Permis de conduire
    licenseNumber: '',
    licenseExpiry: undefined as Date | undefined,
    licenseCategory: '',
    
    // Véhicule
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehiclePlate: '',
    vehicleColor: '',
    
    // Assurance
    insuranceNumber: '',
    insuranceExpiry: undefined as Date | undefined,
    
    // Documents
    hasProfilePhoto: false,
    hasLicensePhoto: false,
    hasVehiclePhoto: false,
    hasInsuranceDoc: false,
    
    // Conditions
    acceptsTerms: false,
    acceptsDataProcessing: false,
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (!formData.acceptsTerms || !formData.acceptsDataProcessing) {
      alert('Veuillez accepter les conditions d\'utilisation et le traitement des données');
      return;
    }

    onSubmit({
      ...formData,
      serviceCategory,
      serviceType,
    });
  };

  const currentYear = new Date().getFullYear();
  const vehicleYears = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Finaliser votre inscription
        </h2>
        <p className="text-muted-foreground">
          Service: <span className="font-medium">{serviceType}</span> 
          {' '}({serviceCategory === 'taxi' ? 'Chauffeur' : 'Livreur'})
        </p>
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
              <Label htmlFor="firstName">Prénom *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nom *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date de naissance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateOfBirth ? format(formData.dateOfBirth, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfBirth}
                    onSelect={(date) => handleInputChange('dateOfBirth', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="phone">Téléphone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+243 XXX XXX XXX"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Adresse complète"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergencyContactName">Contact d'urgence (Nom)</Label>
              <Input
                id="emergencyContactName"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="emergencyContactPhone">Contact d'urgence (Téléphone)</Label>
              <Input
                id="emergencyContactPhone"
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permis de conduire */}
      <Card>
        <CardHeader>
          <CardTitle>Permis de conduire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="licenseNumber">Numéro de permis *</Label>
              <Input
                id="licenseNumber"
                value={formData.licenseNumber}
                onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Date d'expiration *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.licenseExpiry && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.licenseExpiry ? format(formData.licenseExpiry, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.licenseExpiry}
                    onSelect={(date) => handleInputChange('licenseExpiry', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div>
            <Label htmlFor="licenseCategory">Catégorie de permis</Label>
            <Select value={formData.licenseCategory} onValueChange={(value) => handleInputChange('licenseCategory', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">A - Moto</SelectItem>
                <SelectItem value="B">B - Voiture</SelectItem>
                <SelectItem value="C">C - Camion</SelectItem>
                <SelectItem value="D">D - Transport en commun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Véhicule */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleMake">Marque *</Label>
              <Input
                id="vehicleMake"
                value={formData.vehicleMake}
                onChange={(e) => handleInputChange('vehicleMake', e.target.value)}
                placeholder="Toyota, Honda, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="vehicleModel">Modèle *</Label>
              <Input
                id="vehicleModel"
                value={formData.vehicleModel}
                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                placeholder="Corolla, Civic, etc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="vehicleYear">Année</Label>
              <Select value={formData.vehicleYear.toString()} onValueChange={(value) => handleInputChange('vehicleYear', parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="vehiclePlate">Plaque d'immatriculation *</Label>
              <Input
                id="vehiclePlate"
                value={formData.vehiclePlate}
                onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                placeholder="XXX-XXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="vehicleColor">Couleur</Label>
              <Input
                id="vehicleColor"
                value={formData.vehicleColor}
                onChange={(e) => handleInputChange('vehicleColor', e.target.value)}
                placeholder="Rouge, Blanc, etc."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assurance */}
      <Card>
        <CardHeader>
          <CardTitle>Assurance véhicule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insuranceNumber">Numéro d'assurance *</Label>
              <Input
                id="insuranceNumber"
                value={formData.insuranceNumber}
                onChange={(e) => handleInputChange('insuranceNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Date d'expiration *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.insuranceExpiry && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.insuranceExpiry ? format(formData.insuranceExpiry, "dd/MM/yyyy") : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.insuranceExpiry}
                    onSelect={(date) => handleInputChange('insuranceExpiry', date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Documents requis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Cochez les documents que vous avez prêts à télécharger:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasProfilePhoto"
                checked={formData.hasProfilePhoto}
                onCheckedChange={(checked) => handleInputChange('hasProfilePhoto', checked)}
              />
              <Label htmlFor="hasProfilePhoto" className="text-sm">
                Photo de profil
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasLicensePhoto"
                checked={formData.hasLicensePhoto}
                onCheckedChange={(checked) => handleInputChange('hasLicensePhoto', checked)}
              />
              <Label htmlFor="hasLicensePhoto" className="text-sm">
                Photo du permis de conduire
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasVehiclePhoto"
                checked={formData.hasVehiclePhoto}
                onCheckedChange={(checked) => handleInputChange('hasVehiclePhoto', checked)}
              />
              <Label htmlFor="hasVehiclePhoto" className="text-sm">
                Photo du véhicule
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasInsuranceDoc"
                checked={formData.hasInsuranceDoc}
                onCheckedChange={(checked) => handleInputChange('hasInsuranceDoc', checked)}
              />
              <Label htmlFor="hasInsuranceDoc" className="text-sm">
                Document d'assurance
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Conditions d'utilisation</CardTitle>
        </CardHeader>
        <CardContent>
          <LegalAcceptanceCheckbox
            checked={formData.acceptsTerms}
            onCheckedChange={(checked) => handleInputChange('acceptsTerms', checked)}
            accentColor="amber"
            id="acceptsTerms"
            showDataProcessing
            dataProcessingChecked={formData.acceptsDataProcessing}
            onDataProcessingChange={(checked) => handleInputChange('acceptsDataProcessing', checked)}
          />
        </CardContent>
      </Card>

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
          disabled={isLoading || !formData.acceptsTerms || !formData.acceptsDataProcessing}
        >
          {isLoading ? 'Inscription en cours...' : 'Finaliser l\'inscription'}
        </Button>
      </div>
    </form>
  );
};