import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface City {
  name: string;
  shortName: string;
  country: string;
}

const CITIES: City[] = [
  { name: 'Kinshasa', shortName: 'Kin', country: 'RDC' },
  { name: 'Lubumbashi', shortName: 'L\'shi', country: 'RDC' },
  { name: 'Kolwezi', shortName: 'Kol', country: 'RDC' },
];

interface CityDropdownProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

export const CityDropdown = ({ selectedCity, onCityChange, className }: CityDropdownProps) => {
  const currentCity = CITIES.find(c => c.name === selectedCity) || CITIES[0];

  const handleCitySelect = (city: City) => {
    if (city.name !== selectedCity) {
      onCityChange(city.name);
      toast.success('Ville changée', {
        description: `Vous explorez maintenant ${city.name}`
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 h-8 px-2 hover:bg-muted/50 transition-colors rounded-lg ${className}`}
        >
          <span className="font-medium text-sm">{currentCity.name}</span>
          <span className="text-[10px] text-muted-foreground/70">▾</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {CITIES.map((city) => (
          <DropdownMenuItem
            key={city.name}
            onClick={() => handleCitySelect(city)}
            className="flex items-center gap-3 cursor-pointer py-2"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col flex-1">
              <span className="font-medium text-sm">{city.name}</span>
              <span className="text-xs text-muted-foreground">{city.country}</span>
            </div>
            {city.name === selectedCity && (
              <span className="text-primary text-sm">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
