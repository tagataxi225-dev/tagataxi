import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useGeolocation } from '@/hooks/useGeolocation';
import { GeocodingService } from '@/services/geocoding';
import { usePriceEstimator } from '@/hooks/usePricingRules';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  MapPin, 
  Target,
  Bike,
  Car,
  Truck,
  Clock,
  CheckCircle,
  Loader2,
  Navigation,
  Package
} from 'lucide-react';
import GoogleMapsKwenda from '@/components/maps/GoogleMapsKwenda';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface DeliveryOption {
  id: 'flash' | 'flex' | 'maxicharge';
  name: string;
  subtitle: string;
  icon: any;
  time: string;
  description: string;
  priceEstimator: (distance: number) => number;
}

interface OneClickDeliveryInterfaceProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const OneClickDeliveryInterface = ({ onSubmit, onCancel }: OneClickDeliveryInterfaceProps) => {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [destination, setDestination] = useState<Location | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState<'flash' | 'flex' | 'maxicharge'>('flash');
  const [distance, setDistance] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'pickup' | 'destination' | 'confirm'>('pickup');

  const { getCurrentPosition } = useGeolocation();
  const { toast } = useToast();
  const { createDeliveryOrder, loading: orderLoading } = useDeliveryOrders();
  const { user } = useAuth();
  
  const { estimate: flashEstimate } = usePriceEstimator('delivery', 'flash');
  const { estimate: flexEstimate } = usePriceEstimator('delivery', 'flex');
  const { estimate: maxichargeEstimate } = usePriceEstimator('delivery', 'maxicharge');

  const deliveryOptions: DeliveryOption[] = [
    {
      id: 'flash',
      name: 'Flash Moto',
      subtitle: 'Rapide et économique',
      icon: Bike,
      time: '15-30 min',
      description: 'Documents, petits colis',
      priceEstimator: flashEstimate,
    },
    {
      id: 'flex',
      name: 'Flex Voiture',
      subtitle: 'Colis moyens ≤ 1000kg',
      icon: Car,
      time: '30-60 min',
      description: 'Objets fragiles, moyens volumes',
      priceEstimator: flexEstimate,
    },
    {
      id: 'maxicharge',
      name: 'MaxiCharge',
      subtitle: 'Gros volumes ≤ 3500kg',
      icon: Truck,
      time: '1-2h',
      description: 'Électroménager, meubles',
      priceEstimator: maxichargeEstimate,
    },
  ];

  // Calcul automatique de la distance et du prix
  useEffect(() => {
    if (pickup && destination) {
      const dist = calculateDistance(pickup.coordinates, destination.coordinates);
      setDistance(dist);
      
      const option = deliveryOptions.find(opt => opt.id === selectedMode);
      if (option) {
        setEstimatedPrice(option.priceEstimator(dist));
      }
    }
  }, [pickup, destination, selectedMode]);

