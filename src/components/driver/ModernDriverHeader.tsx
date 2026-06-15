/**
 * 🚗 Header Driver Moderne - Épuré et professionnel
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Car, Package, Power } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useDriverProfile } from '@/hooks/useDriverProfile';

interface ModernDriverHeaderProps {
  serviceType: 'taxi' | 'delivery' | 'unknown';
  isOnline?: boolean;
  onToggleOnline?: () => void;
  className?: string;
}

export const ModernDriverHeader: React.FC<ModernDriverHeaderProps> = ({
  serviceType,
  isOnline = false,
  onToggleOnline,
  className
}) => {
  const { firstName } = useDriverProfile();
  const driverFirstName = firstName ?? 'Chauffeur';

  // Salutation selon l'heure
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const ServiceIcon = serviceType === 'taxi' ? Car : Package;
  const serviceColor = serviceType === 'taxi' ? 'orange' : 'blue';

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-sm',
        className
      )}
    >
      <div className="px-4 py-2 pt-safe">
        {/* Single Row: Compact and professional */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Greeting + Name compact */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground leading-tight">
                {greeting}
              </p>
              <h1 className="text-sm font-bold text-foreground truncate leading-tight">
                {driverFirstName}
              </h1>
            </div>
          </div>

          {/* Center: Service Badge compact */}
          <Badge 
            variant="secondary" 
            className={cn(
              "gap-1 px-2 py-1 text-[10px] font-semibold shrink-0",
              serviceType === 'taxi' && "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30",
              serviceType === 'delivery' && "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30",
              serviceType === 'unknown' && "bg-muted"
            )}
          >
            <ServiceIcon className="h-3 w-3" />
            {serviceType === 'taxi' ? 'VTC' : serviceType === 'delivery' ? 'Livraison' : 'Service'}
          </Badge>

          {/* Right: Theme Toggle + Online Toggle compact */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle variant="icon" size="sm" />
            
            {/* Compact Online Toggle */}
            {onToggleOnline && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onToggleOnline}
                className={cn(
                  'relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                  'shadow-sm hover:shadow-md',
                  isOnline 
                    ? serviceColor === 'orange'
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gradient-to-br from-blue-500 to-blue-600'
                    : 'bg-muted'
                )}
              >
                <Power 
                  className={cn(
                    'w-4 h-4 transition-all duration-300',
                    isOnline ? 'text-white' : 'text-muted-foreground'
                  )} 
                />
                
                {/* Online Indicator */}
                {isOnline && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-background"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-full h-full bg-green-400 rounded-full"
                    />
                  </motion.div>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};
