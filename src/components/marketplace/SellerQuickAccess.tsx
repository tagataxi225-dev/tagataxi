import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Store, MapPin, MessageCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SellerQuickAccessProps {
  sellerName: string;
  sellerId?: string;
  location?: string;
  onContactSeller?: () => void;
  onViewShop?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export const SellerQuickAccess: React.FC<SellerQuickAccessProps> = ({
  sellerName,
  sellerId,
  location,
  onContactSeller,
  onViewShop,
  className,
  variant = 'default'
}) => {
  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "flex items-center gap-2 p-2 rounded-xl bg-muted/40 cursor-pointer group transition-colors hover:bg-muted/60",
          className
        )}
        onClick={onViewShop}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Store className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">Vendu par</p>
          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
            {sellerName}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-muted/30 rounded-2xl p-4 space-y-3",
        className
      )}
    >
      {/* Ligne vendeur */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="flex items-center justify-between bg-background/80 backdrop-blur-sm rounded-xl p-3 cursor-pointer group shadow-sm hover:shadow-md transition-all"
        onClick={onViewShop}
      >
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Store className="h-5 w-5 text-primary" />
          </motion.div>
          <div>
            <p className="text-xs text-muted-foreground">Vendu par</p>
            <p className="font-bold text-sm group-hover:text-primary transition-colors">
              {sellerName}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {location && (
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{location}</span>
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </motion.div>

      {/* Bouton contacter */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          variant="outline"
          className="w-full rounded-xl h-12 border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
          onClick={(e) => {
            e.stopPropagation();
            onContactSeller?.();
          }}
        >
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ x: 2 }}
          >
            <MessageCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
            <span className="font-medium">Contacter le vendeur</span>
          </motion.div>
        </Button>
      </motion.div>
    </motion.div>
  );
};
