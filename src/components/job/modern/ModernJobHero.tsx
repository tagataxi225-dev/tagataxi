import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ModernJobHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  location: string;
  onLocationChange: (location: string) => void;
  jobCount: number;
}

const CITIES = ['Kinshasa', 'Lubumbashi', 'Kolwezi'];

export const ModernJobHero = ({
  searchQuery,
  onSearchChange,
  location,
  onLocationChange,
}: ModernJobHeroProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative px-4 pt-2 pb-3">
      {/* Search bar - simplified */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          flex items-center gap-2 bg-muted/50 rounded-2xl p-2.5 transition-all
          ${isFocused ? 'ring-1 ring-primary/30 bg-background' : ''}
        `}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
        <Input
          placeholder="Rechercher un emploi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
        />
      </motion.div>

      {/* City filter pills */}
      <div className="flex items-center gap-2 mt-3">
        <Button
          variant={location === '' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onLocationChange('')}
          className={`h-7 text-xs px-3 rounded-full ${location === '' ? '' : 'text-muted-foreground'}`}
        >
          Toutes
        </Button>
        {CITIES.map((city) => (
          <Button
            key={city}
            variant={location === city ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLocationChange(city)}
            className={`h-7 text-xs px-3 rounded-full ${location === city ? '' : 'text-muted-foreground'}`}
          >
            {city}
          </Button>
        ))}
      </div>
    </div>
  );
};