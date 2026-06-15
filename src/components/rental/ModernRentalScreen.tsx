import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, MapPin, Clock, Calendar, Users, Fuel, Cog, 
  Star, Shield, ArrowLeft, ChevronDown, Sparkles
} from 'lucide-react';
import { useModernRentals } from '@/hooks/useModernRentals';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils/formatCurrency';

const getCategoryGradient = (categoryName: string) => {
  const gradients: Record<string, string> = {
    'ECO': 'from-success via-success/80 to-success',
    'Berline': 'from-congo-blue via-congo-blue-electric to-congo-blue-vibrant',
    'First Class': 'from-primary via-primary-glow to-primary-light',
    'SUV & 4x4': 'from-congo-green via-congo-green-electric to-congo-green-vibrant',
    'Minibus & Van': 'from-secondary via-secondary-light to-accent',
    'Utilitaires': 'from-grey-600 via-grey-500 to-grey-400',
    'Véhicules Spéciaux': 'from-congo-yellow via-congo-yellow-electric to-congo-yellow-vibrant'
  };
  return gradients[categoryName] || 'from-primary to-secondary';
};

export const ModernRentalScreen = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { 
    userLocation, 
    setUserLocation, 
    categories, 
    vehicles, 
    availableCities,
    isLoading,
    getVehiclesByCategory,
    calculateCityPrice 
  } = useModernRentals();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  const filteredVehicles = selectedCategory 
    ? getVehiclesByCategory(selectedCategory)
    : vehicles;

  const handleBooking = (vehicleId: string) => {
    navigate(`/rental-booking/${vehicleId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Header Skeleton */}
        <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 p-4 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>

        {/* Category Tabs Skeleton */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0" />
            ))}
          </div>
        </div>

        {/* Vehicle Cards Skeleton */}
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Modern Header with Glassmorphism */}
      <div className="sticky top-0 z-10 glassmorphism border-b border-border/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </motion.button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                    {t('rental.title')}
                  </h1>
                  <p className="text-xs text-muted-foreground">{t('rental.subtitle')}</p>
                </div>
              </div>
            </div>
            
            {/* City Selector */}
            <div className="relative">
              <button
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-2 bg-muted/50 hover:bg-muted rounded-lg px-3 py-2 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">{userLocation}</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {cityDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 glassmorphism rounded-lg shadow-lg overflow-hidden"
                  >
                    {availableCities.map((city) => (
                      <button
                        key={city}
                        onClick={() => {
                          setUserLocation(city);
                          setCityDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors ${
                          city === userLocation ? 'bg-primary/10 text-primary font-medium' : ''
                        }`}
                      >
                        {city}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="sticky top-[73px] z-9 bg-background/95 backdrop-blur-sm border-b border-border/20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg'
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              {t('rental.all_vehicles', { count: vehicles.length })}
            </motion.button>
            
            {categories.map((category) => {
              const count = getVehiclesByCategory(category.id).length;
              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${getCategoryGradient(category.name)} text-white shadow-lg`
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                >
                  {category.name} ({count})
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="p-6 bg-muted/30 rounded-full mb-4">
              <Car className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{t('rental.no_vehicles')}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('rental.no_vehicles_desc', { city: userLocation })}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredVehicles.map((vehicle) => (
                <motion.div
                  key={vehicle.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="glassmorphism overflow-hidden hover:shadow-xl transition-all group">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {vehicle.images.length > 0 ? (
                        <img 
                          src={vehicle.images[0]} 
                          alt={vehicle.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                          <Car className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                      
                      {/* Badges Overlay */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1">
                        <Badge className="bg-background/90 backdrop-blur text-foreground border-0">
                          {vehicle.comfort_level}
                        </Badge>
                        {vehicle.is_available && (
                          <Badge className="bg-success/90 backdrop-blur text-white border-0 flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            {t('rental.available')}
                          </Badge>
                        )}
                      </div>

                      {/* Category Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={`bg-gradient-to-r ${getCategoryGradient(categories.find(c => c.id === vehicle.category_id)?.name || '')} text-white border-0`}>
                          {categories.find(c => c.id === vehicle.category_id)?.name}
                        </Badge>
                      </div>
                    </div>

                    <CardContent className="p-4 space-y-3">
                      {/* Title */}
                      <div>
                        <h3 className="font-bold text-lg leading-tight line-clamp-1">{vehicle.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.brand} {vehicle.model} · {vehicle.year}
                        </p>
                      </div>

                      {/* Specs Grid */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>{vehicle.seats} {t('rental.seats')}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Fuel className="h-4 w-4 shrink-0" />
                          <span className="truncate">{vehicle.fuel_type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Cog className="h-4 w-4 shrink-0" />
                          <span className="truncate">{vehicle.transmission}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Shield className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t('rental.insured')}</span>
                        </div>
                      </div>

                      {/* Equipment Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {vehicle.equipment.slice(0, 3).map((eq) => (
                          <Badge key={eq} variant="secondary" className="text-xs">
                            {eq.replace('_', ' ')}
                          </Badge>
                        ))}
                        {vehicle.equipment.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{vehicle.equipment.length - 3}
                          </Badge>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="border-t border-border/50 pt-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{t('rental.per_hour')}</span>
                          </div>
                          <span className="font-semibold">
                            {formatCurrency(calculateCityPrice(vehicle.hourly_rate, vehicle.category_id), 'CDF')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{t('rental.per_day')}</span>
                          </div>
                          <span className="font-bold text-primary text-lg">
                            {formatCurrency(calculateCityPrice(vehicle.daily_rate, vehicle.category_id), 'CDF')}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg transition-all"
                        onClick={() => handleBooking(vehicle.id)}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {t('rental.book_button')}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ModernRentalScreen;
