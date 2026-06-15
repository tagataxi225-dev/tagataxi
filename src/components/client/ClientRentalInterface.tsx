import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CalendarDays, Car, MapPin, Users, Star, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';

interface RentalVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  vehicle_type: string;
  fuel_type: string;
  transmission: string;
  seats: number;
  daily_rate: number;
  hourly_rate: number;
  weekly_rate: number;
  security_deposit: number;
  driver_available?: boolean;
  driver_required?: boolean;
  with_driver_daily_rate?: number;
  with_driver_hourly_rate?: number;
  without_driver_daily_rate?: number;
  without_driver_hourly_rate?: number;
  driver_equipment?: string[];
  vehicle_equipment?: string[];
  features: string[];
  images: string[];
  location_address: string;
  city: string;
  comfort_level: string;
  equipment: string[];
  is_active: boolean;
  is_available: boolean;
  moderation_status: string;
}

const ClientRentalInterface = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const [priceRange, setPriceRange] = useState<[number, number]>([10000, 100000]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('all');

  // Fetch available vehicles
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['client-rental-vehicles', selectedCity, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('rental_vehicles')
        .select('*')
        .eq('is_active', true)
        .eq('is_available', true)
        .eq('moderation_status', 'approved')
        .eq('city', selectedCity)
        .order('daily_rate', { ascending: true });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fallback: if no results for city, fetch all cities
      if (!data || data.length === 0) {
        console.log('⚠️ No rental vehicles in', selectedCity, '— falling back to all cities');
        let fallbackQuery = supabase
          .from('rental_vehicles')
          .select('*')
          .eq('is_active', true)
          .eq('is_available', true)
          .eq('moderation_status', 'approved')
          .order('daily_rate', { ascending: true });

        if (searchTerm) {
          fallbackQuery = fallbackQuery.or(`name.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`);
        }

        const { data: allData, error: allError } = await fallbackQuery;
        if (allError) throw allError;
        return (allData || []) as RentalVehicle[];
      }

      return (data || []) as RentalVehicle[];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesPrice = vehicle.daily_rate >= priceRange[0] && vehicle.daily_rate <= priceRange[1];
    const matchesType = selectedVehicleType === 'all' || vehicle.vehicle_type === selectedVehicleType;
    return matchesPrice && matchesType;
  });

  const vehicleTypes = Array.from(new Set(vehicles.map(v => v.vehicle_type)));

  const formatPrice = (price: number) => `${price.toLocaleString()} CDF`;

  const handleBooking = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        toast.error('Véhicule introuvable');
        return;
      }

      // Créer une réservation de location
      const { data: booking, error } = await supabase
        .from('rental_bookings')
        .insert({
          vehicle_id: vehicleId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          pickup_location: 'À définir',
          rental_duration_type: 'daily',
          total_amount: vehicle.daily_rate,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Demande de réservation envoyée !', {
        description: `Le partenaire va confirmer votre réservation pour ${vehicle.brand} ${vehicle.model}`
      });

      logger.info('Rental booking created', { bookingId: booking.id, vehicleId });
    } catch (error) {
      logger.error('Erreur création réservation location', error);
      toast.error('Erreur lors de la réservation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement des véhicules disponibles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-congo-primary via-congo-gold to-congo-red bg-clip-text text-transparent">
          Location de Véhicules
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Trouvez le véhicule parfait pour vos besoins dans toute l'Afrique francophone
        </p>
      </div>

      {/* Filters */}
      <Card className="bg-card border border-border shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-gradient-primary">
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 block">Rechercher</label>
              <Input
                placeholder="Nom, marque, modèle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/20 border-white/30 backdrop-blur-sm rounded-xl focus:bg-white/30 transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 block">Ville</label>
              <select 
                className="w-full p-3 bg-white/20 border border-white/30 rounded-xl backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all duration-300 text-foreground"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <option value="Kinshasa">Kinshasa</option>
                <option value="Lubumbashi">Lubumbashi</option>
                <option value="Kolwezi">Kolwezi</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80 block">Type de véhicule</label>
              <select 
                className="w-full p-3 bg-white/20 border border-white/30 rounded-xl backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all duration-300 text-foreground"
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
              >
                <option value="all">Tous types</option>
                {vehicleTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground/80 block">
                Budget: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer range-modern"
                />
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="5000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer range-modern"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filteredVehicles.length} véhicule(s) disponible(s)
          </h2>
          {filteredVehicles.length === 0 && vehicles.length > 0 && (
            <p className="text-muted-foreground">
              Essayez d'ajuster vos filtres pour voir plus de résultats
            </p>
          )}
        </div>

        {filteredVehicles.length === 0 ? (
          <Card className="bg-card border border-border shadow-lg animate-fadeIn">
            <CardContent className="text-center py-16">
              <div className="relative">
                <Car className="h-20 w-20 text-congo-primary mx-auto mb-6 animate-pulse" />
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-congo-gold rounded-full animate-ping"></div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gradient-primary">Aucun véhicule disponible</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                Nous n'avons trouvé aucun véhicule correspondant à vos critères de recherche.
              </p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVehicleType('all');
                  setPriceRange([10000, 100000]);
                }}
                variant="congo"
                size="lg"
                className="px-8 py-4 text-lg font-semibold shadow-glow hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Star className="h-5 w-5 mr-2" />
                Réinitialiser les filtres
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredVehicles.map((vehicle, index) => (
              <Card 
                key={vehicle.id} 
                className="bg-card border border-border shadow-lg overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-500 animate-scaleIn group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="aspect-video bg-gradient-to-br from-congo-primary/20 to-congo-gold/20 relative overflow-hidden">
                  {vehicle.images.length > 0 ? (
                    <img 
                      src={vehicle.images[0]} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Car className="h-20 w-20 text-congo-primary animate-pulse" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-glow border-0 px-3 py-1">
                      Disponible
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl font-bold text-gradient-primary group-hover:text-congo-gold transition-colors duration-300">
                        {vehicle.name}
                      </CardTitle>
                      <CardDescription className="text-base text-foreground/70">
                        {vehicle.brand} {vehicle.model} {vehicle.year}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {vehicle.driver_available ? (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground line-through">
                            {formatPrice(vehicle.without_driver_daily_rate || vehicle.daily_rate)}
                          </p>
                          <p className="text-2xl font-bold bg-gradient-to-r from-congo-primary to-congo-gold bg-clip-text text-transparent">
                            {formatPrice(vehicle.with_driver_daily_rate || vehicle.daily_rate)}
                          </p>
                          <Badge variant="secondary" className="text-xs">👨‍✈️ Avec chauffeur</Badge>
                        </div>
                      ) : (
                        <>
                          <p className="text-3xl font-bold bg-gradient-to-r from-congo-primary to-congo-gold bg-clip-text text-transparent">
                            {formatPrice(vehicle.without_driver_daily_rate || vehicle.daily_rate)}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">par jour</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Users className="h-4 w-4 text-congo-primary" />
                      <span className="text-sm font-medium">{vehicle.seats} places</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <Clock className="h-4 w-4 text-congo-gold" />
                      <span className="text-sm font-medium">{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <MapPin className="h-4 w-4 text-congo-red" />
                      <span className="text-sm font-medium">{vehicle.city}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <DollarSign className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-medium">
                        {formatPrice(vehicle.driver_available 
                          ? (vehicle.with_driver_hourly_rate || vehicle.hourly_rate)
                          : (vehicle.without_driver_hourly_rate || vehicle.hourly_rate)
                        )}/h
                      </span>
                    </div>
                  </div>

                  {vehicle.features.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground/80">Équipements:</p>
                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.slice(0, 3).map((feature, index) => (
                          <Badge 
                            key={index} 
                            variant="outline" 
                            className="text-xs bg-gradient-to-r from-congo-primary/20 to-congo-gold/20 border-congo-primary/30 hover:border-congo-gold/50 transition-colors duration-300"
                          >
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 3 && (
                          <Badge 
                            variant="outline" 
                            className="text-xs bg-gradient-to-r from-congo-gold/20 to-congo-red/20 border-congo-gold/30"
                          >
                            +{vehicle.features.length - 3} autres
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3 pt-2">
                    <Button 
                      className="w-full group-hover:scale-105 transition-transform duration-300" 
                      onClick={() => handleBooking(vehicle.id)}
                      variant="congo"
                      size="lg"
                    >
                      <CalendarDays className="h-5 w-5 mr-2" />
                      Réserver maintenant
                    </Button>
                    <div className="text-center p-2 rounded-lg bg-white/10 backdrop-blur-sm">
                      <span className="text-sm font-medium text-foreground/70">
                        Caution: <span className="text-congo-gold font-bold">{formatPrice(vehicle.security_deposit)}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientRentalInterface;