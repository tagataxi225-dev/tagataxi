import { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface QuickAddButtonProps {
  onAdd: () => void;
  size?: 'sm' | 'default';
}

export const QuickAddButton = ({ onAdd, size = 'sm' }: QuickAddButtonProps) => {
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    onAdd();
    setAdded(true);

    // Vibration légère si disponible
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    // Reset après animation
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Button
      size={size}
      onClick={handleClick}
      disabled={added}
      className={`
        relative overflow-hidden
        ${added 
          ? 'bg-success hover:bg-success text-success-foreground' 
          : 'bg-primary hover:bg-primary/90 text-primary-foreground'
        }
        transition-all duration-300 shadow-md
      `}
    >
      <motion.span
        initial={false}
        animate={{ scale: added ? 0 : 1, opacity: added ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-1"
      >
        <Plus className="h-4 w-4" />
        {size === 'default' && <span>Ajouter</span>}
      </motion.span>

      <motion.span
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: added ? 1 : 0, opacity: added ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <Check className="h-4 w-4" />
      </motion.span>
    </Button>
  );
};
