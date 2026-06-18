/**
 * Interface de livraison moderne - 3 étapes fluides
 * Design soft-modern épuré, minimaliste et professionnel
 */

import React, { useState, useEffect } from 'react';
import { MapPin, Package, ArrowLeft, Check, User, Phone as PhoneIcon, ArrowDown, Clock, ChevronRight } from 'lucide-react';
import flashIcon from '@/assets/vehicle-icons/d-moto.svg';
import flexIcon from '@/assets/vehicle-icons/d-flex.svg';
import maxiIcon from '@/assets/vehicle-icons/d-maxi.svg';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import DestinationSearchDialog from '@/components/transport/DestinationSearchDialog';
import DeliveryServicesCarousel from './DeliveryServicesCarousel';
import { LocationData } from '@/types/location';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { universalGeolocation } from '@/services/universalGeolocation';
import { motion, AnimatePresence } from 'framer-motion';
import { useDeliveryPricing } from '@/hooks/useDeliveryPricing';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { cn } from '@/lib/utils';

interface SlideDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface DeliveryData {
  pickupLocation: LocationData | null;
  deliveryLocation: LocationData | null;
  serviceType: 'flash' | 'flex' | 'maxicharge';
  packageType: string;
  estimatedPrice: number;
  senderName: string;
  senderPhone: string;
  recipientName: string;
  recipientPhone: string;
}

const SERVICE_TYPES = {
  flash:      { name: 'Flash', icon3d: flashIcon, description: 'Express 5-15 min',      color: 'text-amber-500'  },
  flex:       { name: 'Flex',  icon3d: flexIcon,  description: 'Camionnette 30-60 min', color: 'text-primary'    },
  maxicharge: { name: 'Maxi',  icon3d: maxiIcon,  description: 'Gros colis 1-3h',       color: 'text-purple-500' },
};

const getPackageTypes = (t: any) => [
  t('delivery.package_documents'),
  t('delivery.package_electronics'),
  t('delivery.package_clothes'),
  t('delivery.package_food'),
  t('delivery.package_medicines'),
  t('delivery.package_other')
];

type Step = 'addresses' | 'details' | 'confirm';

