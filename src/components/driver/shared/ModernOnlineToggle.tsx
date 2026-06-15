/**
 * 🎚️ Toggle en ligne moderne contextualisé
 */

import { motion } from 'framer-motion';
import { Power } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModernOnlineToggleProps {
  isOnline: boolean;
  onToggle: () => void;
  serviceType: 'taxi' | 'delivery';
}

export const ModernOnlineToggle = ({ isOnline, onToggle, serviceType }: ModernOnlineToggleProps) => {
  const colors = {
    taxi: {
      active: 'from-blue-500 to-blue-600',
      inactive: 'from-gray-400 to-gray-500'
    },
    delivery: {
      active: 'from-green-500 to-orange-500',
      inactive: 'from-gray-400 to-gray-500'
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        'relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
        'shadow-lg hover:shadow-xl',
        isOnline 
          ? `bg-gradient-to-br ${colors[serviceType].active} toggle-online-active` 
          : `bg-gradient-to-br ${colors[serviceType].inactive}`
      )}
    >
      <Power 
        className={cn(
          'w-7 h-7 transition-transform duration-300',
          isOnline ? 'text-white rotate-0' : 'text-gray-200 rotate-180'
        )} 
      />
      
      {/* Indicateur de statut */}
      {isOnline && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-full h-full bg-green-400 rounded-full"
          />
        </motion.div>
      )}
    </motion.button>
  );
};
