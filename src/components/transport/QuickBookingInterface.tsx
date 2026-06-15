import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Clock, 
  MapPin, 
  Car, 
  Bike, 
  Users, 
  Star,
  CreditCard,
  Calendar,
  Share2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlaces } from '@/hooks/usePlaces';
import { useAdvancedRideRequest } from '@/hooks/useAdvancedRideRequest';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { toast } from 'sonner';

interface QuickBookingOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  price: number;
  time: string;
  type: 'moto' | 'eco' | 'standard' | 'premium';
  features: string[];
}

interface ScheduledRide {
  id: string;
  destination: string;
  scheduledTime: string;
  vehicleType: string;
  estimatedPrice: number;
}

export const QuickBookingInterface = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { homePlace, workPlace, recentPlaces } = usePlaces();
  const { createRideRequest, loading, estimatedPrice } = useAdvancedRideRequest();
  const { currentLocation, getCurrentPosition } = useSmartGeolocation();

  // Obtenir la position GPS réelle au montage
  useEffect(() => {
    getCurrentPosition().catch(() => {
      console.warn('⚠️ GPS non disponible pour QuickBooking');
    });
  }, []);
  
  const [selectedOption, setSelectedOption] = useState<QuickBookingOption | null>(null);
  const [favoriteDestination, setFavoriteDestination] = useState<string | null>(null);
  const [scheduledRides, setScheduledRides] = useState<ScheduledRide[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  // Quick booking options based on user preferences and time
  const getQuickOptions = (): QuickBookingOption[] => {
    const hour = new Date().getHours();
    const baseOptions: QuickBookingOption[] = [
      {
        id: 'moto-quick',
        label: 'Moto Express',
        icon: Bike,
        price: 800,
        time: '2-4 min',
        type: 'moto',
        features: ['Ultra rapide', 'Évite trafic']
      },
      {
        id: 'eco-quick',
        label: 'Eco Rapide',
        icon: Car,
        price: 1200,
        time: '5-8 min',
        type: 'eco',
        features: ['Économique', 'Confortable']
      },
      {
        id: 'standard-quick',
        label: 'Standard',
        icon: Car,
        price: 1500,
        time: '5-10 min',
        type: 'standard',
        features: ['Climatisation', 'WiFi']
      },
      {
        id: 'premium-quick',
        label: 'Premium',
        icon: Car,
        price: 2500,
        time: '3-7 min',
        type: 'premium',
        features: ['Luxe', 'Chauffeur pro']
      }
    ];

    return baseOptions;
  };

  const quickOptions = getQuickOptions();

  // Get smart destination suggestions
  const getSmartDestinations = () => {
    const hour = new Date().getHours();
    const suggestions = [];

    // Time-based suggestions
    if (hour >= 6 && hour <= 9 && workPlace) {
      suggestions.push({
        id: 'work',
        label: 'Aller au travail',
        address: workPlace.address,
        coordinates: workPlace.coordinates,
        icon: '🏢'
      });
    } else if (hour >= 17 && hour <= 20 && homePlace) {
      suggestions.push({
        id: 'home',
        label: 'Rentrer à la maison',
        address: homePlace.address,
        coordinates: homePlace.coordinates,
        icon: '🏠'
      });
    }

    // Recent frequently used places
    const frequentPlaces = recentPlaces
      .filter(place => place.usage_count >= 3)
      .slice(0, 2)
      .map(place => ({
        id: place.id,
        label: place.name,
        address: place.address,
        coordinates: place.coordinates,
        icon: '📍'
      }));

    return [...suggestions, ...frequentPlaces].slice(0, 3);
  };

  const smartDestinations = getSmartDestinations();

  // Express booking handler
  const handleExpressBooking = async (destination: any, vehicleType: string) => {
    if (!user) {
      toast.error('Connexion requise');
      return;
    }

    try {
      if (!currentLocation) {
        toast.error('Position GPS non disponible. Veuillez patienter...');
        return;
      }

      const bookingData = {
        pickupLocation: currentLocation.address || 'Ma position actuelle',
        pickupCoordinates: [currentLocation.lng, currentLocation.lat] as [number, number],
        destination: destination.address,
        destinationCoordinates: destination.coordinates ? 
          [destination.coordinates.lng, destination.coordinates.lat] as [number, number] :
          [currentLocation.lng, currentLocation.lat] as [number, number],
        vehicleClass: vehicleType
      };

      const request = await createRideRequest(bookingData);
      
      if (request) {
        toast.success('Course demandée avec succès !');
      }
    } catch (error) {
      console.error('Erreur lors de la réservation:', error);
      toast.error('Erreur lors de la réservation');
    }
  };

  // Schedule a ride for later
  const handleScheduleRide = async (destination: any, vehicleType: string, scheduledTime: string) => {
    if (!user) {
      toast.error('Connexion requise');
      return;
    }

    const newScheduledRide: ScheduledRide = {
      id: `scheduled-${Date.now()}`,
      destination: destination.address,
      scheduledTime,
      vehicleType,
      estimatedPrice: quickOptions.find(opt => opt.type === vehicleType)?.price || 1500
    };

    setScheduledRides(prev => [...prev, newScheduledRide]);
    toast.success('Course programmée avec succès !');
    setIsScheduling(false);
  };

  // Share ride with friends
  const handleShareRide = async (destination: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Partager ma course Tembea',
          text: `Je vais à ${destination.label}. Veux-tu partager la course ?`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Partage annulé');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      const text = `Je vais à ${destination.label}. Veux-tu partager la course ?`;
      navigator.clipboard.writeText(text);
      toast.success('Lien de partage copié !');
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Réservation Express</h2>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Instantané
        </Badge>
      </div>

      {/* Smart Destinations */}
      {smartDestinations.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Destinations suggérées
          </h3>
          <div className="space-y-3">
            {smartDestinations.map((destination) => (
              <div key={destination.id} className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{destination.icon}</span>
                    <div>
                      <p className="font-medium text-sm">{destination.label}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-48">
                        {destination.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShareRide(destination)}
                      className="h-8 w-8 p-0"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsScheduling(true)}
                      className="h-8 w-8 p-0"
                    >
                      <Calendar className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Quick Vehicle Options */}
                <div className="grid grid-cols-2 gap-2">
                  {quickOptions.slice(0, 2).map((option) => (
                    <Button
                      key={option.id}
                      variant="outline"
                      size="sm"
                      className="h-auto p-2 flex flex-col items-start"
                      onClick={() => handleExpressBooking(destination, option.type)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <option.icon className="h-3 w-3" />
                        <span className="font-medium text-xs">{option.label}</span>
                      </div>
                      <div className="flex items-center justify-between w-full mt-1">
                        <span className="text-xs text-muted-foreground">{option.time}</span>
                        <span className="text-xs font-bold text-primary">
                          {option.price} FC
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Scheduled Rides */}
      {scheduledRides.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Courses programmées
          </h3>
          <div className="space-y-3">
            {scheduledRides.map((ride) => (
              <div key={ride.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{ride.destination}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ride.scheduledTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {ride.vehicleType}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{ride.estimatedPrice} FC</p>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Modifier
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* User Preferences & Stats */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          Vos préférences
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Véhicule favori:</span>
              <span className="font-medium">Standard</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paiement par défaut:</span>
              <span className="font-medium flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                Portefeuille
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Courses ce mois:</span>
              <span className="font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Note moyenne:</span>
              <span className="font-medium flex items-center gap-1">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                4.8
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Express Booking CTA */}
      <Card className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Réservation éclair</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Trouvez un taxi en moins de 30 secondes
            </p>
          </div>
          <Zap className="h-8 w-8 text-primary" />
        </div>
        <Button className="w-full mt-3" size="lg">
          Demander un taxi maintenant
        </Button>
      </Card>
    </div>
  );
};