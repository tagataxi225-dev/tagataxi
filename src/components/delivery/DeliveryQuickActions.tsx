import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  Bookmark,
  Plus,
  Home,
  Building2,
  ShoppingBag,
  Users
} from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  coordinates: [number, number];
  category: 'home' | 'work' | 'shopping' | 'friend';
}

interface DeliveryQuickActionsProps {
  onQuickSelect: (pickup: any, destination: any) => void;
  currentLocation?: any;
}

const DeliveryQuickActions = ({ onQuickSelect, currentLocation }: DeliveryQuickActionsProps) => {
  const [savedPlaces] = useState<QuickAction[]>([
    {
      id: 'home',
      title: 'Domicile',
      subtitle: 'Lemba, Kinshasa',
      icon: Home,
      coordinates: [15.3419, -4.3276],
      category: 'home'
    },
    {
      id: 'work',
      title: 'Bureau',
      subtitle: 'Gombe, Centre-ville',
      icon: Building2,
      coordinates: [15.3147, -4.3217],
      category: 'work'
    },
    {
      id: 'shopping',
      title: 'City Market',
      subtitle: 'Gombe, Shopping',
      icon: ShoppingBag,
      coordinates: [15.3156, -4.3178],
      category: 'shopping'
    }
  ]);

  const [frequentDestinations] = useState([
    { name: 'Restaurant Le Palais', address: 'Av. de la Justice, Gombe', time: '15 min' },
    { name: 'Pharmacie Medi+', address: 'Bd du 30 Juin, Gombe', time: '12 min' },
    { name: 'Supermarché Score', address: 'Av. Libération, Limete', time: '25 min' },
  ]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'home': return 'text-blue-600 bg-blue-50';
      case 'work': return 'text-green-600 bg-green-50';
      case 'shopping': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleQuickSelect = (place: QuickAction) => {
    if (currentLocation) {
      onQuickSelect(
        {
          address: 'Ma position actuelle',
          coordinates: currentLocation.coordinates
        },
        {
          address: place.subtitle,
          coordinates: place.coordinates
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Actions rapides avec lieux sauvegardés */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Lieux favoris</h3>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {savedPlaces.map((place) => {
            const Icon = place.icon;
            return (
              <Card 
                key={place.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow border-border/50"
                onClick={() => handleQuickSelect(place)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCategoryColor(place.category)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-foreground">{place.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        Favori
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{place.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Depuis ma position</p>
                    <p className="text-sm font-medium text-foreground">~15 min</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Destinations fréquentes */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">Destinations populaires</h3>
        <div className="space-y-3">
          {frequentDestinations.map((dest, index) => (
            <Card key={index} className="p-3 cursor-pointer hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-foreground text-sm">{dest.name}</h4>
                  <p className="text-xs text-muted-foreground">{dest.address}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{dest.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Suggestions intelligentes */}
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Livraison groupée</h4>
            <p className="text-sm text-muted-foreground">Économisez en partageant avec d'autres utilisateurs</p>
          </div>
          <Badge className="bg-primary text-white">
            -30%
          </Badge>
        </div>
      </Card>
    </div>
  );
};

export default DeliveryQuickActions;