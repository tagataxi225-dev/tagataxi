import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Car,
  Navigation,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RideRequestFlowProps {
  onSuccess?: (bookingId: string) => void;
  onCancel?: () => void;
}

interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface RideRequest {
  pickup_location: string;
  destination_location: string;
  pickup_coordinates: LocationCoordinates;
  destination_coordinates: LocationCoordinates;
  vehicle_class: string;
  passenger_count: number;
  scheduled_time?: string;
  special_instructions?: string;
}

export const RideRequestFlow: React.FC<RideRequestFlowProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { isLoaded } = useGoogleMaps();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);
  
  const [request, setRequest] = useState<RideRequest>({
    pickup_location: '',
    destination_location: '',
    pickup_coordinates: { lat: 0, lng: 0 },
    destination_coordinates: { lat: 0, lng: 0 },
    vehicle_class: 'standard',
    passenger_count: 1,
    scheduled_time: '',
    special_instructions: ''
  });

  const geocodeAddress = async (address: string): Promise<LocationCoordinates | null> => {
    if (!isLoaded || !address.trim()) return null;

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ 
        address: `${address}, Kinshasa, République Démocratique du Congo` 
      });

      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng()
        };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  const calculatePrice = async () => {
    if (!request.pickup_coordinates.lat || !request.destination_coordinates.lat) return;

    try {
      const { data, error } = await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'calculate_price',
          pickup: request.pickup_coordinates,
          destination: request.destination_coordinates,
          vehicleClass: request.vehicle_class,
          passengerCount: request.passenger_count
        }
      });

      if (error) throw error;
      
      if (data?.estimatedPrice) {
        setEstimatedPrice(data.estimatedPrice);
      }
    } catch (error) {
      console.error('Error calculating price:', error);
      // Fallback calculation
      const distance = calculateDistance(
        request.pickup_coordinates,
        request.destination_coordinates
      );
      const basePrice = 2000;
      const pricePerKm = request.vehicle_class === 'premium' ? 400 : 300;
      setEstimatedPrice(Math.round(basePrice + (distance * pricePerKm)));
    }
  };

  const calculateDistance = (from: LocationCoordinates, to: LocationCoordinates): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleLocationBlur = async (field: 'pickup_location' | 'destination_location') => {
    const address = request[field];
    if (!address.trim()) return;

    const coordinates = await geocodeAddress(address);
    if (coordinates) {
      const coordField = field === 'pickup_location' ? 'pickup_coordinates' : 'destination_coordinates';
      setRequest(prev => ({
        ...prev,
        [coordField]: coordinates
      }));
    } else {
      toast.error('Adresse non trouvée. Veuillez vérifier et réessayer.');
    }
  };

  const submitRequest = async () => {
    if (!user) {
      toast.error('Vous devez être connecté pour commander une course');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transport_bookings')
        .insert({
          pickup_location: request.pickup_location,
          destination: request.destination_location,
          vehicle_type: request.vehicle_class,
          estimated_price: estimatedPrice,
          status: 'pending'
        } as any)
        .select()
        .single();

      if (error) throw error;

      // Try to dispatch the ride
      await supabase.functions.invoke('ride-dispatcher', {
        body: {
          action: 'dispatch_ride',
          bookingId: data.id,
          pickup: request.pickup_coordinates,
          vehicleClass: request.vehicle_class
        }
      });

      toast.success('Course demandée avec succès!');
      onSuccess?.(data.id);
    } catch (error: any) {
      console.error('Error submitting ride request:', error);
      toast.error('Erreur lors de la demande de course');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (request.pickup_coordinates.lat && request.destination_coordinates.lat) {
      calculatePrice();
    }
  }, [request.pickup_coordinates, request.destination_coordinates, request.vehicle_class]);

  const vehicleOptions = [
    {
      value: 'standard',
      label: 'Standard',
      description: 'Véhicule économique pour 1-4 passagers',
      icon: <Car className="h-5 w-5" />,
      multiplier: 1
    },
    {
      value: 'premium',
      label: 'Premium',
      description: 'Véhicule confortable pour 1-4 passagers',
      icon: <Car className="h-5 w-5" />,
      multiplier: 1.3
    },
    {
      value: 'xl',
      label: 'XL',
      description: 'Véhicule spacieux pour 5-7 passagers',
      icon: <Users className="h-5 w-5" />,
      multiplier: 1.5
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
            `}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-12 h-0.5 mx-2 ${currentStep > step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Locations */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lieux de prise en charge et destination
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="pickup">Point de départ</Label>
              <Input
                id="pickup"
                placeholder="Entrez votre adresse de départ"
                value={request.pickup_location}
                onChange={(e) => setRequest(prev => ({ ...prev, pickup_location: e.target.value }))}
                onBlur={() => handleLocationBlur('pickup_location')}
              />
            </div>

            <div>
              <Label htmlFor="destination">Destination</Label>
              <Input
                id="destination"
                placeholder="Entrez votre destination"
                value={request.destination_location}
                onChange={(e) => setRequest(prev => ({ ...prev, destination_location: e.target.value }))}
                onBlur={() => handleLocationBlur('destination_location')}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                onClick={() => setCurrentStep(2)}
                disabled={!request.pickup_location || !request.destination_location}
              >
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Vehicle and Options */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Type de véhicule et options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Type de véhicule</Label>
              <RadioGroup
                value={request.vehicle_class}
                onValueChange={(value) => setRequest(prev => ({ ...prev, vehicle_class: value }))}
                className="mt-2"
              >
                {vehicleOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <label htmlFor={option.value} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-muted-foreground">{option.description}</div>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="passengers">Nombre de passagers</Label>
              <Input
                id="passengers"
                type="number"
                min={1}
                max={7}
                value={request.passenger_count}
                onChange={(e) => setRequest(prev => ({ ...prev, passenger_count: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label htmlFor="scheduled">Course programmée (optionnel)</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                min={new Date().toISOString().slice(0, 16)}
                value={request.scheduled_time}
                onChange={(e) => setRequest(prev => ({ ...prev, scheduled_time: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions spéciales (optionnel)</Label>
              <Input
                id="instructions"
                placeholder="Ex: Appelez en arrivant, étage 3..."
                value={request.special_instructions}
                onChange={(e) => setRequest(prev => ({ ...prev, special_instructions: e.target.value }))}
              />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                Retour
              </Button>
              <Button onClick={() => setCurrentStep(3)}>
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Summary and Confirmation */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Résumé et confirmation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-green-600 mt-1" />
                <div>
                  <div className="font-medium">Départ</div>
                  <div className="text-sm text-muted-foreground">{request.pickup_location}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-red-600 mt-1" />
                <div>
                  <div className="font-medium">Destination</div>
                  <div className="text-sm text-muted-foreground">{request.destination_location}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <span>
                  {vehicleOptions.find(v => v.value === request.vehicle_class)?.label} - 
                  {request.passenger_count} passager{request.passenger_count > 1 ? 's' : ''}
                </span>
              </div>

              {request.scheduled_time && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span>
                    Programmée pour {new Date(request.scheduled_time).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            {estimatedPrice && (
              <div className="bg-primary/5 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Prix estimé</span>
                  <span className="text-2xl font-bold text-primary">
                    {estimatedPrice.toLocaleString()} CDF
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Le prix final peut varier selon le trafic et la distance réelle
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                Retour
              </Button>
              <Button 
                onClick={submitRequest}
                disabled={loading || !estimatedPrice}
                className="min-w-32"
              >
                {loading ? 'Demande...' : 'Confirmer la course'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};