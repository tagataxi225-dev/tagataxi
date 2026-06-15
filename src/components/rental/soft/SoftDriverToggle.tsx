import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Car, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface SoftDriverToggleProps {
  value: 'with_driver' | 'without_driver' | null;
  onChange: (value: 'with_driver' | 'without_driver') => void;
  withDriverPrice: number;
  withoutDriverPrice: number;
  selfDriveAllowed?: boolean; // Nouvelle prop : le partenaire autorise-t-il la conduite sans chauffeur?
  formatPrice: (price: number) => string;
}

export const SoftDriverToggle = ({
  value,
  onChange,
  withDriverPrice,
  withoutDriverPrice,
  selfDriveAllowed = false,
  formatPrice
}: SoftDriverToggleProps) => {
  
  // Auto-sélection par défaut : toujours avec chauffeur
  React.useEffect(() => {
    if (value === null) {
      onChange('with_driver');
    }
  }, [value, onChange]);

  // Si sans chauffeur n'est pas autorisé, ne pas afficher l'option
  const showWithoutDriverOption = selfDriveAllowed;

  return (
    <div className="space-y-3">
      {/* Option Avec Chauffeur - Par défaut */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => onChange('with_driver')}
        className={cn(
          "w-full p-4 rounded-2xl border text-left transition-all duration-300",
          "relative overflow-hidden group",
          value === 'with_driver' 
            ? "border-primary/40 bg-primary/5 shadow-md" 
            : "border-border/30 bg-card hover:border-primary/20 hover:bg-muted/20"
        )}
      >
        {/* Checkmark animé */}
        <AnimatePresence>
          {value === 'with_driver' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
            value === 'with_driver' 
              ? "bg-primary/10 text-primary" 
              : "bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70"
          )}>
            <User className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-semibold text-foreground">Avec chauffeur</h4>
              <Badge 
                variant="secondary"
                className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-0"
              >
                Par défaut
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Chauffeur professionnel à votre service
            </p>
          </div>

          {/* Price */}
          <div className="flex-shrink-0 text-right pr-6">
            <p className={cn(
              "text-lg font-bold",
              value === 'with_driver' ? "text-primary" : "text-foreground"
            )}>
              {formatPrice(withDriverPrice)}
            </p>
            <p className="text-xs text-muted-foreground">/jour</p>
          </div>
        </div>

        {/* Gradient overlay subtil quand sélectionné */}
        {value === 'with_driver' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3 pointer-events-none"
          />
        )}
      </motion.button>

      {/* Option Sans Chauffeur - Seulement si autorisé par le partenaire */}
      <AnimatePresence>
        {showWithoutDriverOption && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => onChange('without_driver')}
            className={cn(
              "w-full p-4 rounded-2xl border text-left transition-all duration-300",
              "relative overflow-hidden group",
              value === 'without_driver' 
                ? "border-primary/40 bg-primary/5 shadow-md" 
                : "border-border/30 bg-card hover:border-primary/20 hover:bg-muted/20"
            )}
          >
            {/* Checkmark animé */}
            <AnimatePresence>
              {value === 'without_driver' && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                value === 'without_driver' 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted/50 text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary/70"
              )}>
                <Car className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-foreground">Sans chauffeur</h4>
                  <Badge 
                    variant="outline"
                    className="text-[10px] px-2 py-0 border-muted-foreground/30 text-muted-foreground"
                  >
                    Option
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Conduisez vous-même (permis requis)
                </p>
              </div>

              {/* Price - Généralement moins cher */}
              <div className="flex-shrink-0 text-right pr-6">
                <p className={cn(
                  "text-lg font-bold",
                  value === 'without_driver' ? "text-primary" : "text-foreground"
                )}>
                  {formatPrice(withoutDriverPrice)}
                </p>
                <p className="text-xs text-muted-foreground">/jour</p>
              </div>
            </div>

            {/* Gradient overlay subtil quand sélectionné */}
            {value === 'without_driver' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-primary/3 via-transparent to-primary/3 pointer-events-none"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Message si sans chauffeur non disponible */}
      {!showWithoutDriverOption && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-2"
        >
          <p className="text-xs text-muted-foreground">
            Ce véhicule est disponible uniquement avec chauffeur
          </p>
        </motion.div>
      )}
    </div>
  );
};
