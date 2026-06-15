import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ShoppingBag, Heart, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/food' },
  { id: 'explore', label: 'Explorer', icon: Search, path: '/food/explore' },
  { id: 'promos', label: 'Promos', icon: Percent, path: '/food/promos' },
  { id: 'orders', label: 'Commandes', icon: ShoppingBag, path: '/food/orders' },
  { id: 'favorites', label: 'Favoris', icon: Heart, path: '/food/favorites' },
];

/**
 * 🍔 KWENDA FOOD - FOOTER NAVIGATION
 * Harmonisé avec le style client (ModernBottomNavigation)
 */
export const FoodFooterNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="bottom-nav-standard">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center justify-around h-[72px] px-4 max-w-2xl mx-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <motion.button
              key={item.id}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl min-w-[56px]",
                "transition-colors duration-200",
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="foodActiveBg"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10">
                <Icon 
                  className={cn("w-5 h-5", isActive && "scale-110")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              <span className={cn(
                "relative z-10 text-[10px] font-medium",
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="foodActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
