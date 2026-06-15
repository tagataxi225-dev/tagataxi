/**
 * 🧪 COMPOSANT DE TEST POUR LE SYSTÈME TAXI UNIFIÉ
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AutocompleteLocationInput from '@/components/location/AutocompleteLocationInput';
import { useModernTaxiBooking } from '@/hooks/useModernTaxiBooking';
import { unifiedToLocationData } from '@/utils/locationConverters';
import { LocationData } from '@/types/location';
import { nativeGeolocationService } from '@/services/nativeGeolocationService';
import { 
  MapPin, Car, Loader2, CheckCircle, AlertTriangle, Clock, DollarSign
} from 'lucide-react';

export function TaxiTestComponent() {
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [destination, setDestination] = useState<LocationData | null>(null);
  const [testResults, setTestResults] = useState<{
    geolocation: 'pending' | 'success' | 'error';
    search: 'pending' | 'success' | 'error';
    booking: 'pending' | 'success' | 'error';
  }>({ geolocation: 'pending', search: 'pending', booking: 'pending' });

  const { isCreatingBooking, isSearchingDriver, createBooking, lastBooking, error: bookingError } = useModernTaxiBooking();
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const testGeolocation = async () => {
    if (currentLocation) {
      setTestResults(prev => ({ ...prev, geolocation: 'success' }));
      toast.success(`Géolocalisation: ${currentLocation.address}`);
      return;
    }
    
    setGeoLoading(true);
    setTestResults(prev => ({ ...prev, geolocation: 'pending' }));
    
    try {
      const position = await nativeGeolocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      const location: LocationData = {
        address: `Position actuelle (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`,
        lat: position.lat, lng: position.lng,
        accuracy: position.accuracy || 50, type: 'current'
      };
      setCurrentLocation(location);
      setTestResults(prev => ({ ...prev, geolocation: 'success' }));
      toast.success(`Géolocalisation: ${location.address}`);
    } catch (err) {
      setTestResults(prev => ({ ...prev, geolocation: 'error' }));
      toast.error('Géolocalisation échoué');
    } finally {
      setGeoLoading(false);
    }
  };

  const testAddressSearch = () => {
    if (pickup && destination) {
      setTestResults(prev => ({ ...prev, search: 'success' }));
      toast.success('Recherche adresses: OK');
    } else {
      setTestResults(prev => ({ ...prev, search: 'error' }));
      toast.error('Sélectionnez pickup et destination');
    }
  };

  const testBooking = async () => {
    if (!pickup || !destination) { toast.error('Sélectionnez les adresses d\'abord'); return; }
    try {
      setTestResults(prev => ({ ...prev, booking: 'pending' }));
      const bookingData = {
        pickup: { address: pickup.address, lat: pickup.lat, lng: pickup.lng, accuracy: 10, confidence: 0.9, source: 'test', timestamp: Date.now(), type: 'precise' as const },
        destination: { address: destination.address, lat: destination.lat, lng: destination.lng, accuracy: 10, confidence: 0.9, source: 'test', timestamp: Date.now(), type: 'precise' as const },
        vehicleType: 'taxi_standard', passengers: 1, estimatedPrice: 5000, distance: 10, notes: 'Test de réservation via interface moderne'
      };
      const result = await createBooking(bookingData);
      if (result) { setTestResults(prev => ({ ...prev, booking: 'success' })); toast.success(`Réservation créée: ${result.id}`); }
      else { setTestResults(prev => ({ ...prev, booking: 'error' })); }
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, booking: 'error' }));
      toast.error('Échec réservation: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'pending': return <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />;
      default: return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-success text-success-foreground">OK</Badge>;
      case 'error': return <Badge variant="destructive">ERREUR</Badge>;
      case 'pending': return <Badge variant="secondary">EN COURS</Badge>;
      default: return <Badge variant="outline">ATTENTE</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Test Système Taxi Unifié
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">{getStatusIcon(testResults.geolocation)}<span className="font-medium">Géolocalisation</span></div>
                {getStatusBadge(testResults.geolocation)}
              </div>
              <Button variant="outline" size="sm" onClick={testGeolocation} className="w-full mt-2" disabled={geoLoading}>
                {geoLoading ? 'Test en cours...' : 'Tester'}
              </Button>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">{getStatusIcon(testResults.search)}<span className="font-medium">Recherche Adresses</span></div>
                {getStatusBadge(testResults.search)}
              </div>
              <Button variant="outline" size="sm" onClick={testAddressSearch} className="w-full mt-2">Tester</Button>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">{getStatusIcon(testResults.booking)}<span className="font-medium">Réservation</span></div>
                {getStatusBadge(testResults.booking)}
              </div>
              <Button variant="outline" size="sm" onClick={testBooking} className="w-full mt-2" disabled={isCreatingBooking || isSearchingDriver}>
                {isCreatingBooking ? 'Création...' : isSearchingDriver ? 'Recherche...' : 'Tester'}
              </Button>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Point de départ</label>
              <AutocompleteLocationInput placeholder="Rechercher une adresse de départ..." onChange={(location) => setPickup(location ? unifiedToLocationData(location) : null)} types={['establishment', 'geocode']} />
              {pickup && <div className="text-xs text-muted-foreground">📍 {pickup.lat.toFixed(6)}, {pickup.lng.toFixed(6)}</div>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" />Destination</label>
              <AutocompleteLocationInput placeholder="Rechercher une destination..." onChange={(location) => setDestination(location ? unifiedToLocationData(location) : null)} types={['establishment', 'geocode']} />
              {destination && <div className="text-xs text-muted-foreground">📍 {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}</div>}
            </div>
          </div>

          {currentLocation && (
            <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4">
              <h4 className="font-medium text-primary mb-2">Position actuelle détectée</h4>
              <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
              <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                <span>Lat: {currentLocation.lat.toFixed(6)}</span>
                <span>Lng: {currentLocation.lng.toFixed(6)}</span>
                <span>Précision: {currentLocation.accuracy ? `${currentLocation.accuracy}m` : 'N/A'}</span>
              </div>
            </CardContent></Card>
          )}

          {lastBooking && (
            <Card className="bg-success/5 border-success/20"><CardContent className="p-4">
              <h4 className="font-medium text-success mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" />Dernière réservation réussie</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2"><span>ID:</span><code className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{lastBooking.id.slice(0, 8)}...</code></div>
                <div className="flex items-center gap-2"><span>Status:</span>
                  <Badge variant={lastBooking.status === 'driver_assigned' ? 'default' : lastBooking.status === 'pending' ? 'secondary' : 'outline'}>
                    {lastBooking.status === 'driver_assigned' ? 'Chauffeur assigné' : lastBooking.status === 'pending' ? 'En attente' : lastBooking.status}
                  </Badge>
                </div>
                {lastBooking.driverAssigned && <div className="flex items-center gap-2"><span>Arrivée estimée:</span><Badge variant="outline">{lastBooking.driverAssigned.estimatedArrival} min</Badge></div>}
              </div>
            </CardContent></Card>
          )}

          {bookingError && (
            <Card className="bg-destructive/5 border-destructive/20"><CardContent className="p-4">
              <h4 className="font-medium text-destructive mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Erreur</h4>
              <p className="text-sm text-destructive">{bookingError}</p>
            </CardContent></Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
