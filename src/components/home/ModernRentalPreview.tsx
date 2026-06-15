import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModernRentals } from '@/hooks/useModernRentals';
import { 
  Car, 
  Truck, 
  Crown, 
  Leaf, 
  MapPin, 
  Clock, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';

interface ModernRentalPreviewProps {
  onOpenRental: () => void;
}

const ModernRentalPreview = ({ onOpenRental }: ModernRentalPreviewProps) => {
  const [selectedCity, setSelectedCity] = useState('Kinshasa');
  const { categories, vehicles, calculateCityPrice, getVehiclesByCategory } = useModernRentals(selectedCity);

  const getIconComponent = (iconName: string, className?: string) => {
    const iconMap: { [key: string]: any } = {
      'Car': Car,
      'Truck': Truck,
      'Crown': Crown,
      'Eco': Leaf,
    };
    const IconComponent = iconMap[iconName] || Car;
    return <IconComponent className={className || "w-6 h-6"} />;
  };

  const getCategoryColor = (_categoryName: string) => {
    // Use design system semantic tokens for consistent theming
    return 'from-primary to-primary-glow';
  };

  const featuredCategories = categories.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header avec sélection de ville */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Location de véhicules</h2>
          <p className="text-muted-foreground">Découvrez notre flotte moderne</p>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Kinshasa">Kinshasa</option>
            <option value="Lubumbashi">Lubumbashi</option>
            <option value="Kolwezi">Kolwezi</option>
          </select>
        </div>
      </div>

      {/* Grille des catégories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {featuredCategories.map((category) => {
          const categoryVehicles = getVehiclesByCategory(category.id);
          const minPrice = categoryVehicles.length > 0 
            ? Math.min(...categoryVehicles.map(v => calculateCityPrice(v.daily_rate, category.id)))
            : 0;
          
          return (
            <Card 
              key={category.id}
              className="group cursor-pointer rounded-2xl border-2 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg overflow-hidden animate-fade-in"
              onClick={onOpenRental}
            >
              <CardContent className="p-0">
                <div className={`h-24 bg-gradient-to-br ${getCategoryColor(category.name)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10" />
                  <div className="absolute top-3 left-3">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      {getIconComponent(category.icon, "w-4 h-4 text-white")}
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Sparkles className="w-5 h-5 text-white/30" />
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{category.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{category.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="text-xs">
                      {categoryVehicles.length} véhicule(s)
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">
                        {minPrice > 0 ? `${minPrice.toLocaleString()} CDF` : 'Sur demande'}
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

      {/* Section promotion avec véhicules populaires */}
      <Card className="rounded-2xl border-0 bg-gradient-to-br from-primary/5 to-primary-glow/5 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Véhicules populaires à {selectedCity}</h3>
              <p className="text-sm text-muted-foreground">Les plus demandés cette semaine</p>
            </div>
            <Clock className="w-6 h-6 text-primary" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vehicles.slice(0, 3).map((vehicle) => (
              <div key={vehicle.id} className="bg-background/50 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">{vehicle.name}</h4>
                  {vehicle.comfort_level === 'luxury' && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</p>
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-xs">
                    {vehicle.seats} places
                  </Badge>
                  <span className="text-sm font-bold text-primary">
                    {calculateCityPrice(vehicle.daily_rate).toLocaleString()} CDF/jour
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-center mt-6">
            <Button 
              onClick={onOpenRental}
              className="rounded-xl bg-gradient-to-r from-primary to-primary-glow hover:shadow-lg transition-all"
            >
              Voir tous les véhicules
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernRentalPreview;