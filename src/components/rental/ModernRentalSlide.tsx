import React from 'react';
import { motion } from 'framer-motion';
import { Car, ArrowRight, Check, Clock, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModernRentalSlideProps {
  vehicleCount?: number;
  startingPrice?: number;
  onReserve: () => void;
  className?: string;
}

export const ModernRentalSlide: React.FC<ModernRentalSlideProps> = ({
  vehicleCount = 25,
  startingPrice = 50000,
  onReserve,
  className
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl",
        className
      )}
    >
      {/* Fond avec gradient animé */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600" />
      
      {/* Effet shimmer animé */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      {/* Motifs décoratifs */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-20 w-32 h-32 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-20 w-40 h-40 bg-white rounded-full blur-3xl" />
      </div>

      {/* Contenu principal */}
      <div className="relative p-8 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-6 items-center">
          
          {/* Colonne 1: Icône animée */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="relative"
          >
            <div className="w-24 h-24 md:w-28 md:h-28 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center border-2 border-white/40 shadow-2xl">
              <motion.div
                animate={{ 
                  y: [0, -8, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
              >
                <Car className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-lg" />
              </motion.div>
            </div>
            
            {/* Badge disponibilité */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-2 -right-2"
            >
              <Badge className="bg-yellow-400 text-yellow-900 border-2 border-white shadow-lg px-2 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                {vehicleCount}+ véhicules
              </Badge>
            </motion.div>
          </motion.div>

          {/* Colonne 2: Contenu textuel */}
          <div className="space-y-4">
            {/* Titre principal */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 tracking-tight">
                Location de véhicules
              </h2>
              <p className="text-white/90 text-lg md:text-xl font-medium">
                Réservez votre véhicule idéal
              </p>
            </motion.div>

            {/* Prix avec animation */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-baseline gap-2"
            >
              <span className="text-sm text-white/80">À partir de</span>
              <motion.span
                key={startingPrice}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-xl"
              >
                {startingPrice.toLocaleString()}
              </motion.span>
              <span className="text-2xl md:text-3xl font-semibold text-white/90">
                CDF
              </span>
              <span className="text-lg text-white/70 font-medium">/jour</span>
            </motion.div>

            {/* Points clés avec icônes */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-2"
            >
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium">Disponible 24/7</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Clock className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium">Réservation rapide</span>
              </div>
              <div className="flex items-center gap-2 text-white/90">
                <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-3 h-3" />
                </div>
                <span className="text-sm font-medium">100% assuré</span>
              </div>
            </motion.div>
          </div>

          {/* Colonne 3: Call-to-Action */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={onReserve}
              size="lg"
              className="bg-white text-emerald-600 hover:bg-white/90 shadow-2xl px-8 py-6 text-lg font-bold rounded-2xl group"
            >
              Réserver
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.div>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Bordure lumineuse en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300 via-white to-yellow-300 opacity-70" />
    </motion.div>
  );
};
