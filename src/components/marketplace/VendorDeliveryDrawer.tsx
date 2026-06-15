/**
 * Drawer Tembea Delivery pour vendeurs
 * Permet de commander un livreur avec données pré-remplies
 */

import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useDynamicDeliveryPricing } from '@/hooks/useDynamicDeliveryPricing';
import { 
  Package, MapPin, Truck, Phone, User, ArrowRight, 
  Zap, Clock, CheckCircle2, Loader2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VendorDeliveryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  vendorProfile?: {
    business_address?: string;
    coordinates?: { lat: number; lng: number };
    shop_name?: string;
    phone_number?: string;
  };
  onDeliveryCreated: (deliveryFee: number, deliveryOrderId?: string) => void;
}

type ServiceType = 'flash' | 'flex' | 'maxicharge';

const SERVICES = {
  flash: {
    name: 'Flash',
    emoji: '⚡',
    description: 'Livraison express en 30-45 min',
    gradient: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-500'
  },
  flex: {
    name: 'Flex',
    emoji: '📦',
    description: 'Livraison standard 1-2h',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-500'
  },
  maxicharge: {
    name: 'MaxiCharge',
    emoji: '🚚',
    description: 'Gros colis et meubles',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-500'
  }
};

export const VendorDeliveryDrawer = ({
  isOpen,
  onClose,
  order,
  vendorProfile,
  onDeliveryCreated
}: VendorDeliveryDrawerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { calculatePrice, formatPrice, loading: pricingLoading } = useDynamicDeliveryPricing();
  
  const [selectedService, setSelectedService] = useState<ServiceType>('flex');
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [distance, setDistance] = useState<number>(0);

  // Calculer la distance entre deux points
  const calculateDistance = (coords1: any, coords2: any): number => {
    if (!coords1 || !coords2) return 0;
    const R = 6371; // Rayon de la Terre en km
    const dLat = (coords2.lat - coords1.lat) * Math.PI / 180;
    const dLon = (coords2.lng - coords1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coords1.lat * Math.PI / 180) * Math.cos(coords2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculer le prix quand le service change
  useEffect(() => {
    const fetchPrice = async () => {
      if (!order?.delivery_coordinates || !vendorProfile?.coordinates) return;
      
      setIsCalculating(true);
      const dist = calculateDistance(vendorProfile.coordinates, order.delivery_coordinates);
      setDistance(dist);
      
      const result = await calculatePrice(selectedService, dist);
      if (result) {
        setCalculatedPrice(result.calculated_price);
      }
      setIsCalculating(false);
    };
    
    fetchPrice();
  }, [selectedService, order?.delivery_coordinates, vendorProfile?.coordinates]);

  // Créer la commande de livraison
  const handleCreateDeliveryOrder = async () => {
    if (!user || !order || calculatedPrice <= 0) return;
    
    setIsCreatingOrder(true);
    
    try {
      // Créer la commande de livraison
      const { data: deliveryOrder, error } = await supabase
        .from('delivery_orders')
        .insert({
          user_id: user.id,
          delivery_type: selectedService,
          pickup_location: vendorProfile?.business_address || 'Boutique vendeur',
          pickup_coordinates: vendorProfile?.coordinates,
          delivery_location: order.delivery_address || 'Adresse client',
          delivery_coordinates: order.delivery_coordinates,
          sender_name: vendorProfile?.shop_name || 'Vendeur',
          sender_phone: vendorProfile?.phone_number || '',
          recipient_name: order.buyer?.display_name || order.buyer_contact || 'Client',
          recipient_phone: order.buyer?.phone_number || order.buyer_contact || '',
          estimated_price: calculatedPrice,
          status: 'pending',
          city: 'Kinshasa'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "✅ Livreur commandé",
        description: `Commande ${SERVICES[selectedService].name} créée - ${formatPrice(calculatedPrice)}`
      });

      onDeliveryCreated(calculatedPrice, deliveryOrder?.id);
      onClose();
      
    } catch (error: any) {
      console.error('Erreur création livraison:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la commande",
        variant: "destructive"
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const pickupAddress = vendorProfile?.business_address || 'Votre boutique';
  const deliveryAddress = order?.delivery_address || 
    (order?.delivery_coordinates 
      ? `📍 ${order.delivery_coordinates.lat?.toFixed(4)}, ${order.delivery_coordinates.lng?.toFixed(4)}`
      : 'Adresse client');

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DrawerTitle className="text-lg">Tembea Delivery</DrawerTitle>
                <p className="text-xs text-muted-foreground">Commander un livreur</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Trajet */}
          <Card className="p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-border/40">
            <div className="space-y-3">
              {/* Pickup */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Package className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Collecte</p>
                  <p className="text-sm font-medium truncate">{pickupAddress}</p>
                </div>
              </div>

              {/* Ligne de connexion */}
              <div className="ml-4 border-l-2 border-dashed border-border/60 h-4" />

              {/* Delivery */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-red-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Livraison</p>
                  <p className="text-sm font-medium truncate">{deliveryAddress}</p>
                </div>
              </div>

              {/* Distance */}
              {distance > 0 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Badge variant="secondary" className="text-xs">
                    📏 {distance.toFixed(1)} km
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {/* Sélection du service */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Type de livraison</Label>
            <div className="grid gap-3">
              {(Object.keys(SERVICES) as ServiceType[]).map((serviceKey) => {
                const service = SERVICES[serviceKey];
                const isSelected = selectedService === serviceKey;
                
                return (
                  <motion.div
                    key={serviceKey}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedService(serviceKey)}
                  >
                    <Card 
                      className={`p-4 cursor-pointer transition-all duration-300 ${
                        isSelected 
                          ? `bg-gradient-to-r ${service.gradient} border-2 ${service.borderColor} shadow-lg` 
                          : 'bg-white/40 dark:bg-slate-900/40 border-border/40 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.emoji}</span>
                          <div>
                            <p className={`font-semibold ${isSelected ? service.textColor : ''}`}>
                              {service.name}
                            </p>
                            <p className="text-xs text-muted-foreground">{service.description}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className={`h-5 w-5 ${service.textColor}`} />
                        )}
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Prix calculé */}
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frais de livraison</p>
                <div className="flex items-center gap-2">
                  {isCalculating ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {formatPrice(calculatedPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Service</p>
                <Badge className={`${SERVICES[selectedService].textColor} bg-transparent border ${SERVICES[selectedService].borderColor}`}>
                  {SERVICES[selectedService].emoji} {SERVICES[selectedService].name}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Bouton de confirmation */}
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleCreateDeliveryOrder}
            disabled={isCreatingOrder || calculatedPrice <= 0 || isCalculating}
          >
            {isCreatingOrder ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Création en cours...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4 mr-2" />
                Commander un livreur • {formatPrice(calculatedPrice)}
              </>
            )}
          </Button>

          {/* Note */}
          <p className="text-xs text-center text-muted-foreground">
            Un livreur sera automatiquement assigné à votre commande
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
