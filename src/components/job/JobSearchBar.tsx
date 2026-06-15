import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

interface JobSearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  location?: string;
  onLocationChange?: (value: string) => void;
}

export const JobSearchBar = ({ 
  searchQuery, 
  onSearchChange,
  location,
  onLocationChange 
}: JobSearchBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="px-4 py-3 space-y-3"
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un emploi..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
        />
      </div>

      {onLocationChange && (
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ville..."
            value={location || ''}
            onChange={(e) => onLocationChange(e.target.value)}
            className="pl-10 bg-muted/50 border-border/50 focus:bg-background"
          />
        </div>
      )}
    </motion.div>
  );
};
