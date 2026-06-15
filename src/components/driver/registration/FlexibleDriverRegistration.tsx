import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Car, 
  Users, 
  Package, 
  MapPin, 
  Clock, 
  Shield,
  CheckCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react'
import { useDriverVehicleAssociations } from '@/hooks/useDriverVehicleAssociations'
import { useToast } from '@/hooks/use-toast'

const SERVICE_TYPES = [
  { id: 'taxi', label: 'Transport de passagers (Taxi)', icon: Users, description: 'Transport urbain de personnes' },
  { id: 'delivery', label: 'Livraison', icon: Package, description: 'Livraison de colis et objets' },
  { id: 'transport', label: 'Transport mixte', icon: Car, description: 'Transport et livraison' }
]

const VEHICLE_CLASSES = [
  { id: 'economic', label: 'Économique', description: 'Véhicules standards, tarifs abordables' },
  { id: 'standard', label: 'Standard', description: 'Confort standard, bon rapport qualité-prix' },
  { id: 'premium', label: 'Premium', description: 'Véhicules haut de gamme, service premium' }
]

const ZONES = [
  'Kinshasa', 'Lubumbashi', 'Kolwezi', 'Abidjan'
]

const SPECIAL_SERVICES = [
  { id: 'wheelchair_accessible', label: 'Accessible PMR' },
  { id: 'pet_friendly', label: 'Animaux acceptés' },
  { id: 'child_seat', label: 'Siège enfant disponible' },
  { id: 'large_capacity', label: 'Grande capacité' }
]

interface FlexibleDriverRegistrationProps {
  onComplete: () => void
}

export const FlexibleDriverRegistration: React.FC<FlexibleDriverRegistrationProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [vehicleMode, setVehicleMode] = useState<'own' | 'partner'>('own')
  const [formData, setFormData] = useState({
    // Informations personnelles
    personalInfo: {
      licenseNumber: '',
      licenseExpiry: '',
      emergencyContact: '',
      emergencyPhone: ''
    },
    
    // Véhicule propre
    ownVehicle: {
      make: '',
      model: '',
      year: new Date().getFullYear(),
      plate: '',
      color: '',
      vehicle_class: 'standard',
      insurance_number: '',
      insurance_expiry: ''
    },

    // Association partenaire
    partnerInfo: {
      partnerId: '',
      partnerCode: '',
      preferredVehicleClass: 'standard'
    },

    // Préférences de service
    servicePreferences: {
      service_types: ['taxi'] as string[],
      preferred_zones: ['Kinshasa'] as string[],
      vehicle_classes: ['standard'] as string[],
      max_distance_km: 50,
      special_services: [] as string[],
      languages: ['fr'] as string[]
    }
  })

  const { 
    createOwnVehicleAssociation, 
    createPartnerVehicleAssociation, 
    updateServicePreferences,
    loading 
  } = useDriverVehicleAssociations()
  const { toast } = useToast()

  const handleServiceTypeChange = (serviceType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicePreferences: {
        ...prev.servicePreferences,
        service_types: checked 
          ? [...prev.servicePreferences.service_types, serviceType]
          : prev.servicePreferences.service_types.filter(t => t !== serviceType)
      }
    }))
  }

  const handleSpecialServiceChange = (service: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicePreferences: {
        ...prev.servicePreferences,
        special_services: checked 
          ? [...prev.servicePreferences.special_services, service]
          : prev.servicePreferences.special_services.filter(s => s !== service)
      }
    }))
  }

  const handleZoneChange = (zone: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      servicePreferences: {
        ...prev.servicePreferences,
        preferred_zones: checked 
          ? [...prev.servicePreferences.preferred_zones, zone]
          : prev.servicePreferences.preferred_zones.filter(z => z !== zone)
      }
    }))
  }

  const handleSubmit = async () => {
    try {
      // Sauvegarder les préférences de service
      await updateServicePreferences.mutateAsync(formData.servicePreferences)

      // Créer l'association véhicule
      if (vehicleMode === 'own') {
        await createOwnVehicleAssociation.mutateAsync(formData.ownVehicle)
      } else {
        await createPartnerVehicleAssociation.mutateAsync({
          partnerId: formData.partnerInfo.partnerId
        })
      }

      toast({
        title: "Inscription complétée",
        description: "Votre profil chauffeur a été créé avec succès. Vous recevrez une notification une fois votre demande approuvée.",
      })

      onComplete()
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold">Informations du permis</h3>
        <p className="text-muted-foreground">Vos informations de conduite et d'urgence</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="licenseNumber">Numéro de permis *</Label>
          <Input
            id="licenseNumber"
            value={formData.personalInfo.licenseNumber}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, licenseNumber: e.target.value }
            }))}
            placeholder="Ex: KIN123456789"
          />
        </div>

        <div>
          <Label htmlFor="licenseExpiry">Date d'expiration *</Label>
          <Input
            id="licenseExpiry"
            type="date"
            value={formData.personalInfo.licenseExpiry}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, licenseExpiry: e.target.value }
            }))}
          />
        </div>

        <div>
          <Label htmlFor="emergencyContact">Contact d'urgence *</Label>
          <Input
            id="emergencyContact"
            value={formData.personalInfo.emergencyContact}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, emergencyContact: e.target.value }
            }))}
            placeholder="Nom complet"
          />
        </div>

        <div>
          <Label htmlFor="emergencyPhone">Téléphone d'urgence *</Label>
          <Input
            id="emergencyPhone"
            value={formData.personalInfo.emergencyPhone}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, emergencyPhone: e.target.value }
            }))}
            placeholder="+243 XXX XXX XXX"
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Car className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold">Mode de travail</h3>
        <p className="text-muted-foreground">Choisissez comment vous souhaitez travailler</p>
      </div>

      <RadioGroup value={vehicleMode} onValueChange={(value: 'own' | 'partner') => setVehicleMode(value)}>
        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <RadioGroupItem value="own" id="own" />
          <Label htmlFor="own" className="flex-1 cursor-pointer">
            <div className="font-medium">J'ai mon propre véhicule</div>
            <div className="text-sm text-muted-foreground">
              Utilisez votre véhicule personnel pour travailler
            </div>
          </Label>
        </div>

        <div className="flex items-center space-x-2 p-4 border rounded-lg">
          <RadioGroupItem value="partner" id="partner" />
          <Label htmlFor="partner" className="flex-1 cursor-pointer">
            <div className="font-medium">J'utilise les véhicules d'un partenaire</div>
            <div className="text-sm text-muted-foreground">
              Travaillez avec la flotte d'un partenaire agréé
            </div>
          </Label>
        </div>
      </RadioGroup>

      {vehicleMode === 'own' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations de votre véhicule</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="make">Marque *</Label>
              <Input
                id="make"
                value={formData.ownVehicle.make}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, make: e.target.value }
                }))}
                placeholder="Ex: Toyota"
              />
            </div>

            <div>
              <Label htmlFor="model">Modèle *</Label>
              <Input
                id="model"
                value={formData.ownVehicle.model}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, model: e.target.value }
                }))}
                placeholder="Ex: Corolla"
              />
            </div>

            <div>
              <Label htmlFor="year">Année *</Label>
              <Input
                id="year"
                type="number"
                value={formData.ownVehicle.year}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, year: parseInt(e.target.value) }
                }))}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label htmlFor="plate">Plaque d'immatriculation *</Label>
              <Input
                id="plate"
                value={formData.ownVehicle.plate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, plate: e.target.value.toUpperCase() }
                }))}
                placeholder="Ex: KIN-123-ABC"
              />
            </div>

            <div>
              <Label htmlFor="color">Couleur</Label>
              <Input
                id="color"
                value={formData.ownVehicle.color}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, color: e.target.value }
                }))}
                placeholder="Ex: Blanc"
              />
            </div>

            <div>
              <Label htmlFor="insurance">Numéro d'assurance *</Label>
              <Input
                id="insurance"
                value={formData.ownVehicle.insurance_number}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, insurance_number: e.target.value }
                }))}
                placeholder="Numéro de police"
              />
            </div>

            <div>
              <Label htmlFor="insuranceExpiry">Expiration assurance *</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                value={formData.ownVehicle.insurance_expiry}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, insurance_expiry: e.target.value }
                }))}
              />
            </div>

            <div>
              <Label>Classe de véhicule</Label>
              <RadioGroup 
                value={formData.ownVehicle.vehicle_class} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  ownVehicle: { ...prev.ownVehicle, vehicle_class: value }
                }))}
              >
                {VEHICLE_CLASSES.map((vClass) => (
                  <div key={vClass.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={vClass.id} id={vClass.id} />
                    <Label htmlFor={vClass.id} className="cursor-pointer">
                      <div className="font-medium">{vClass.label}</div>
                      <div className="text-sm text-muted-foreground">{vClass.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {vehicleMode === 'partner' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Code partenaire</CardTitle>
            <CardDescription>
              Entrez le code fourni par votre partenaire pour vous associer à sa flotte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="partnerCode">Code partenaire *</Label>
              <Input
                id="partnerCode"
                value={formData.partnerInfo.partnerCode}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  partnerInfo: { ...prev.partnerInfo, partnerCode: e.target.value.toUpperCase() }
                }))}
                placeholder="Ex: PARTNER123"
              />
            </div>

            <div>
              <Label>Classe de véhicule préférée</Label>
              <RadioGroup 
                value={formData.partnerInfo.preferredVehicleClass} 
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  partnerInfo: { ...prev.partnerInfo, preferredVehicleClass: value }
                }))}
              >
                {VEHICLE_CLASSES.map((vClass) => (
                  <div key={vClass.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={vClass.id} id={`partner-${vClass.id}`} />
                    <Label htmlFor={`partner-${vClass.id}`} className="cursor-pointer">
                      <div className="font-medium">{vClass.label}</div>
                      <div className="text-sm text-muted-foreground">{vClass.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MapPin className="mx-auto h-12 w-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold">Préférences de service</h3>
        <p className="text-muted-foreground">Définissez vos préférences de travail</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Types de services</CardTitle>
          <CardDescription>Sélectionnez les services que vous souhaitez proposer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {SERVICE_TYPES.map((service) => {
            const Icon = service.icon
            return (
              <div key={service.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={service.id}
                  checked={formData.servicePreferences.service_types.includes(service.id)}
                  onCheckedChange={(checked) => handleServiceTypeChange(service.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label htmlFor={service.id} className="flex items-center gap-2 cursor-pointer">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{service.label}</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Zones de travail préférées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {ZONES.map((zone) => (
              <div key={zone} className="flex items-center space-x-2">
                <Checkbox
                  id={zone}
                  checked={formData.servicePreferences.preferred_zones.includes(zone)}
                  onCheckedChange={(checked) => handleZoneChange(zone, checked as boolean)}
                />
                <Label htmlFor={zone} className="cursor-pointer">{zone}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Services spéciaux</CardTitle>
          <CardDescription>Services additionnels que vous pouvez proposer (optionnel)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SPECIAL_SERVICES.map((service) => (
              <div key={service.id} className="flex items-center space-x-2">
                <Checkbox
                  id={service.id}
                  checked={formData.servicePreferences.special_services.includes(service.id)}
                  onCheckedChange={(checked) => handleSpecialServiceChange(service.id, checked as boolean)}
                />
                <Label htmlFor={service.id} className="cursor-pointer">{service.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Distance maximale</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="maxDistance">Distance maximale de course (km)</Label>
            <Input
              id="maxDistance"
              type="number"
              value={formData.servicePreferences.max_distance_km}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                servicePreferences: { ...prev.servicePreferences, max_distance_km: parseInt(e.target.value) || 50 }
              }))}
              min="5"
              max="200"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderStepNavigation = () => (
    <div className="flex justify-between items-center pt-6">
      <Button
        variant="outline"
        onClick={() => setCurrentStep(prev => prev - 1)}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Précédent
      </Button>

      <div className="flex space-x-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`w-2 h-2 rounded-full ${
              step === currentStep ? 'bg-primary' : step < currentStep ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {currentStep < 3 ? (
        <Button onClick={() => setCurrentStep(prev => prev + 1)}>
          Suivant
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      ) : (
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Création...' : 'Terminer l\'inscription'}
          <CheckCircle className="h-4 w-4 ml-2" />
        </Button>
      )}
    </div>
  )

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Inscription Chauffeur Flexible</CardTitle>
        <CardDescription className="text-center">
          Étape {currentStep} sur 3: {
            currentStep === 1 ? 'Informations personnelles' :
            currentStep === 2 ? 'Configuration véhicule' :
            'Préférences de service'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        
        {renderStepNavigation()}
      </CardContent>
    </Card>
  )
}