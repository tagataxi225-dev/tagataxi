import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingCardProps {
  label: string;
  price: string;
  period: string;
  icon: LucideIcon;
  featured?: boolean;
  discount?: string;
  index?: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  label,
  price,
  period,
  icon: Icon,
  featured = false,
  discount,
  index = 0
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 20
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "group relative p-5 sm:p-6 rounded-2xl transition-all duration-500 overflow-hidden",
        featured 
          ? "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/40 shadow-xl shadow-primary/10" 
          : "bg-gradient-to-br from-muted/60 to-muted/30 border border-border/50 hover:border-primary/30 hover:shadow-lg"
      )}
    >
      {/* Background glow for featured */}
      {featured && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      
      {/* Shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent rotate-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </div>
      
      {/* Featured Badge */}
      {featured && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 + 0.2 }}
          className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] sm:text-xs px-3 py-1 shadow-lg border-0">
            <Crown className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        </motion.div>
      )}
      
      {/* Discount Badge */}
      {discount && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: index * 0.1 + 0.3, type: "spring" }}
          className="absolute -top-1 -right-1"
        >
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-400 text-white text-[10px] sm:text-xs px-2.5 py-1 shadow-lg border-0 font-bold">
            {discount}
          </Badge>
        </motion.div>
      )}
      
      <div className="relative text-center space-y-4">
        {/* Icon with gradient background */}
        <motion.div 
          className={cn(
            "h-14 w-14 sm:h-16 sm:w-16 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300",
            "shadow-lg",
            featured 
              ? "bg-gradient-to-br from-primary to-primary/70 group-hover:shadow-primary/40 group-hover:scale-110" 
              : "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 group-hover:from-primary/20 group-hover:to-primary/10 group-hover:scale-110"
          )}
          whileHover={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={cn(
            "h-7 w-7 sm:h-8 sm:w-8 drop-shadow-md",
            featured ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary transition-colors duration-300"
          )} />
        </motion.div>
        
        {/* Label */}
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        
        {/* Price with animation */}
        <div className="space-y-1">
          <motion.p 
            className={cn(
              "text-2xl sm:text-3xl font-bold tracking-tight",
              featured 
                ? "bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent" 
                : "text-foreground"
            )}
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {price}
          </motion.p>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium">
            {period}
          </p>
        </div>
      </div>
      
      {/* Bottom gradient line for featured */}
      {featured && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      )}
    </motion.div>
  );
};
