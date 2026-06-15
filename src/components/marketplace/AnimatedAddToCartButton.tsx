import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface AnimatedAddToCartButtonProps {
  onAdd: () => void;
  isAvailable: boolean;
  isInCart?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

type ButtonState = 'default' | 'adding' | 'added';

export const AnimatedAddToCartButton: React.FC<AnimatedAddToCartButtonProps> = ({
  onAdd,
  isAvailable,
  isInCart = false,
  className,
  size = 'sm'
}) => {
  const [state, setState] = useState<ButtonState>('default');
  const [showRipple, setShowRipple] = useState(false);
  const { triggerSuccess } = useHapticFeedback();

  // Reset après 1.5 secondes - feedback rapide et pro
  useEffect(() => {
    if (state === 'added') {
      const timer = setTimeout(() => {
        setState('default');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isAvailable || state === 'adding') return;

    // Vibration haptique légère
    triggerSuccess();

    // Ripple effect soft
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 400);

    // Séquence d'états plus fluide
    setState('adding');
    
    setTimeout(() => {
      onAdd();
      setState('added');
    }, 400);
  };

  const getButtonContent = () => {
    switch (state) {
      case 'adding':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Ajout...</span>
          </motion.div>
        );
      
      case 'added':
        return (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
            className="flex items-center gap-1.5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.3, 1] }}
              transition={{ duration: 0.4, times: [0, 0.6, 1] }}
            >
              <Check className="h-3.5 w-3.5" />
            </motion.div>
            <span>Ajouté !</span>
          </motion.div>
        );
      
      default:
        return (
          <motion.div 
            className="flex items-center gap-1.5"
            whileHover={{ scale: 1.02 }}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>Acheter</span>
          </motion.div>
        );
    }
  };

  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-10 text-sm",
    lg: "h-12 text-base"
  };

  return (
    <motion.div 
      className="relative flex-1"
      whileTap={{ scale: 0.95 }}
    >
      {/* Button simple et pro */}
      <Button
        size={size}
        disabled={!isAvailable}
        onClick={handleClick}
        className={cn(
          sizeClasses[size],
          "w-full relative overflow-hidden transition-all duration-200",
          state === 'added' && "bg-green-600 hover:bg-green-600 dark:bg-green-600",
          state === 'adding' && "bg-primary/80",
          className
        )}
      >
        <AnimatePresence mode="wait">
          {state === 'adding' && (
            <motion.div
              key="adding"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            </motion.div>
          )}
          
          {state === 'added' && (
            <motion.div
              key="added"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Ajouté</span>
            </motion.div>
          )}
          
          {state === 'default' && (
            <motion.div 
              key="default"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Acheter</span>
            </motion.div>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};
