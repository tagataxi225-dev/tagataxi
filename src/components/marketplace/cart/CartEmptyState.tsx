import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FloatingParticles } from '@/components/wallet/FloatingParticles';

interface CartEmptyStateProps {
  onClose: () => void;
}

export const CartEmptyState: React.FC<CartEmptyStateProps> = ({ onClose }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-[calc(100dvh-200px)] px-6">
      <FloatingParticles />
      
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: 'spring',
          stiffness: 200,
          delay: 0.2
        }}
        className="relative"
      >
        {/* Animated bag icon with pulse */}
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -5, 5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <ShoppingBag className="relative w-24 h-24 text-primary/60" strokeWidth={1.5} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center space-y-3 mt-8"
      >
        <h3 className="text-xl font-bold text-foreground">
          Votre panier est vide
        </h3>
        <p className="text-muted-foreground max-w-xs">
          Découvrez nos produits et ajoutez vos favoris pour commencer vos achats
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8"
      >
        <Button
          onClick={onClose}
          className="group gap-2"
        >
          <motion.div
            animate={{ x: [0, -4, 0] }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.div>
          Découvrir les produits
        </Button>
      </motion.div>
    </div>
  );
};
