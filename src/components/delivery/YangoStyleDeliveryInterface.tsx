import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';
import { GeocodingService } from '@/services/geocoding';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  MapPin, 
  Bike,
  Car,
  Truck,
  Clock,
  Info,
  Target,
  ChevronRight
} from 'lucide-react';
import { usePriceEstimator } from '@/hooks/usePricingRules';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface YangoStyleDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const YangoStyleDeliveryInterface = ({ onSubmit, onCancel }: YangoStyleDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedDeliveryType, setSelectedDeliveryType] = useState('flash');
  const [businessMode, setBusinessMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regionLabel, setRegionLabel] = useState('Votre région');

  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();
  const { estimate: flashEstimate } = usePriceEstimator('delivery', 'flash');
  const { estimate: flexEstimate } = usePriceEstimator('delivery', 'flex');
  const { estimate: maxichargeEstimate } = usePriceEstimator('delivery', 'maxicharge');

  const deliveryOptions = [
    {
      id: 'flash',
      name: 'Livraison à moto',
      subtitle: 'Flash',
      icon: Bike,
      time: '15-25 min',
      basePrice: 5000,
      estimate: flashEstimate,
      description: 'Idéal pour documents et petits colis'
    },
    {
      id: 'flex',
      name: 'Livraison en voiture',
      subtitle: 'Flex ≤ 1000kg',
      icon: Car,
      time: '30-60 min',
      basePrice: 55000,
      estimate: flexEstimate,
      description: 'Pour colis moyens et fragiles'
    },
    {
      id: 'maxicharge',
      name: 'Express Cargo',
      subtitle: 'MaxiCharge ≤ 3500kg',
      icon: Truck,
      time: '60-120 min',
      basePrice: 100000,
      estimate: maxichargeEstimate,
      description: 'Gros volumes et objets lourds'
    }
  ];

  useEffect(() => {
    (async () => {
      try {
        const position = await getCurrentPosition();
        if (position?.lat && position?.lng) {
          const addr = await GeocodingService.reverseGeocode(position.lng, position.lat);
          if (addr) {
            const parts = addr.split(',');
            setRegionLabel(parts.slice(-2).join(', ').trim());
          }
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const calculateTotalPrice = () => {
    if (!pickup || !destination) return 0;
    
    const lat1 = pickup.coordinates[1];
    const lon1 = pickup.coordinates[0];
    const lat2 = destination.coordinates[1];
    const lon2 = destination.coordinates[0];
    
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    const option = deliveryOptions.find(opt => opt.id === selectedDeliveryType);
    return option ? option.estimate(distance) : 0;
  };

  const handleLocationSearch = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return;
    
    try {
      const results = await GeocodingService.searchPlaces(query);
      if (results.length > 0) {
        const location = { 
          address: results[0].place_name, 
          coordinates: results[0].center as [number, number] 
        };
        
        if (isPickup) {
          setPickup(location);
          setPickupSearch(location.address);
        } else {
          setDestination(location);
          setDestinationSearch(location.address);
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible de trouver cette adresse',
        variant: 'destructive'
      });
    }
  };

  const handleCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      if (position?.lat && position?.lng) {
        const address = await GeocodingService.reverseGeocode(
          position.lng, 
          position.lat
        );
        setPickup({
          address: address || 'Ma position actuelle',
          coordinates: [position.lng, position.lat]
        });
        setPickupSearch(address || 'Ma position actuelle');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'obtenir votre position",
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async () => {
    if (!pickup || !destination || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Authentification requise',
          description: 'Vous devez être connecté pour effectuer une livraison',
          variant: 'destructive'
        });
        return;
      }

      const orderData = {
        user_id: user.user.id,
        delivery_type: selectedDeliveryType,
        pickup_location: pickup.address,
        pickup_coordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        delivery_location: destination.address,
        delivery_coordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        estimated_price: calculateTotalPrice(),
        status: 'pending',
        sender_name: 'Expéditeur Yango',
        sender_phone: '+243000000000',
        recipient_name: 'Destinataire Yango',
        recipient_phone: '+243000000000'
      };

      const { data, error } = await supabase
        .from('delivery_orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Commande créée',
        description: `Votre demande de livraison ${selectedDeliveryType} a été enregistrée`
      });

      onSubmit({
        orderId: data.id,
        mode: selectedDeliveryType,
        pickup,
        destination,
        price: calculateTotalPrice(),
        businessMode
      });
    } catch (error) {
      console.error('Error creating delivery order:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPrice = calculateTotalPrice();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">ENVOYER UN COLIS</h1>
              <p className="text-sm text-muted-foreground">{regionLabel}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground">{totalPrice.toLocaleString()} CDF</p>
            <p className="text-xs text-muted-foreground">Montant dû</p>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="min-h-[60vh] relative">
        <GoogleMapsKwenda
          pickup={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : undefined}
          destination={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : undefined}
          showRoute={!!(pickup && destination)}
          center={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : { lat: 4.0383, lng: 21.7587 }}
          zoom={12}
          height="65vh"
          deliveryMode={selectedDeliveryType as "flash" | "flex" | "maxicharge"}
          onLocationSelect={(coordinates) => {
            if (!pickup) {
              GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                setPickup({ 
                  address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`, 
                  coordinates: [coordinates.lng, coordinates.lat]
                });
                setPickupSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
              });
            } else if (!destination) {
              GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                setDestination({ 
                  address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`, 
                  coordinates: [coordinates.lng, coordinates.lat]
                });
                setDestinationSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
              });
            }
          }}
        />
      </div>

      {/* Address Section */}
      <div className="bg-white p-4 space-y-4">
        {/* Pickup Address */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <Input
              placeholder="Adresse de récupération"
              value={pickupSearch}
              onChange={(e) => setPickupSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, true)}
              className="flex-1 border-0 p-0 focus-visible:ring-0 text-base font-medium bg-transparent"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCurrentLocation}
              className="text-primary hover:text-primary-dark"
            >
              <Target className="w-4 h-4" />
            </Button>
          </div>
          {pickup && (
            <p className="ml-6 text-sm text-muted-foreground mt-1">{pickup.address}</p>
          )}
        </div>

        {/* Destination Address */}
        <div className="relative">
          <div className="flex items-center gap-3">
            <MapPin className="w-3 h-3 text-primary" />
            <Input
              placeholder="Adresse de livraison"
              value={destinationSearch}
              onChange={(e) => setDestinationSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(destinationSearch, false)}
              className="flex-1 border-0 p-0 focus-visible:ring-0 text-base font-medium bg-transparent"
            />
          </div>
          {destination && (
            <p className="ml-6 text-sm text-muted-foreground mt-1">{destination.address}</p>
          )}
        </div>
      </div>

      {/* Delivery Options */}
      <div className="bg-white mt-2 p-4">
        <div className="space-y-3">
          {deliveryOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedDeliveryType === option.id;
            
            return (
              <button
                key={option.id}
                onClick={() => setSelectedDeliveryType(option.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{option.name}</h3>
                      <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">à partir de {option.basePrice.toLocaleString()} CDF</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{option.time}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Business Mode Toggle */}
        <div className="flex items-center justify-between py-4 border-t border-border mt-4">
          <div>
            <h4 className="font-medium text-foreground">Mode business</h4>
            <p className="text-sm text-muted-foreground">Tarifs préférentiels pour entreprises</p>
          </div>
          <Switch
            checked={businessMode}
            onCheckedChange={setBusinessMode}
          />
        </div>

        {/* Info Section */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
          <Info className="w-4 h-4" />
          <span>Plus d'infos sur l'option En 3 heures</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border">
        <Button
          onClick={handleSubmit}
          disabled={!pickup || !destination || isSubmitting}
          className="w-full h-14 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-xl"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Création en cours...
            </div>
          ) : (
            'Choix de la méthode de livraison'
          )}
        </Button>
      </div>
    </div>
  );
};

export default YangoStyleDeliveryInterface;