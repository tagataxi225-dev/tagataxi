import { MapPin, Plane, Clock } from 'lucide-react';
import { usePlaces, type UserPlace } from '@/hooks/usePlaces';
import { ABIDJAN_FIXED_PLACES } from '@/data/abidjanPlaces';

interface HomePopularPlacesProps {
  /** Ouvre le taxi avec ce lieu en destination pré-remplie (réutilise onSearch). */
  onSelect: (name: string, coordinates: { lat: number; lng: number }) => void;
}

const chipClass =
  'inline-flex items-center gap-1.5 shrink-0 min-h-[44px] rounded-full ' +
  'bg-primary/10 text-primary border border-primary/20 px-3.5 text-sm font-medium ' +
  'whitespace-nowrap hover:bg-primary/15 active:scale-95 transition-all';

export const HomePopularPlaces = ({ onSelect }: HomePopularPlacesProps) => {
  const { recentPlaces, markAsUsed } = usePlaces();

  // Récents valides (coordonnées présentes)
  const recents = recentPlaces.filter(
    (p) => p.coordinates && typeof p.coordinates.lat === 'number' && typeof p.coordinates.lng === 'number'
  );

  // Lieux fixes dédupliqués (on retire ceux déjà présents dans les récents)
  const recentNames = new Set(recents.map((r) => r.name.trim().toLowerCase()));
  const fixed = ABIDJAN_FIXED_PLACES.filter((p) => !recentNames.has(p.name.trim().toLowerCase()));

  // Rien à afficher (ne devrait pas arriver car la liste fixe est non vide)
  if (recents.length === 0 && fixed.length === 0) return null;

  const handleRecent = async (place: UserPlace) => {
    try {
      await markAsUsed(place.id);
    } catch {
      /* non bloquant */
    }
    onSelect(place.name, { lat: place.coordinates!.lat, lng: place.coordinates!.lng });
  };

  return (
    <section className="px-4">
      <h2 className="text-sm font-semibold text-foreground mb-3">Lieux populaires</h2>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {/* Récents d'abord */}
        {recents.map((place) => (
          <button
            key={place.id}
            type="button"
            onClick={() => handleRecent(place)}
            style={{ touchAction: 'manipulation' }}
            className={chipClass}
            aria-label={`Aller à ${place.name}`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span className="max-w-[140px] truncate">{place.name}</span>
          </button>
        ))}

        {/* Puis les lieux fixes Abidjan */}
        {fixed.map((place) => {
          const Icon = place.name === 'Aéroport FHB' ? Plane : MapPin;
          return (
            <button
              key={place.name}
              type="button"
              onClick={() => onSelect(place.name, { lat: place.lat, lng: place.lng })}
              style={{ touchAction: 'manipulation' }}
              className={chipClass}
              aria-label={`Aller à ${place.name}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{place.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default HomePopularPlaces;