  const calculateDistance = (coord1: [number, number], coord2: [number, number]) => {
    const [lon1, lat1] = coord1;
    const [lon2, lat2] = coord2;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const position = await getCurrentPosition();
      if (position?.lat && position?.lng) {
        const address = await GeocodingService.reverseGeocode(
          position.lng,
          position.lat
        );
        const location = {
          address: address || 'Ma position actuelle',
          coordinates: [position.lng, position.lat] as [number, number]
        };
        setPickup(location);
        setPickupSearch(location.address);
        setStep('destination');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'obtenir votre position",
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSearch = async (query: string, isPickup: boolean) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
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
          setStep('destination');
        } else {
          setDestination(location);
          setDestinationSearch(location.address);
          setStep('confirm');
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur de recherche',
        description: 'Impossible de trouver cette adresse',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickBook = async () => {
    if (!pickup || !destination) return;

    try {
      const orderData = {
        pickupLocation: pickup.address,
        deliveryLocation: destination.address,
        pickupCoordinates: { lat: pickup.coordinates[1], lng: pickup.coordinates[0] },
        deliveryCoordinates: { lat: destination.coordinates[1], lng: destination.coordinates[0] },
        deliveryType: selectedMode as 'flash' | 'flex' | 'maxicharge',
        estimatedPrice: estimatedPrice,
        senderName: user?.user_metadata?.display_name || user?.email || 'Expéditeur',
        senderPhone: user?.user_metadata?.phone || user?.phone || '',
        recipientName: 'Destinataire',
        recipientPhone: '',
        packageType: 'colis',
        vehicleSize: 'moto',
      };

      const result = await createDeliveryOrder(orderData);
      if (result) {
        onSubmit({
          orderId: result.id,
          mode: selectedMode,
          pickup,
          destination,
          price: estimatedPrice,
          distance
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la commande',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      {/* En-tête */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border/50 sticky top-0 z-20 pt-safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="p-2 hover:bg-muted rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Livraison Express</h1>
              <p className="text-sm text-muted-foreground">
                {step === 'pickup' && 'Choisissez le point de départ'}
                {step === 'destination' && 'Où livrer ?'}
                {step === 'confirm' && 'Confirmation'}
              </p>
            </div>
          </div>
          {estimatedPrice > 0 && (
            <div className="text-right">
              <p className="text-xl font-bold text-primary">{estimatedPrice.toLocaleString()} FC</p>
              <p className="text-xs text-muted-foreground">{distance.toFixed(1)} km</p>
            </div>
          )}
        </div>

        {/* Indicateur de progression */}
        <div className="flex px-4 pb-2">
          <div className="flex items-center w-full">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'pickup' ? 'bg-primary text-white' : 'bg-primary text-white'
            }`}>
              {pickup ? <CheckCircle className="w-4 h-4" /> : '1'}
            </div>
            <div className={`flex-1 h-1 mx-2 rounded ${
              step !== 'pickup' ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'destination' ? 'bg-primary text-white' : 
              destination ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}>
              {destination ? <CheckCircle className="w-4 h-4" /> : '2'}
            </div>
            <div className={`flex-1 h-1 mx-2 rounded ${
              step === 'confirm' ? 'bg-primary' : 'bg-muted'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'confirm' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
            }`}>
              3
            </div>
          </div>
        </div>
      </div>

      {/* Carte */}
      <div className="relative h-[45vh]">
        <GoogleMapsKwenda
          pickup={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : undefined}
          destination={destination ? { lat: destination.coordinates[1], lng: destination.coordinates[0] } : undefined}
          showRoute={!!(pickup && destination)}
          center={pickup ? { lat: pickup.coordinates[1], lng: pickup.coordinates[0] } : { lat: 4.0383, lng: 21.7587 }}
          zoom={13}
          height="45vh"
          deliveryMode="flash"
          onLocationSelect={(coordinates) => {
            if (step === 'pickup') {
              GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                setPickup({ 
                  address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`, 
                  coordinates: [coordinates.lng, coordinates.lat]
                });
                setPickupSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
                setStep('destination');
              });
            } else if (step === 'destination') {
              GeocodingService.reverseGeocode(coordinates.lng, coordinates.lat).then(address => {
                setDestination({ 
                  address: address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`, 
                  coordinates: [coordinates.lng, coordinates.lat]
                });
                setDestinationSearch(address || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`);
                setStep('confirm');
              });
            }
          }}
        />
      </div>

      {/* Interface principale */}
      <div className="bg-white rounded-t-3xl mt-[-20px] relative z-10 min-h-[55vh]">
        <div className="p-6 space-y-6">
          
          {/* Étape 1: Point de départ */}
          {(step === 'pickup' || pickup) && (
            <Card className="p-4 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">Point de départ</label>
                  {step === 'pickup' ? (
                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Entrez l'adresse de départ..."
                        value={pickupSearch}
                        onChange={(e) => setPickupSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, true)}
                        className="flex-1"
                        disabled={isLoading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCurrentLocation}
                        disabled={isLoading}
                        className="px-3"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Target className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 font-medium">{pickup?.address}</p>
                  )}
                </div>
                {pickup && step !== 'pickup' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('pickup')}
                    className="text-primary"
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Étape 2: Destination */}
          {(step === 'destination' || destination) && pickup && (
            <Card className="p-4 border-secondary/20 bg-secondary/5">
              <div className="flex items-center gap-3">
                <MapPin className="w-3 h-3 text-secondary flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">Destination</label>
                  {step === 'destination' ? (
                    <Input
                      placeholder="Où livrer ?"
                      value={destinationSearch}
                      onChange={(e) => setDestinationSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(destinationSearch, false)}
                      className="mt-2"
                      disabled={isLoading}
                      autoFocus
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground mt-1 font-medium">{destination?.address}</p>
                  )}
                </div>
                {destination && step !== 'destination' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('destination')}
                    className="text-secondary"
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Étape 3: Choix du mode et confirmation */}
          {step === 'confirm' && pickup && destination && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Choisissez votre mode de livraison</h3>
              
              <div className="grid gap-3">
                {deliveryOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedMode === option.id;
                  const price = option.priceEstimator(distance);
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => setSelectedMode(option.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                          : 'border-border hover:border-primary/30 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">{option.name}</h4>
                            <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{price.toLocaleString()} FC</p>
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

              {/* Résumé rapide */}
              <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">Récapitulatif</p>
                      <p className="text-sm text-muted-foreground">{distance.toFixed(1)} km • {deliveryOptions.find(o => o.id === selectedMode)?.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{estimatedPrice.toLocaleString()} FC</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Bouton d'action */}
        <div className="sticky bottom-0 p-6 bg-white border-t border-border">
          {step === 'pickup' && (
            <Button
              onClick={handleCurrentLocation}
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white font-semibold text-base rounded-xl"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Localisation...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Utiliser ma position
                </div>
              )}
            </Button>
          )}

          {step === 'destination' && pickup && (
            <Button
              onClick={() => handleLocationSearch(destinationSearch, false)}
              disabled={!destinationSearch.trim() || isLoading}
              className="w-full h-12 bg-secondary hover:bg-secondary-dark text-white font-semibold text-base rounded-xl"
            >
              Continuer
            </Button>
          )}

          {step === 'confirm' && pickup && destination && (
            <Button
              onClick={handleQuickBook}
              disabled={orderLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold text-base rounded-xl shadow-lg"
            >
              {orderLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Création de la commande...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Réserver maintenant • {estimatedPrice.toLocaleString()} FC
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OneClickDeliveryInterface;