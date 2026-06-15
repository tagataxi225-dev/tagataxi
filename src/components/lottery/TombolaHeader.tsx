import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Gift, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TombolaHeaderProps {
  totalWinnings: number;
  currency?: string;
  className?: string;
}

export const TombolaHeader: React.FC<TombolaHeaderProps> = ({
  totalWinnings,
  currency = 'CDF',
  className
}) => {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-CD', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-white shadow-sm border border-border",
        "p-5",
        className
      )}
    >
      {/* Help button */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-3 right-3 h-7 w-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72" align="end">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              Comment ça marche ?
            </h4>
            <ul className="text-xs space-y-1.5 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span>🚗</span>
                <span>Commandez des courses pour gagner des points</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📦</span>
                <span>Faites des livraisons pour avancer</span>
              </li>
              <li className="flex items-start gap-2">
                <span>🎁</span>
                <span>À 100 points, débloquez une carte à gratter</span>
              </li>
              <li className="flex items-start gap-2">
                <span>💰</span>
                <span>Grattez pour découvrir votre gain !</span>
              </li>
            </ul>
          </div>
        </PopoverContent>
      </Popover>

      {/* Trophy icon */}
      <div className="flex justify-center mb-3">
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center"
        >
          <Trophy className="h-6 w-6 text-amber-500" />
        </motion.div>
      </div>

      {/* Title */}
      <p className="text-muted-foreground text-xs font-medium text-center uppercase tracking-wider">
        Gains déjà versés
      </p>

      {/* Amount */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mt-1"
      >
        <span className="text-3xl font-bold text-foreground">
          {formatAmount(totalWinnings)}
        </span>
        <span className="text-lg font-medium text-muted-foreground ml-1">
          {currency === 'XP' ? 'XP' : 'F'}
        </span>
      </motion.div>

      {/* Subtle decoration */}
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-primary/5" />
      <div className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-amber-500/5" />
    </motion.div>
  );
};
