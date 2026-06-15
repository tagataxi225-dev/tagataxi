import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CartCheckoutButtonProps {
  onClick: () => void;
  disabled: boolean;
  isProcessing: boolean;
}

export const CartCheckoutButton: React.FC<CartCheckoutButtonProps> = ({
  onClick,
  disabled,
  isProcessing
}) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="relative"
    >
      <Button
        onClick={onClick}
        disabled={disabled || isProcessing}
        className="relative w-full h-12 overflow-hidden group"
      >
        {/* Shimmer effect */}
        {!disabled && !isProcessing && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        )}

        {/* Processing progress bar */}
        {isProcessing && (
          <motion.div
            className="absolute bottom-0 left-0 h-1 bg-white/30"
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {/* Button content */}
        <span className="relative flex items-center justify-center gap-2 font-semibold">
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Passer commande
            </>
          )}
        </span>

        {/* Ripple effect on tap */}
        {!disabled && !isProcessing && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-lg"
            initial={{ scale: 0, opacity: 1 }}
            whileTap={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </Button>
    </motion.div>
  );
};
