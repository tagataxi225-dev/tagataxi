import { X } from 'lucide-react';
import { Badge } from './badge';
import { motion } from 'framer-motion';

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
}

export const FilterBadge = ({ label, onRemove }: FilterBadgeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <Badge 
        variant="secondary" 
        className="pl-3 pr-1 py-1.5 gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
      >
        <span className="text-sm font-medium">{label}</span>
        <button
          onClick={onRemove}
          className="rounded-full hover:bg-primary/30 p-0.5 transition-colors"
          aria-label={`Retirer le filtre ${label}`}
        >
          <X className="h-3 w-3" />
        </button>
      </Badge>
    </motion.div>
  );
};
