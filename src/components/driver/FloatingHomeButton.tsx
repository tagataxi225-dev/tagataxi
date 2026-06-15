import React from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface FloatingHomeButtonProps {
  onClick: () => void;
  serviceType?: 'taxi' | 'delivery' | 'unknown';
  variant?: 'circle' | 'pill';
}

export const FloatingHomeButton: React.FC<FloatingHomeButtonProps> = ({
  onClick,
  serviceType = 'taxi',
  variant = 'circle'
}) => {
  const { triggerHaptic } = useHapticFeedback();

  const gradientClass = serviceType === 'taxi' 
    ? 'from-orange-500 to-orange-600' 
    : serviceType === 'delivery'
    ? 'from-blue-500 to-blue-600'
    : 'from-primary to-primary/80';

  const handleClick = () => {
    triggerHaptic('medium');
    onClick();
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-[90]"
    >
      <Button
        onClick={handleClick}
        size={variant === 'circle' ? 'icon' : 'lg'}
        className={cn(
          'shadow-2xl transition-all duration-300',
          'hover:shadow-primary/50 hover:scale-110 active:scale-95',
          'bg-gradient-to-br',
          gradientClass,
          variant === 'circle' && 'h-14 w-14 rounded-full',
          variant === 'pill' && 'rounded-full px-6 gap-2'
        )}
      >
        <Home className="h-6 w-6 text-white" />
        {variant === 'pill' && (
          <span className="text-white font-semibold">Accueil</span>
        )}
      </Button>
      
      {/* Glow effect */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full blur-xl opacity-50 -z-10',
          'bg-gradient-to-br',
          gradientClass
        )}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
      />
    </motion.div>
  );
};
