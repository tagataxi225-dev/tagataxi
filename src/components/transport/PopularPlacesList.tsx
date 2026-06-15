import { MapPin, Clock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUserTripHistory } from '@/hooks/useUserTripHistory';
import { useSmartGeolocation } from '@/hooks/useSmartGeolocation';
import { cn } from '@/lib/utils';

interface PopularPlace {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

interface PopularPlacesListProps {
  places?: PopularPlace[];
  onSelectPlace: (place: any) => void;
}

export default function PopularPlacesList({ places, onSelectPlace }: PopularPlacesListProps) {
  const { destinations, isLoading } = useUserTripHistory();
  const { getPopularPlaces } = useSmartGeolocation();
  
  console.log('📊 Historique utilisateur:', destinations.length, 'courses');
  
  // Utiliser l'historique utilisateur en priorité, sinon les lieux populaires par défaut
  const displayPlaces = destinations.length > 0 
    ? destinations.map(dest => ({
        id: dest.id,
        name: dest.destination,
        address: dest.destination,
        lat: dest.destination_coordinates.lat,
        lng: dest.destination_coordinates.lng,
        frequency: dest.frequency
      }))
    : (places || getPopularPlaces() || []).map(p => ({ ...p, frequency: 0 }));

  if (isLoading) {
    return null;
  }
  
  // Afficher message si aucun historique ni lieu populaire
  if (displayPlaces.length === 0) {
    return (
      <div className="mt-4 text-center py-8 text-muted-foreground">
        <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Aucune destination récente</p>
        <p className="text-xs mt-1">Vos prochaines courses apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 mt-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 px-2">
        {destinations.length > 0 ? 'Destinations récentes' : 'Lieux fréquents'}
      </h3>
      {displayPlaces.slice(0, 5).map((place, index) => (
        <motion.button
          key={place.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectPlace(place)}
          className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors rounded-xl"
        >
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            place.frequency >= 3 ? "bg-amber-500/10" : "bg-muted"
          )}>
            {place.frequency >= 3 ? (
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            ) : place.frequency > 0 ? (
              <Clock className="w-5 h-5 text-muted-foreground" />
            ) : (
              <MapPin className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{place.name}</p>
              {place.frequency > 1 && (
                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {place.frequency}x
                </span>
              )}
            </div>
            {place.address && (
              <p className="text-xs text-muted-foreground mt-0.5">{place.address}</p>
            )}
          </div>
        </motion.button>
      ))}
    </div>
  );
}