export default function SlideDeliveryInterface({ onSubmit, onCancel }: SlideDeliveryInterfaceProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  const { user } = useAuth();
  const packageTypes = getPackageTypes(t);
  
  const { currentCity } = useSmartGeolocation();
  const detectedCityName = currentCity?.name?.toLowerCase() || 'abidjan';
  const { calculateDeliveryPrice, getServicePricing } = useDeliveryPricing(detectedCityName);
  
  // Devise dynamique selon la ville détectée
  const currency = detectedCityName.includes('abidjan') ? 'XOF' : 'XOF';
  const phonePrefix = detectedCityName.includes('abidjan') ? '+225' : '+243';
  
  const [currentStep, setCurrentStep] = useState<Step>('addresses');
  const [deliveryData, setDeliveryData] = useState<DeliveryData>({
    pickupLocation: null,
    deliveryLocation: null,
    serviceType: 'flex',
    packageType: packageTypes[0],
    estimatedPrice: 3000,
    senderName: user?.user_metadata?.display_name || '',
    senderPhone: user?.user_metadata?.phone_number || '',
    recipientName: '',
    recipientPhone: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchOpen, setSearchOpen] = useState<null | 'pickup' | 'delivery'>(null);

  const calculateDistance = (point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number => {
    const R = 6371000;
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  useEffect(() => {
    if (deliveryData.pickupLocation && deliveryData.deliveryLocation) {
      const distanceMeters = calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation);
      const distanceKm = distanceMeters / 1000;
      const priceCalculation = calculateDeliveryPrice(deliveryData.serviceType, distanceKm);
      setDeliveryData(prev => ({ ...prev, estimatedPrice: priceCalculation.totalPrice }));
    }
  }, [deliveryData.pickupLocation, deliveryData.deliveryLocation, deliveryData.serviceType, calculateDeliveryPrice]);

  const handleLocationSelect = async (location: LocationData, type: 'pickup' | 'delivery') => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      toast({ title: t('delivery.invalid_address'), variant: "destructive" });
      return;
    }

    const currentCity = await universalGeolocation.detectUserCity({ lat: location.lat, lng: location.lng });
    const isInServiceArea = universalGeolocation.isWithinCityBounds({ lat: location.lat, lng: location.lng }, currentCity);

    if (!isInServiceArea) {
      toast({ title: t('delivery.area_not_covered'), variant: "destructive" });
      return;
    }

    if (type === 'pickup') {
      setDeliveryData(prev => ({ ...prev, pickupLocation: location }));
    } else {
      setDeliveryData(prev => ({ ...prev, deliveryLocation: location }));
    }
  };

  const handleNext = () => {
    if (currentStep === 'addresses') {
      if (!deliveryData.pickupLocation) {
        toast({ title: "Adresse de collecte requise", variant: "destructive" });
        return;
      }
      if (!deliveryData.deliveryLocation) {
        toast({ title: "Adresse de livraison requise", variant: "destructive" });
        return;
      }
      setCurrentStep('details');
    } else if (currentStep === 'details') {
      if (!deliveryData.senderName?.trim() || deliveryData.senderName.trim().length < 2) {
        toast({ title: "Nom expéditeur requis", variant: "destructive" });
        return;
      }
      if (!deliveryData.senderPhone?.trim() || deliveryData.senderPhone.trim().length < 9) {
        toast({ title: "Téléphone expéditeur invalide", variant: "destructive" });
        return;
      }
      if (!deliveryData.recipientName?.trim() || deliveryData.recipientName.trim().length < 2) {
        toast({ title: "Nom destinataire requis", variant: "destructive" });
        return;
      }
      if (!deliveryData.recipientPhone?.trim() || deliveryData.recipientPhone.trim().length < 9) {
        toast({ title: "Téléphone destinataire invalide", variant: "destructive" });
        return;
      }
      setCurrentStep('confirm');
    }
  };

  const handleBack = () => {
    if (currentStep === 'details') setCurrentStep('addresses');
    else if (currentStep === 'confirm') setCurrentStep('details');
  };

  const handleSubmit = async () => {
    if (!deliveryData.pickupLocation || !deliveryData.deliveryLocation) return;
    
    setIsSubmitting(true);
    try {
      const distanceMeters = calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation);
      const distanceKm = distanceMeters / 1000;
      const durationMinutes = Math.round(distanceKm * 2.5);

      const validatedOrderData = {
        pickup: {
          location: { address: deliveryData.pickupLocation.address, coordinates: { lat: deliveryData.pickupLocation.lat, lng: deliveryData.pickupLocation.lng } },
          contact: { name: deliveryData.senderName.trim(), phone: deliveryData.senderPhone.trim() }
        },
        destination: {
          location: { address: deliveryData.deliveryLocation.address, coordinates: { lat: deliveryData.deliveryLocation.lat, lng: deliveryData.deliveryLocation.lng } },
          contact: { name: deliveryData.recipientName.trim(), phone: deliveryData.recipientPhone.trim() }
        },
        service: {
          mode: deliveryData.serviceType,
          name: SERVICE_TYPES[deliveryData.serviceType].name,
          description: SERVICE_TYPES[deliveryData.serviceType].description,
          iconEmoji: deliveryData.serviceType === 'flash' ? '⚡' : deliveryData.serviceType === 'flex' ? '📦' : '🚛',
          features: ['Suivi temps réel', 'Support 24/7', 'Assurance colis'],
          estimatedTime: `${durationMinutes} min`
        },
        pricing: { price: deliveryData.estimatedPrice, distance: distanceKm, duration: durationMinutes },
        distance: distanceKm,
        duration: durationMinutes,
        mode: deliveryData.serviceType,
        city: detectedCityName,
        currency
      };

      onSubmit(validatedOrderData);
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de créer la commande", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps: Step[] = ['addresses', 'details', 'confirm'];
  const currentStepIndex = steps.indexOf(currentStep);

  const formatPhoneNumber = (value: string): string => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('0')) cleaned = phonePrefix + cleaned.substring(1);
    if (cleaned && !cleaned.startsWith('+')) cleaned = phonePrefix + cleaned;
    return cleaned.slice(0, 16);
  };

  // ================== STEP 1: ADDRESSES ==================
  const renderAddressesStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-3"
    >
      {/* Collecte */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 shrink-0" />
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Collecte</Label>
        </div>
        <button type="button" onClick={() => setSearchOpen('pickup')}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-left active:scale-[0.99] transition-all">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-gray-400">Point de collecte</div>
            <div className="text-[15px] font-semibold text-gray-900 truncate">{deliveryData.pickupLocation?.address || 'Ma position'}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
        </button>
      </div>

      {/* Séparateur */}
      <div className="flex justify-start pl-[5px] py-1">
        <div className="w-0.5 h-6 bg-gradient-to-b from-green-300 to-red-300 rounded-full" />
      </div>

      {/* Livraison */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 shrink-0" />
          <Label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Livraison</Label>
        </div>
        <button type="button" onClick={() => setSearchOpen('delivery')}
          style={{ touchAction: 'manipulation' }}
          className="w-full flex items-center gap-3.5 p-4 rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] text-left active:scale-[0.99] transition-all">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-medium text-gray-400">Point de livraison</div>
            <div className="text-[15px] font-semibold text-gray-900 truncate">{deliveryData.deliveryLocation?.address || 'Choisir la destination'}</div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
        </button>
      </div>

      {/* Distance estimée */}
      {deliveryData.pickupLocation && deliveryData.deliveryLocation && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl"
        >
          <MapPin className="w-4 h-4 text-red-500" />
          <p className="text-sm text-muted-foreground">
            Distance : <span className="font-semibold text-foreground">
              {formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))}
            </span>
          </p>
        </motion.div>
      )}

      <div className="pt-5 mt-2 border-t border-gray-100">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Nos services</p>
        <DeliveryServicesCarousel />
      </div>

      <DestinationSearchDialog
        open={searchOpen !== null}
        onOpenChange={(o) => { if (!o) setSearchOpen(null); }}
        onSelectDestination={(dest) => {
          handleLocationSelect({ address: dest.address, lat: dest.lat, lng: dest.lng, type: 'google', placeId: (dest as any).placeId, name: (dest as any).name || dest.address }, searchOpen === 'pickup' ? 'pickup' : 'delivery');
          setSearchOpen(null);
        }}
      />
    </motion.div>
  );

  // ================== STEP 2: DETAILS ==================
  const renderDetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Service selection - Compact */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Service</Label>
        <div className="flex flex-col gap-2.5">
          {Object.entries(SERVICE_TYPES).map(([key, service]) => {
            const isSelected = deliveryData.serviceType === key;
            
            return (
              <button key={key} type="button"
                onClick={() => setDeliveryData(prev => ({ ...prev, serviceType: key as any }))}
                style={{ touchAction: 'manipulation' }}
                className={cn("flex items-center gap-3 p-3 rounded-2xl text-left transition-all border bg-white active:scale-[0.98]",
                  isSelected ? "border-red-500 shadow-[0_2px_12px_rgba(239,68,68,0.15)]" : "border-gray-200 shadow-sm")}
              >
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0", isSelected ? "bg-red-50" : "bg-gray-50")}>
                  <img src={service.icon3d} alt={service.name} className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[15px] text-gray-900">{service.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{service.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[15px] text-gray-900">{getServicePricing(key as 'flash' | 'flex' | 'maxicharge').basePrice.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-400">{currency}</div>
                </div>
                {isSelected && <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-white" /></div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expéditeur */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Expéditeur
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={deliveryData.senderName}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, senderName: e.target.value }))}
            className="h-11 rounded-xl bg-white shadow-sm border border-gray-100"
          />
          <Input
            placeholder={`${phonePrefix}...`}
            value={deliveryData.senderPhone}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, senderPhone: formatPhoneNumber(e.target.value) }))}
            className="h-11 rounded-xl bg-white shadow-sm border border-gray-100"
          />
        </div>
      </div>

      {/* Destinataire */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          Destinataire
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nom"
            value={deliveryData.recipientName}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, recipientName: e.target.value }))}
            className="h-11 rounded-xl bg-white shadow-sm border border-gray-100"
          />
          <Input
            placeholder={`${phonePrefix}...`}
            value={deliveryData.recipientPhone}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, recipientPhone: formatPhoneNumber(e.target.value) }))}
            className="h-11 rounded-xl bg-white shadow-sm border border-gray-100"
          />
        </div>
      </div>

      {/* Package type - Compact select */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Type de colis</Label>
        <select
          value={deliveryData.packageType}
          onChange={(e) => setDeliveryData(prev => ({ ...prev, packageType: e.target.value }))}
          className="w-full h-11 px-3 rounded-xl bg-white shadow-sm border border-gray-100 text-sm"
        >
          {packageTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );

  // ================== STEP 3: CONFIRM ==================
  const renderConfirmStep = () => {
    const serviceIcon3d = SERVICE_TYPES[deliveryData.serviceType].icon3d;
    
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* Timeline compacte */}
        <div className="bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] rounded-2xl p-4">
          {/* Collecte */}
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              <div className="w-0.5 flex-1 bg-border/40 my-1.5" />
            </div>
            <div className="flex-1 pb-3 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Collecte</p>
              <p className="text-sm font-medium truncate">{deliveryData.pickupLocation?.address}</p>
              <p className="text-xs text-muted-foreground">{deliveryData.senderName} • {deliveryData.senderPhone}</p>
            </div>
          </div>
          
          {/* Livraison */}
          <div className="flex gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Livraison</p>
              <p className="text-sm font-medium truncate">{deliveryData.deliveryLocation?.address}</p>
              <p className="text-xs text-muted-foreground">{deliveryData.recipientName} • {deliveryData.recipientPhone}</p>
            </div>
          </div>
        </div>

        {/* Résumé compact */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <img src={serviceIcon3d} alt={SERVICE_TYPES[deliveryData.serviceType].name} className="w-6 h-6 object-contain" />
            <span className="text-sm font-medium">{SERVICE_TYPES[deliveryData.serviceType].name}</span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {deliveryData.pickupLocation && deliveryData.deliveryLocation
                ? formatDistance(calculateDistance(deliveryData.pickupLocation, deliveryData.deliveryLocation))
                : '—'}
            </span>
          </div>
          
          <div className="flex-1 text-right px-3 py-2 bg-primary/10 rounded-xl">
            <span className="text-sm font-bold text-primary">
              {deliveryData.estimatedPrice.toLocaleString()} {currency}
            </span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header iOS/Android safe */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/10 safe-area-top">
        <div className="max-w-lg mx-auto flex items-center gap-2.5 px-4 py-2.5 min-h-[52px]">
          {/* Bouton retour — 44pt touch target */}
          <button
            onClick={currentStep === 'addresses' ? onCancel : handleBack}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted/50 active:scale-95 transition-all -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          {/* Logo stylé */}
          <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Package className="w-[18px] h-[18px] text-primary" />
          </div>
          
          {/* Branding + sous-titre contextuel */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold tracking-tight whitespace-nowrap">
              TAGA <span className="text-muted-foreground">Delivery</span>
            </h1>
            <p className="text-[11px] text-muted-foreground/60">
              {currentStep === 'addresses' && 'Adresses'}
              {currentStep === 'details' && 'Détails & contacts'}
              {currentStep === 'confirm' && 'Confirmation'}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index <= currentStepIndex 
                    ? "w-6 bg-red-500"
                    : "w-1.5 bg-gray-200"
                )}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content — scrolls behind sticky footer */}
      <main className="flex-1 px-4 py-4 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            {currentStep === 'addresses' && renderAddressesStep()}
            {currentStep === 'details' && renderDetailsStep()}
            {currentStep === 'confirm' && renderConfirmStep()}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer CTA */}
      <div className="sticky bottom-0 bg-white pt-3 pb-4 px-4 border-t border-gray-100">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={currentStep === 'confirm' ? handleSubmit : handleNext}
            className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 font-medium active:scale-[0.98] transition-transform"
            disabled={isSubmitting ||
              (currentStep === 'addresses' && (!deliveryData.pickupLocation || !deliveryData.deliveryLocation))
            }
          >
            {currentStep === 'confirm'
              ? (isSubmitting ? 'Création...' : `Commander • ${deliveryData.estimatedPrice.toLocaleString()} ${currency}`)
              : 'Continuer'
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
