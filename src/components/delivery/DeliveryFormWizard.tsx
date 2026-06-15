import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import StableLocationPicker from './StableLocationPicker';
import RobustPriceCalculator from './RobustPriceCalculator';
import ServiceSelector from './ServiceSelector';
import type { UnifiedLocation } from '@/types/locationAdapter';
import { 
  ArrowLeft, 
  ArrowRight, 
  MapPin, 
  Target, 
  Package,
  User,
  Phone,
  FileText,
  CheckCircle2,
  Truck
} from 'lucide-react';

interface ContactInfo {
  name: string;
  phone: string;
}

interface DeliveryData {
  pickup: {
    location: UnifiedLocation | null;
    contact: ContactInfo;
  };
  destination: {
    location: UnifiedLocation | null;
    contact: ContactInfo;
  };
  service: 'flash' | 'flex' | 'maxicharge';
  packageInfo: {
    description: string;
    weight: string;
    value: string;
  };
  specialInstructions: string;
}

interface PriceBreakdown {
  basePrice: number;
  distancePrice: number;
  cityMultiplier: number;
  totalPrice: number;
  distance: number;
  duration: number;
  currency: 'CDF' | 'XOF';
}

interface DeliveryFormWizardProps {
  onSubmit: (data: DeliveryData & { pricing: PriceBreakdown }) => void;
  onCancel: () => void;
  city?: string;
}

type WizardStep = 'pickup' | 'destination' | 'service' | 'details' | 'confirmation';

const DeliveryFormWizard: React.FC<DeliveryFormWizardProps> = ({
  onSubmit,
  onCancel,
  city = 'Kinshasa'
}) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>('pickup');
  const [direction, setDirection] = useState(0);
  const [pricing, setPricing] = useState<PriceBreakdown | null>(null);
  
  const [formData, setFormData] = useState<DeliveryData>({
    pickup: {
      location: null,
      contact: { name: '', phone: '' }
    },
    destination: {
      location: null,
      contact: { name: '', phone: '' }
    },
    service: 'flex',
    packageInfo: {
      description: '',
      weight: '',
      value: ''
    },
    specialInstructions: ''
  });

  // Configuration des étapes
  const steps: { id: WizardStep; title: string; description: string; icon: any }[] = [
    { id: 'pickup', title: 'Point de collecte', description: 'Où récupérer le colis', icon: MapPin },
    { id: 'destination', title: 'Destination', description: 'Où livrer le colis', icon: Target },
    { id: 'service', title: 'Service', description: 'Type de livraison', icon: Truck },
    { id: 'details', title: 'Détails', description: 'Informations du colis', icon: Package },
    { id: 'confirmation', title: 'Confirmation', description: 'Vérifier et confirmer', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // Navigation
  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setDirection(1);
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setDirection(-1);
      setCurrentStep(steps[prevIndex].id);
    }
  };

  // Validation par étape
  const canProceed = () => {
    switch (currentStep) {
      case 'pickup':
        return !!(
          formData.pickup.location &&
          formData.pickup.contact.name.trim() &&
          formData.pickup.contact.phone.trim()
        );
      case 'destination':
        return !!(
          formData.destination.location &&
          formData.destination.contact.name.trim()
        );
      case 'service':
        return !!formData.service;
      case 'details':
        return !!(
          formData.packageInfo.description.trim() &&
          formData.packageInfo.weight.trim()
        );
      case 'confirmation':
        return !!pricing;
      default:
        return false;
    }
  };

  // Gestion des changements
  const updatePickupLocation = (location: UnifiedLocation) => {
    setFormData(prev => ({
      ...prev,
      pickup: { ...prev.pickup, location }
    }));
  };

  const updateDestinationLocation = (location: UnifiedLocation) => {
    setFormData(prev => ({
      ...prev,
      destination: { ...prev.destination, location }
    }));
  };

  const updatePickupContact = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      pickup: {
        ...prev.pickup,
        contact: { ...prev.pickup.contact, [field]: value }
      }
    }));
  };

  const updateDestinationContact = (field: keyof ContactInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      destination: {
        ...prev.destination,
        contact: { ...prev.destination.contact, [field]: value }
      }
    }));
  };

  const updateService = (service: 'flash' | 'flex' | 'maxicharge') => {
    setFormData(prev => ({ ...prev, service }));
  };

  const updatePackageInfo = (field: keyof DeliveryData['packageInfo'], value: string) => {
    setFormData(prev => ({
      ...prev,
      packageInfo: { ...prev.packageInfo, [field]: value }
    }));
  };

  // Soumission finale
  const handleSubmit = async () => {
    if (pricing && formData.pickup.location && formData.destination.location) {
      try {
        const deliveryData = {
          city: city,
          pickup: {
            address: formData.pickup.location.address,
            lat: formData.pickup.location.lat,
            lng: formData.pickup.location.lng,
            type: formData.pickup.location.type
          },
          destination: {
            address: formData.destination.location.address,
            lat: formData.destination.location.lat,
            lng: formData.destination.location.lng,
            type: formData.destination.location.type
          },
          mode: formData.service,
          packageType: formData.packageInfo.description,
          weight: parseFloat(formData.packageInfo.weight) || 0,
          specialInstructions: formData.specialInstructions,
          estimatedPrice: pricing.totalPrice,
          distance: pricing.distance,
          duration: pricing.duration
        };

        onSubmit({ ...formData, pricing });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de préparer la commande",
          variant: "destructive"
        });
      }
    }
  };

  // Animations
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  // Rendu des étapes
  const renderStep = () => {
    switch (currentStep) {
      case 'pickup':
        return (
          <div className="space-y-6">
            <StableLocationPicker
              type="pickup"
              onLocationSelect={updatePickupLocation}
              selectedLocation={formData.pickup.location}
              showCurrentLocation={true}
              autoFocus={true}
            />
            
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact au point de collecte
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom complet *</label>
                    <Input
                      value={formData.pickup.contact.name}
                      onChange={(e) => updatePickupContact('name', e.target.value)}
                      placeholder="Nom de la personne"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <Input
                      value={formData.pickup.contact.phone}
                      onChange={(e) => updatePickupContact('phone', e.target.value)}
                      placeholder="+243 xxx xxx xxx"
                      className="h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'destination':
        return (
          <div className="space-y-6">
            <StableLocationPicker
              type="destination"
              onLocationSelect={updateDestinationLocation}
              selectedLocation={formData.destination.location}
              showCurrentLocation={false}
              autoFocus={true}
            />
            
            <Card>
              <CardContent className="p-4 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Contact à la destination
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom du destinataire *</label>
                    <Input
                      value={formData.destination.contact.name}
                      onChange={(e) => updateDestinationContact('name', e.target.value)}
                      placeholder="Nom du destinataire"
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone (optionnel)</label>
                    <Input
                      value={formData.destination.contact.phone}
                      onChange={(e) => updateDestinationContact('phone', e.target.value)}
                      placeholder="+243 xxx xxx xxx"
                      className="h-12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'service':
        return (
          <ServiceSelector
            selectedService={formData.service}
            onServiceSelect={updateService}
          />
        );

      case 'details':
        return (
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informations du colis
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Description du colis *</label>
                  <Input
                    value={formData.packageInfo.description}
                    onChange={(e) => updatePackageInfo('description', e.target.value)}
                    placeholder="Ex: Documents, vêtements, électronique..."
                    className="h-12"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Poids approximatif *</label>
                    <Input
                      value={formData.packageInfo.weight}
                      onChange={(e) => updatePackageInfo('weight', e.target.value)}
                      placeholder="Ex: 2kg, 10kg..."
                      className="h-12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Valeur (optionnel)</label>
                    <Input
                      value={formData.packageInfo.value}
                      onChange={(e) => updatePackageInfo('value', e.target.value)}
                      placeholder="Ex: 50000 FC"
                      className="h-12"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Instructions spéciales (optionnel)</label>
                  <Textarea
                    value={formData.specialInstructions}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    placeholder="Précisions particulières pour la livraison..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 'confirmation':
        return (
          <div className="space-y-6">
            <RobustPriceCalculator
              pickup={formData.pickup.location}
              destination={formData.destination.location}
              serviceType={formData.service}
              onPriceCalculated={setPricing}
              city={city}
            />
            
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg">Résumé de la commande</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Collecte chez {formData.pickup.contact.name}</p>
                      <p className="text-muted-foreground">{formData.pickup.location?.address}</p>
                      <p className="text-muted-foreground">{formData.pickup.contact.phone}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Target className="h-4 w-4 text-secondary mt-0.5" />
                    <div>
                      <p className="font-medium">Livraison à {formData.destination.contact.name}</p>
                      <p className="text-muted-foreground">{formData.destination.location?.address}</p>
                      {formData.destination.contact.phone && (
                        <p className="text-muted-foreground">{formData.destination.contact.phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Package className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{formData.packageInfo.description}</p>
                      <p className="text-muted-foreground">Poids: {formData.packageInfo.weight}</p>
                      {formData.packageInfo.value && (
                        <p className="text-muted-foreground">Valeur: {formData.packageInfo.value}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {formData.specialInstructions && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">
                      <strong>Instructions:</strong> {formData.specialInstructions}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={currentStepIndex > 0 ? prevStep : onCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {currentStepIndex > 0 ? 'Retour' : 'Annuler'}
            </Button>
            
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Nouvelle livraison
            </h1>
            
            <div className="w-20" />
          </div>
          
          <Progress value={progress} className="w-full h-2 mb-4" />
          
          <div className="text-center">
            <h2 className="text-lg font-semibold">{steps[currentStepIndex].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[currentStepIndex].description}</p>
          </div>
        </div>

        {/* Contenu des étapes */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={currentStepIndex > 0 ? prevStep : onCancel}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStepIndex > 0 ? 'Précédent' : 'Annuler'}
          </Button>
          
          {currentStep === 'confirmation' ? (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmer la commande
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryFormWizard;