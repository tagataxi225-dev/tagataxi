import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Car,
  Bike,
  Truck,
  Star,
  Shield,
  Clock,
  Users,
  Fuel,
  Settings,
  CheckCircle,
  MapPinIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface VehicleCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface RentalVehicle {
  id: string;
  category_id: string;
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
  features: string[];
  images: string[];
  license_plate: string;
  location_address: string;
}

interface VehicleRentalInterfaceProps {
  onCancel: () => void;
  onBookingComplete: (booking: any) => void;
}

const VehicleRentalInterface = ({ onCancel, onBookingComplete }: VehicleRentalInterfaceProps) => {
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [vehicles, setVehicles] = useState<RentalVehicle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<RentalVehicle | null>(null);
  const [rentalDurationType, setRentalDurationType] = useState<'hourly' | 'half_day' | 'daily' | 'weekly'>('daily');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [step, setStep] = useState<'category' | 'vehicle' | 'details' | 'confirmation'>('category');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchVehicles();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('rental_vehicle_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
      if (data && data.length > 0) {
        setSelectedCategory(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les catégories de véhicules',
        variant: 'destructive'
      });
    }
  };

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rental_vehicles')
        .select('*')
        .eq('is_available', true)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVehicles((data || []).map(vehicle => ({
        ...vehicle,
        features: Array.isArray(vehicle.features) ? vehicle.features.map(f => String(f)) : [],
        images: Array.isArray(vehicle.images) ? vehicle.images.map(i => String(i)) : []
      })));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les véhicules',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Bike': return Bike;
      case 'Car': return Car;
      case 'Truck': return Truck;
      default: return Car;
    }
  };

  const calculateTotalPrice = () => {
    if (!selectedVehicle || !startDate || !endDate) return 0;

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (rentalDurationType) {
      case 'hourly':
        return selectedVehicle.hourly_rate * Math.max(1, days * 24);
      case 'half_day':
        return selectedVehicle.daily_rate * 0.6 * Math.max(1, days);
      case 'daily':
        return selectedVehicle.daily_rate * Math.max(1, days);
      case 'weekly':
        const weeks = Math.ceil(days / 7);
        return selectedVehicle.weekly_rate * weeks;
      default:
        return selectedVehicle.daily_rate * Math.max(1, days);
    }
  };

  const handleBooking = async () => {
    if (!selectedVehicle || !startDate || !endDate || !pickupLocation) return;

    setIsSubmitting(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: 'Authentification requise',
          description: 'Vous devez être connecté pour effectuer une réservation',
          variant: 'destructive'
        });
        return;
      }

      const bookingData = {
        user_id: user.user.id,
        vehicle_id: selectedVehicle.id,
        rental_duration_type: rentalDurationType,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        pickup_location: pickupLocation,
        return_location: returnLocation || pickupLocation,
        total_amount: calculateTotalPrice(),
        security_deposit: selectedVehicle.security_deposit,
        special_requests: specialRequests,
        status: 'pending'
      };

      const { data, error } = await supabase
        .from('rental_bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Réservation créée',
        description: 'Votre demande de location a été enregistrée avec succès'
      });

      onBookingComplete({
        bookingId: data.id,
        vehicle: selectedVehicle,
        totalPrice: calculateTotalPrice(),
        startDate,
        endDate,
        durationType: rentalDurationType
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la réservation. Veuillez réessayer.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => 
    selectedCategory ? vehicle.category_id === selectedCategory : true
  );

  const renderCategorySelection = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => {
          const IconComponent = getIconComponent(category.icon);
          const categoryVehicles = vehicles.filter(v => v.category_id === category.id);
          const minPrice = Math.min(...categoryVehicles.map(v => v.daily_rate));
          
          return (
            <button
              key={category.id}
              onClick={() => {
                setSelectedCategory(category.id);
                setStep('vehicle');
              }}
              className="w-full p-5 rounded-2xl border bg-card shadow-sm hover:shadow-md hover:border-primary/60 text-left transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center text-background">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{categoryVehicles.length} véhicule(s) disponible(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">à partir de {minPrice.toLocaleString()} FC</p>
                  <p className="text-xs text-muted-foreground">par jour</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderVehicleSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('category')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Choisir un véhicule</h2>
      </div>

      <Tabs value={rentalDurationType} onValueChange={(value: any) => setRentalDurationType(value)}>
        <TabsList className="w-full bg-muted/50 p-1 rounded-full grid grid-cols-4">
          <TabsTrigger value="hourly" className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground">Heure</TabsTrigger>
          <TabsTrigger value="half_day" className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground">Demi-journée</TabsTrigger>
          <TabsTrigger value="daily" className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground">Jour</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-background data-[state=active]:text-foreground">Semaine</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="rounded-2xl shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          filteredVehicles.map((vehicle) => {
            const IconComponent = getIconComponent(vehicle.vehicle_type === 'moto' ? 'Bike' : vehicle.vehicle_type === 'utility' ? 'Truck' : 'Car');
            const dailyRate = rentalDurationType === 'hourly' ? vehicle.hourly_rate : 
                            rentalDurationType === 'half_day' ? vehicle.daily_rate * 0.6 :
                            rentalDurationType === 'weekly' ? vehicle.weekly_rate / 7 :
                            vehicle.daily_rate;
            
            return (
              <Card key={vehicle.id} className="cursor-pointer rounded-2xl border shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setStep('details');
                    }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center text-background">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model} ({vehicle.year})</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{vehicle.seats} places</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Fuel className="w-3 h-3" />
                            <span>{vehicle.fuel_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Settings className="w-3 h-3" />
                            <span>{vehicle.transmission}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2">
                          <MapPinIcon className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{vehicle.location_address}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {vehicle.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {vehicle.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{vehicle.features.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">{dailyRate.toLocaleString()} FC</p>
                      <p className="text-xs text-muted-foreground">
                        par {rentalDurationType === 'hourly' ? 'heure' : 
                             rentalDurationType === 'half_day' ? 'demi-journée' :
                             rentalDurationType === 'weekly' ? 'jour' : 'jour'}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Caution: {vehicle.security_deposit.toLocaleString()} FC
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );

  const renderBookingDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStep('vehicle')}
          className="p-2"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Détails de la réservation</h2>
      </div>

      {selectedVehicle && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-xl flex items-center justify-center text-background">
                <Car className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{selectedVehicle.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model}</p>
                <p className="text-lg font-bold text-primary">{calculateTotalPrice().toLocaleString()} FC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Date de début</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'dd/MM/yyyy', { locale: fr }) : 'Choisir'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Date de fin</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start mt-1">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Choisir'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date < (startDate || new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Lieu de récupération</label>
          <Input
            placeholder="Adresse de récupération"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Lieu de retour (optionnel)</label>
          <Input
            placeholder="Même lieu que la récupération"
            value={returnLocation}
            onChange={(e) => setReturnLocation(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Demandes spéciales (optionnel)</label>
          <Input
            placeholder="Ex: GPS, siège bébé, etc."
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {selectedVehicle && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold text-foreground mb-3">Résumé des coûts</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium">{calculateTotalPrice().toLocaleString()} FC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Caution</span>
                <span className="font-medium">{selectedVehicle.security_deposit.toLocaleString()} FC</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total à payer</span>
                <span>{(calculateTotalPrice() + selectedVehicle.security_deposit).toLocaleString()} FC</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleBooking}
        disabled={!selectedVehicle || !startDate || !endDate || !pickupLocation || isSubmitting}
        className="w-full h-12 btn-modern bg-gradient-to-r from-primary to-primary-glow text-background"
      >
        {isSubmitting ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
            Création en cours...
          </div>
        ) : (
          'Confirmer la réservation'
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header role="banner">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="p-2 hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">LOCATION DE VÉHICULES</h1>
            <p className="text-sm text-muted-foreground">Kinshasa - Véhicules disponibles</p>
          </div>
        </div>
      </div>
      </header>

      {/* Content */}
      <main className="container mx-auto max-w-screen-lg p-4 pb-24">
        {step === 'category' && renderCategorySelection()}
        {step === 'vehicle' && renderVehicleSelection()}
        {step === 'details' && renderBookingDetails()}
      </main>
    </div>
  );
};

export default VehicleRentalInterface;