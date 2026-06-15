/**
 * 📦 FORMULAIRE DE LIVRAISON INTELLIGENT
 * 
 * Interface optimisée pour commandes de livraison rapide
 * Calcul automatique des frais selon le type de service
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SmartLocationPicker } from '@/components/location/SmartLocationPicker';
import { useSmartGeolocation, LocationData } from '@/hooks/useSmartGeolocation';
import { 
  Package, 
  Zap, 
  Truck, 
  Clock, 
  Calculator,
  Phone,
  User,
  Package2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartDeliveryFormProps {
  onSubmit: (deliveryData: DeliveryData) => void;
  disabled?: boolean;
  className?: string;
}

interface DeliveryData {
  pickup: LocationData;
  delivery: LocationData;
  deliveryType: 'flash' | 'flex' | 'maxicharge';
  packageType: string;
  recipientName: string;
  recipientPhone: string;
  senderName: string;
  senderPhone: string;
  specialInstructions: string;
  estimatedPrice: number;
  estimatedDuration: number;
  distance: number;
}

const deliveryTypes = [
  {
    id: 'flash',
    name: 'Flash',
    icon: Zap,
    description: 'Livraison express moto',
    basePrice: 5000,
    pricePerKm: 500,
    duration: '15-30 min',
    color: 'text-orange-600'
  },
  {
    id: 'flex',
    name: 'Flex',
    icon: Package,
    description: 'Livraison standard',
    basePrice: 3000,
    pricePerKm: 300,
    duration: '30-60 min',
    color: 'text-blue-600'
  },
  {
    id: 'maxicharge',
    name: 'Maxicharge',
    icon: Truck,
    description: 'Gros colis camion',
    basePrice: 8000,
    pricePerKm: 800,
    duration: '60-90 min',
    color: 'text-purple-600'
  }
];

export const SmartDeliveryForm: React.FC<SmartDeliveryFormProps> = ({
  onSubmit,
  disabled = false,
  className
}) => {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [delivery, setDelivery] = useState<LocationData | null>(null);
  const [deliveryType, setDeliveryType] = useState<'flash' | 'flex' | 'maxicharge'>('flex');
  const [packageType, setPackageType] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  const [estimatedPrice, setEstimatedPrice] = useState<number>(0);
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const { getCurrentPosition, calculateDistance, formatDistance } = useSmartGeolocation();

  // Auto-détection position pickup
  useEffect(() => {
    const autoDetectPickup = async () => {
      try {
        const position = await getCurrentPosition({
          timeout: 10000,
          fallbackToIP: true,
          fallbackToDefault: true
        });
        setPickup(position);
      } catch (error) {
        console.log('Auto-detection failed');
      }
    };

    autoDetectPickup();
  }, [getCurrentPosition]);

  // Calcul automatique prix et durée
  useEffect(() => {
    if (pickup && delivery && deliveryType) {
      calculateDeliveryPrice();
    }
  }, [pickup, delivery, deliveryType]);

  const calculateDeliveryPrice = async () => {
    if (!pickup || !delivery) return;

    setIsCalculating(true);
    
    try {
      const distanceMeters = calculateDistance(
        { lat: pickup.lat, lng: pickup.lng },
        { lat: delivery.lat, lng: delivery.lng }
      );
      
      const distanceKm = distanceMeters / 1000;
      setDistance(distanceKm);

      const selectedType = deliveryTypes.find(type => type.id === deliveryType);
      if (selectedType) {
        const calculatedPrice = selectedType.basePrice + (distanceKm * selectedType.pricePerKm);
        setEstimatedPrice(Math.round(calculatedPrice));

        // Durée basée sur le type de service
        const baseDuration = {
          flash: 20,
          flex: 45,
          maxicharge: 75
        };
        const estimatedMinutes = baseDuration[deliveryType] + Math.round(distanceKm * 2);
        setEstimatedDuration(estimatedMinutes);
      }

    } catch (error) {
      console.error('Calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSubmit = () => {
    if (!pickup || !delivery || !recipientName || !recipientPhone) return;

    const deliveryData: DeliveryData = {
      pickup,
      delivery,
      deliveryType,
      packageType,
      recipientName,
      recipientPhone,
      senderName,
      senderPhone,
      specialInstructions,
      estimatedPrice,
      estimatedDuration,
      distance
    };

    onSubmit(deliveryData);
  };

  const selectedDeliveryType = deliveryTypes.find(type => type.id === deliveryType);
  const isReadyToOrder = pickup && delivery && recipientName && recipientPhone && estimatedPrice > 0;

  return (
    <Card className={cn("p-6 space-y-6 bg-gradient-to-br from-background to-background/50", className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Commander une livraison</h3>
          <p className="text-sm text-muted-foreground">Service rapide et fiable</p>
        </div>
      </div>

      {/* Type de livraison */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Type de livraison</label>
        <div className="grid grid-cols-3 gap-2">
          {deliveryTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setDeliveryType(type.id as any)}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all duration-200 text-center",
                  deliveryType === type.id 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-primary/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mx-auto mb-1", type.color)} />
                <div className="font-medium text-sm">{type.name}</div>
                <div className="text-xs text-muted-foreground">{type.duration}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Adresses */}
      <div className="space-y-4">
        <SmartLocationPicker
          value={pickup}
          onChange={setPickup}
          label="📦 Adresse de collecte"
          placeholder="D'où récupérer le colis ?"
          context="pickup"
          showAccuracy={true}
          disabled={disabled}
        />

        <SmartLocationPicker
          value={delivery}
          onChange={setDelivery}
          label="🎯 Adresse de livraison"
          placeholder="Où livrer le colis ?"
          context="delivery"
          disabled={disabled}
        />
      </div>

      {/* Informations destinataire */}
      <div className="space-y-4">
        <h4 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Informations destinataire
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Nom complet"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            disabled={disabled}
          />
          <Input
            placeholder="Téléphone"
            value={recipientPhone}
            onChange={(e) => setRecipientPhone(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Informations colis */}
      <div className="space-y-3">
        <h4 className="font-medium flex items-center gap-2">
          <Package2 className="h-4 w-4" />
          Détails du colis
        </h4>
        
        <Select value={packageType} onValueChange={setPackageType}>
          <SelectTrigger>
            <SelectValue placeholder="Type de colis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="documents">Documents</SelectItem>
            <SelectItem value="nourriture">Nourriture</SelectItem>
            <SelectItem value="vêtements">Vêtements</SelectItem>
            <SelectItem value="électronique">Électronique</SelectItem>
            <SelectItem value="autres">Autres</SelectItem>
          </SelectContent>
        </Select>

        <Textarea
          placeholder="Instructions spéciales (optionnel)"
          value={specialInstructions}
          onChange={(e) => setSpecialInstructions(e.target.value)}
          className="min-h-[80px]"
          disabled={disabled}
        />
      </div>

      {/* Estimation */}
      {(pickup && delivery) && (
        <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Estimation automatique</span>
            {isCalculating && (
              <div className="animate-pulse text-xs text-primary">Calcul en cours...</div>
            )}
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-muted-foreground">Distance</div>
              <div className="font-semibold text-primary">
                {formatDistance(distance * 1000)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Durée</div>
              <div className="font-semibold text-primary flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                {estimatedDuration}min
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Prix</div>
              <div className="font-semibold text-primary">
                {estimatedPrice.toLocaleString()} CDF
              </div>
            </div>
          </div>

          {selectedDeliveryType && (
            <div className="text-center pt-2 border-t border-border/30">
              <div className="text-xs text-muted-foreground">
                Service {selectedDeliveryType.name} • {selectedDeliveryType.description}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <Button
        onClick={handleSubmit}
        disabled={!isReadyToOrder || disabled || isCalculating}
        className={cn(
          "w-full h-12 font-semibold text-base transition-all duration-200",
          isReadyToOrder 
            ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30" 
            : "bg-muted text-muted-foreground"
        )}
      >
        {isCalculating ? (
          <>
            <Calculator className="mr-2 h-4 w-4 animate-pulse" />
            Calcul en cours...
          </>
        ) : isReadyToOrder ? (
          <>
            <Package className="mr-2 h-4 w-4" />
            Commander • {estimatedPrice.toLocaleString()} CDF
          </>
        ) : (
          'Remplissez tous les champs requis'
        )}
      </Button>

      {isReadyToOrder && (
        <div className="text-xs text-center text-muted-foreground">
          📦 Un livreur sera assigné automatiquement
        </div>
      )}
    </Card>
  );
};