import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useModernRentals } from '@/hooks/useModernRentals';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Car,
  Truck,
  Crown,
  Leaf,
  Star,
  Clock,
  Users,
  Fuel,
  Settings,
  Wifi,
  Navigation,
  Snowflake,
  Camera,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ModernVehicleRentalInterfaceProps {
  onCancel: () => void;
  onBookingComplete: (booking: any) => void;
}

const ModernVehicleRentalInterface = ({ onCancel, onBookingComplete }: ModernVehicleRentalInterfaceProps) => {
  const [selectedCity, setSelectedCity] = useState<string>('Kinshasa');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [step, setStep] = useState<'city' | 'category' | 'vehicle' | 'booking'>('city');
  const [rentalDuration, setRentalDuration] = useState<'hourly' | 'daily' | 'weekly'>('daily');
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [pickupLocation, setPickupLocation] = useState('');
  const [returnLocation, setReturnLocation] = useState('');

  const { 
    categories, 
    vehicles, 
    equipment,
    availableCities,
    isLoading,
    calculateCityPrice,
    getVehiclesByCategory,
    createBooking 
  } = useModernRentals(selectedCity);

  const getIconComponent = (iconName: string, className?: string) => {
    const iconMap: { [key: string]: any } = {
      'Car': Car,
      'Truck': Truck,
      'Crown': Crown,
      'Eco': Leaf,
      'Star': Star,
      'Clock': Clock,
      'Users': Users,
      'Fuel': Fuel,
      'Settings': Settings,
      'Wifi': Wifi,
      'Navigation': Navigation,
      'Snowflake': Snowflake,
      'Camera': Camera,
    };
    const IconComponent = iconMap[iconName] || Car;
    return <IconComponent className={className || "w-6 h-6"} />;
  };

  const getCategoryColor = (_categoryName: string) => {
    // Use design system semantic tokens for consistent theming
    return 'from-primary to-primary-glow';
  };

  const renderCitySelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-3xl flex items-center justify-center">
            <MapPin className="w-10 h-10 text-background" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Choisissez votre ville
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez la ville où vous souhaitez louer un véhicule pour découvrir notre flotte disponible
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availableCities.map((city) => (
            <Card 
              key={city} 
              className="group cursor-pointer rounded-3xl border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              onClick={() => {
                setSelectedCity(city);
                setStep('category');
              }}
            >
              <CardContent className="p-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary-glow/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MapPin className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">{city}</h3>
                <p className="text-muted-foreground">
                  {city === 'Kinshasa' && 'Capital de la RDC'}
                  {city === 'Lubumbashi' && 'Capitale du Katanga'}
                  {city === 'Kolwezi' && 'Ville minière'}
                </p>
                <div className="pt-4">
                  <Button className="w-full rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all">
                    Sélectionner
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCategorySelection = () => (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep('city')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux villes
          </Button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground">Catégories à {selectedCity}</h1>
            <p className="text-muted-foreground">Choisissez le type de véhicule qui vous convient</p>
          </div>
          <div className="w-24" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => {
            const categoryVehicles = getVehiclesByCategory(category.id);
            const minPrice = Math.min(...categoryVehicles.map(v => calculateCityPrice(v.daily_rate, category.id)));
            
            return (
              <Card 
                key={category.id}
                className="group cursor-pointer rounded-3xl border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
                onClick={() => {
                  setSelectedCategory(category.id);
                  setStep('vehicle');
                }}
              >
                <CardContent className="p-0">
                  <div className={`h-32 bg-gradient-to-br ${getCategoryColor(category.name)} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                        {getIconComponent(category.icon, "w-6 h-6 text-white")}
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <Sparkles className="w-8 h-8 text-white/30" />
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-xs">
                        {categoryVehicles.length} véhicule(s)
                      </Badge>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">
                          {isFinite(minPrice) ? `${minPrice.toLocaleString()} FC` : 'Sur demande'}
                        </p>
                        <p className="text-xs text-muted-foreground">par jour</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderVehicleSelection = () => {
    const categoryVehicles = getVehiclesByCategory(selectedCategory);
    const selectedCategoryData = categories.find(c => c.id === selectedCategory);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep('category')} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux catégories
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">
                {selectedCategoryData?.name} à {selectedCity}
              </h1>
              <p className="text-muted-foreground">Sélectionnez votre véhicule préféré</p>
            </div>
            <div className="w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryVehicles.map((vehicle) => {
              const adjustedPrice = calculateCityPrice(vehicle.daily_rate, selectedCategory);
              
              return (
                <Card 
                  key={vehicle.id}
                  className="group cursor-pointer rounded-3xl border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl overflow-hidden"
                  onClick={() => {
                    setSelectedVehicle(vehicle);
                    setStep('booking');
                  }}
                >
                  <CardContent className="p-0">
                    <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center">
                          {getIconComponent(vehicle.vehicle_type === 'utility' ? 'Truck' : 'Car', "w-10 h-10 text-background")}
                        </div>
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-white/90 text-foreground">
                          {vehicle.year}
                        </Badge>
                      </div>
                      {vehicle.comfort_level === 'luxury' && (
                        <div className="absolute top-4 left-4">
                          <Crown className="w-6 h-6 text-amber-500" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6 space-y-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                      
                      <div className="flex flex-wrap gap-1">
                        {vehicle.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {vehicle.features.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{vehicle.features.length - 3}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div>
                          <p className="text-2xl font-bold text-primary">{adjustedPrice.toLocaleString()} FC</p>
                          <p className="text-xs text-muted-foreground">par jour</p>
                        </div>
                        <Button className="rounded-xl bg-gradient-to-r from-primary to-primary-glow">
                          Réserver
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderBookingForm = () => {
    if (!selectedVehicle) return null;
    
    const calculateTotal = () => {
      if (!startDate || !endDate) return 0;
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const basePrice = calculateCityPrice(selectedVehicle.daily_rate, selectedCategory);
      return basePrice * Math.max(1, days);
    };

    const handleBooking = async () => {
      if (!startDate || !endDate || !pickupLocation) return;

      try {
        const bookingData = {
          vehicle_id: selectedVehicle.id,
          rental_duration_type: rentalDuration,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          pickup_location: pickupLocation,
          return_location: returnLocation || pickupLocation,
          total_amount: calculateTotal(),
          security_deposit: selectedVehicle.security_deposit,
        };

        const result = await createBooking.mutateAsync(bookingData);
        
        onBookingComplete({
          bookingId: result.id,
          vehicle: selectedVehicle,
          totalPrice: calculateTotal(),
          startDate,
          endDate,
          city: selectedCity
        });
      } catch (error) {
        console.error('Erreur lors de la réservation:', error);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep('vehicle')} className="rounded-xl">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux véhicules
            </Button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground">Finaliser la réservation</h1>
              <p className="text-muted-foreground">Complétez les détails de votre location</p>
            </div>
            <div className="w-24" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Détails du véhicule */}
            <Card className="rounded-3xl border-0 shadow-elegant">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center">
                      {getIconComponent(selectedVehicle.vehicle_type === 'utility' ? 'Truck' : 'Car', "w-8 h-8 text-background")}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{selectedVehicle.name}</h3>
                      <p className="text-muted-foreground">{selectedVehicle.brand} {selectedVehicle.model}</p>
                      <p className="text-sm text-primary font-semibold">{selectedCity}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix par jour</span>
                      <span className="font-semibold">{calculateCityPrice(selectedVehicle.daily_rate, selectedCategory).toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Caution</span>
                      <span className="font-semibold">{selectedVehicle.security_deposit.toLocaleString()} FC</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-primary pt-2 border-t">
                      <span>Total estimé</span>
                      <span>{calculateTotal().toLocaleString()} FC</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire de réservation */}
            <Card className="rounded-3xl border-0 shadow-elegant">
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">Date de début</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start mt-1 rounded-xl">
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
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground">Date de fin</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start mt-1 rounded-xl">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'dd/MM/yyyy', { locale: fr }) : 'Choisir'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < new Date() || (startDate && date < startDate)}
                          className="rounded-xl"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Lieu de prise en charge</label>
                  <Input 
                    className="mt-1 rounded-xl"
                    placeholder="Adresse de récupération"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Lieu de retour (optionnel)</label>
                  <Input 
                    className="mt-1 rounded-xl"
                    placeholder="Adresse de retour (si différente)"
                    value={returnLocation}
                    onChange={(e) => setReturnLocation(e.target.value)}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={onCancel}
                    className="flex-1 rounded-xl"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleBooking}
                    disabled={!startDate || !endDate || !pickupLocation || createBooking.isPending}
                    className="flex-1 rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
                  >
                    {createBooking.isPending ? 'Création...' : 'Confirmer la réservation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-primary-glow rounded-2xl flex items-center justify-center animate-pulse">
            <Car className="w-8 h-8 text-background" />
          </div>
          <p className="text-muted-foreground">Chargement des véhicules...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {step === 'city' && renderCitySelection()}
      {step === 'category' && renderCategorySelection()}
      {step === 'vehicle' && renderVehicleSelection()}
      {step === 'booking' && renderBookingForm()}
    </>
  );
};

export default ModernVehicleRentalInterface;