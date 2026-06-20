import { MapPin, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Textes génériques qui indiquent un géocodage en cours/échoué
const GENERIC_LABELS = ['Position actuelle', 'Ma position', 'Current position', 'My position'];

const isGenericLabel = (address: string): boolean => {
  if (GENERIC_LABELS.some(l => address.toLowerCase() === l.toLowerCase())) return true;
  if (/^-?\d+\.?\d*\s*,\s*-?\d+\.?\d*/.test(address.trim())) return true;
  // "Position GPS" seul est générique, mais "Abidjan - Position GPS" ou "📍 Abidjan" sont des fallbacks finaux
  if (address === 'Position GPS') return true;
  return false;
};

const formatAddress = (address: string): string => {
  if (isGenericLabel(address)) return '';

  const plusCodeRegex = /[A-Z0-9]{4,}[A-Z]{2,}[0-9]{2,}|[A-Z0-9]{4,}\+[A-Z0-9]{2,}/;
  
  if (address.match(plusCodeRegex)) {
    const parts = address.split(',').map(p => p.trim());
    const filtered = parts.filter(p => !p.match(plusCodeRegex));
    if (filtered.length > 0) {
      return filtered.slice(-2).join(', ');
    }
  }
  
  if (address.length > 50) {
    const parts = address.split(',').map(p => p.trim());
    return parts.slice(-2).join(', ');
  }
  
  return address;
};

interface PickupLocationCardProps {
  pickupAddress: string | null;
  onEdit: () => void;
}

export default function PickupLocationCard({ pickupAddress, onEdit }: PickupLocationCardProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [enrichmentTimedOut, setEnrichmentTimedOut] = useState(false);

  // Auto-collapse after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCollapsed(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, [pickupAddress]);

  // ✅ Timeout enrichissement: après 5s de "Localisation...", afficher un fallback lisible
  useEffect(() => {
    if (pickupAddress && isGenericLabel(pickupAddress)) {
      setEnrichmentTimedOut(false);
      const timeout = setTimeout(() => {
        setEnrichmentTimedOut(true);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setEnrichmentTimedOut(false);
    }
  }, [pickupAddress]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCollapsed) {
      setIsCollapsed(false);
    } else {
      onEdit();
    }
  };

  // Déterminer le texte d'affichage
  const getDisplayText = (): { label: string; isLoading: boolean } => {
    if (!pickupAddress) return { label: 'Votre emplacement', isLoading: false };
    
    if (isGenericLabel(pickupAddress)) {
      if (enrichmentTimedOut) {
        // Après 5s: afficher "Position GPS" au lieu de rester bloqué sur "Localisation..."
        return { label: 'Position GPS', isLoading: false };
      }
      return { label: 'Localisation...', isLoading: true };
    }
    
    const formatted = formatAddress(pickupAddress);
    return { label: formatted || 'Position GPS', isLoading: false };
  };

  const { label: displayText, isLoading } = getDisplayText();

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: 0, 
        opacity: 1,
        left: '1rem',
        right: isCollapsed ? 'auto' : '1rem'
      }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="absolute z-[150]"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4.5rem)' }}
    >
      <Card 
        onClick={handleToggle}
        className="bg-background/95 backdrop-blur-md shadow-lg dark:shadow-black/20 border-none cursor-pointer hover:shadow-xl transition-shadow overflow-hidden"
      >
        <motion.div
          animate={{
            width: isCollapsed ? '56px' : 'auto',
            height: isCollapsed ? '56px' : 'auto',
          }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="flex items-center"
        >
          <AnimatePresence>
            {isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-14 h-14 flex items-center justify-center"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 flex items-center justify-between gap-3 min-w-[280px]"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Point de prise en charge</p>
                    <p className={`font-semibold truncate ${isLoading ? 'text-muted-foreground animate-pulse' : 'text-foreground'}`}>
                      {displayText}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Card>
    </motion.div>
  );
}
