import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTaxiBooking } from '@/hooks/useTaxiBooking';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { MapPin, Navigation, DollarSign, Car, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

export default function SimpleTaxiBooking() {
  const { createBooking, getEstimatedPrice, loading } = useTaxiBooking();
  const { currentLocation, getCurrentPosition, loading: gpsLoading } = useSmartGeolocation();
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [vehicleClass, setVehicleClass] = useState<string>('standard');
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // Pré-remplir avec la position GPS réelle
  useEffect(() => {
    getCurrentPosition().then((loc) => {
      if (loc) {
        setPickupLocation(loc.address || 'Ma position');
        setPickupCoords({ lat: loc.lat, lng: loc.lng });
      }
    }).catch(() => {
      console.warn('⚠️ GPS non disponible pour SimpleTaxiBooking');
    });
  }, []);

  const handlePickupSelect = (address: string, lat: number, lng: number) => {
    setPickupLocation(address);
    setPickupCoords({ lat, lng });
    if (destinationCoords) {
      calculatePrice(lat, lng, destinationCoords.lat, destinationCoords.lng);
    }
  };

  const handleDestinationSelect = (address: string, lat: number, lng: number) => {
    setDestination(address);
    setDestinationCoords({ lat, lng });
    if (pickupCoords) {
      calculatePrice(pickupCoords.lat, pickupCoords.lng, lat, lng);
    }
  };

  const calculatePrice = async (pickupLat: number, pickupLng: number, destLat: number, destLng: number) => {
    const price = await getEstimatedPrice(
      { lat: pickupLat, lng: pickupLng },
      { lat: destLat, lng: destLng },
      vehicleClass
    );
    setEstimatedPrice(price);
  };

  const handleBooking = async () => {
    if (!pickupLocation || !destination || !pickupCoords || !destinationCoords) {
      toast.error('Veuillez renseigner le point de départ et la destination');
      return;
    }

    const bookingId = await createBooking({
      pickup_location: pickupLocation,
      destination: destination,
      pickup_coordinates: pickupCoords,
      destination_coordinates: destinationCoords,
      vehicle_class: vehicleClass,
      estimated_price: estimatedPrice || 0
    });

    if (bookingId) {
      toast.success('Réservation créée avec succès !');
      setPickupLocation('');
      setDestination('');
      setPickupCoords(null);
      setDestinationCoords(null);
      setEstimatedPrice(null);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Réserver un taxi</h2>
        <p className="text-muted-foreground">Renseignez votre trajet pour obtenir un tarif</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            Point de départ
          </Label>
          <div className="relative">
            <Input
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder={gpsLoading ? 'Détection GPS...' : 'Ex: Gombe, Kinshasa'}
              disabled={gpsLoading}
            />
            {gpsLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-primary" />
            Destination
          </Label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Ex: Aéroport N'djili"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">
            <Car className="w-4 h-4 text-primary" />
            Classe de véhicule
          </Label>
          <Select value={vehicleClass} onValueChange={setVehicleClass}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="vip">VIP</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {estimatedPrice !== null && (
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="w-4 h-4" />
                Prix estimé
              </span>
              <span className="text-2xl font-bold text-primary">
                {estimatedPrice.toLocaleString()} CDF
              </span>
            </div>
          </Card>
        )}

        <Button
          onClick={handleBooking}
          className="w-full"
          size="lg"
          disabled={loading || !pickupLocation || !destination}
        >
          {loading ? 'Réservation en cours...' : 'Réserver maintenant'}
        </Button>
      </div>
    </Card>
  );
}
