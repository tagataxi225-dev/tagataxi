import React from 'react';
import { motion } from 'framer-motion';

interface CompactRentalSlideProps {
  onReserve: () => void;
  vehicleCount?: number;
  startingPrice?: number;
}

export const CompactRentalSlide: React.FC<CompactRentalSlideProps> = ({ 
  onReserve,
  vehicleCount = 25,
  startingPrice = 50000
}) => {
  return (
    <div className="relative rounded-2xl h-[160px] bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      <motion.div 
        className="absolute inset-0 p-4 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-white gap-3"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Icône comme les autres slides */}
          <motion.div 
            className="text-4xl sm:text-5xl opacity-90"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            🚗
          </motion.div>
          
          <div>
            {/* Titre aligné avec les autres */}
            <motion.h3 
              className="text-2xl sm:text-4xl font-black tracking-tight mb-0.5 sm:mb-1"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              Location de véhicules
            </motion.h3>
            {/* Sous-titre comme les autres */}
            <motion.p 
              className="text-white/80 text-xs sm:text-sm font-bold"
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              À partir de {(startingPrice / 1000).toFixed(0)}K CDF/jour
            </motion.p>
          </div>
        </div>

        {/* CTA aligné avec les autres slides */}
        <motion.button 
          onClick={onReserve}
          className="self-end sm:self-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-xs sm:text-sm font-bold transition-colors duration-200 border border-white/30"
          whileHover={{ scale: 1.05, x: 5 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          Réserver →
        </motion.button>
      </motion.div>
    </div>
  );
};
