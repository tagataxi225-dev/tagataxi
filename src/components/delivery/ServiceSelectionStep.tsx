import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useEnhancedDeliveryOrders } from '@/hooks/useEnhancedDeliveryOrders';
import HorizontalServiceSelector from './HorizontalServiceSelector';
import { formatCurrency } from '@/utils/formatCurrency';
import { 
  ArrowLeft,
  ArrowRight,
  Zap,
  Truck,
  Package
} from 'lucide-react';
interface DeliveryLocation {
  address: string;
  coordinates: { lat: number; lng: number };
}

interface ServiceSelectionStepProps {
  pickup: DeliveryLocation;
  destination: DeliveryLocation;
  onServiceSelect: (service: DeliveryService, pricing: DeliveryPricing) => void;
  onBack: () => void;
}

interface DeliveryService {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  description: string;
  icon: any;
  features: string[];
  estimatedTime: string;
}

interface DeliveryPricing {
  price: number;
  distance: number;
  duration: number;
}

const deliveryServices: DeliveryService[] = [
  {
    id: 'flash',
    name: 'TAGA Flash',
    subtitle: 'Express',
    description: 'Rapide et urgent',
    icon: Zap,
    features: ['Urgent'],
    estimatedTime: '30-60 min'
  },
  {
    id: 'flex',
    name: 'TAGA Flex',
    subtitle: 'Standard',
    description: 'Équilibré',
    icon: Package,
    features: ['Normal'],
    estimatedTime: '2-4h'
  },
  {
    id: 'maxicharge',
    name: 'TAGA MaxiCharge',
    subtitle: 'Gros colis',
    description: 'Volumineux',
    icon: Truck,
    features: ['Gros'],
    estimatedTime: '3-6h'
  }
];

export const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({
  pickup,
  destination,
  onServiceSelect,
  onBack
}) => {
  const [selectedService, setSelectedService] = useState<DeliveryService | null>(null);
  const [pricing, setPricing] = useState<Record<string, DeliveryPricing>>({});
  const [loadingPricing, setLoadingPricing] = useState(true);
  
  const { calculateDeliveryPrice } = useEnhancedDeliveryOrders();

  // Calcul parallèle des prix avec timeout robuste
  useEffect(() => {
    const calculateAllPrices = async () => {
      setLoadingPricing(true);
      const pricingResults: Record<string, DeliveryPricing> = {};

      try {
        // Calculer tous les prix EN PARALLÈLE avec timeout individuel
        const pricePromises = deliveryServices.map(async (service) => {
          const timeoutPromise = new Promise<DeliveryPricing>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout for ${service.id}`)), 3000)
          );

          const calculationPromise = calculateDeliveryPrice(
            { address: pickup.address, lat: pickup.coordinates.lat, lng: pickup.coordinates.lng },
            { address: destination.address, lat: destination.coordinates.lat, lng: destination.coordinates.lng },
            service.id
          );

          try {
            const result = await Promise.race([calculationPromise, timeoutPromise]);
            return { serviceId: service.id, result };
          } catch (error) {
            // Fallback immédiat en cas d'échec
            const fallbackPrices = {
              flash: { price: 7000, distance: 5, duration: 30 },
              flex: { price: 4500, distance: 5, duration: 30 },
              maxicharge: { price: 10000, distance: 5, duration: 30 }
            };
            console.log(`Using fallback for ${service.id}:`, error);
            return { serviceId: service.id, result: fallbackPrices[service.id] };
          }
        });

        const results = await Promise.all(pricePromises);
        results.forEach(({ serviceId, result }) => {
          pricingResults[serviceId] = result;
        });

        setPricing(pricingResults);
      } catch (error) {
        console.error('Error calculating prices:', error);
        // Fallback global si tout échoue
        const fallbackPrices = {
          flash: { price: 7000, distance: 5, duration: 30 },
          flex: { price: 4500, distance: 5, duration: 30 },
          maxicharge: { price: 10000, distance: 5, duration: 30 }
        };
        setPricing(fallbackPrices);
      } finally {
        setLoadingPricing(false);
      }
    };

    if (pickup && destination) {
      calculateAllPrices();
    }
  }, [pickup, destination, calculateDeliveryPrice]);

  const handleServiceSelect = () => {
    if (selectedService && pricing[selectedService.id]) {
      onServiceSelect(selectedService, pricing[selectedService.id]);
    }
  };

  const handleServiceCardSelect = (service: DeliveryService) => {
    setSelectedService(service);
  };

  const formatPrice = (price: number) => formatCurrency(price, 'XOF');

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Soft Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2 h-12 px-4 rounded-xl
                        bg-card/50 backdrop-blur-sm border border-border/20
                        hover:bg-card/70 hover:border-primary/30 
                        transition-all duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Retour</span>
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                Livraison
              </h1>
            </div>
            <div className="w-24" />
          </div>
          
          {/* Route display simplifié */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-center gap-3 text-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-primary rounded-full" />
                <span className="truncate text-foreground">{pickup.address}</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-2 h-2 bg-secondary rounded-full" />
                <span className="truncate text-foreground">{destination.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Horizontal Services Selector */}
        <HorizontalServiceSelector
          services={deliveryServices}
          selectedService={selectedService}
          pricing={pricing}
          loadingPricing={loadingPricing}
          onServiceSelect={handleServiceCardSelect}
          className="mb-8"
        />

        {/* Continue Button simplifié */}
        <div className="flex justify-center">
          <Button
            onClick={handleServiceSelect}
            disabled={!selectedService || loadingPricing}
            size="lg"
            className="h-14 px-8 text-lg font-bold rounded-xl
                      bg-gradient-to-r from-primary to-primary/90 
                      hover:from-primary/90 hover:to-primary/80
                      disabled:opacity-50
                      transition-all duration-300 transform
                      hover:scale-105 active:scale-95
                      shadow-lg hover:shadow-xl"
          >
            {loadingPricing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Calcul...</span>
              </div>
            ) : selectedService ? (
              <div className="flex items-center gap-2">
                <span>Confirmer</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            ) : (
              'Choisir un service'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};