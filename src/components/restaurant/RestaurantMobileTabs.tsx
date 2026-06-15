import { LayoutDashboard, ShoppingBag, ChefHat, Wallet, User, Calculator, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile' | 'subscription' | 'pos' | 'jobs';

interface RestaurantMobileTabsProps {
  currentTab: RestaurantTab;
  onTabChange: (tab: RestaurantTab) => void;
}

export function RestaurantMobileTabs({ currentTab, onTabChange }: RestaurantMobileTabsProps) {
  const tabs = [
    { id: 'dashboard' as RestaurantTab, label: 'Accueil', icon: LayoutDashboard },
    { id: 'orders' as RestaurantTab, label: 'Commandes', icon: ShoppingBag },
    { id: 'pos' as RestaurantTab, label: 'Caisse', icon: Calculator },
    { id: 'menu' as RestaurantTab, label: 'Menu', icon: ChefHat },
    { id: 'jobs' as RestaurantTab, label: 'Jobs', icon: Briefcase },
    { id: 'profile' as RestaurantTab, label: 'Profil', icon: User },
  ] as const;

  return (
    <nav className="bottom-nav-standard md:hidden">
      {/* Ligne décorative supérieure */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center justify-around h-[72px] px-2 max-w-2xl mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          
          return (
            <motion.button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-w-[48px]",
                "transition-colors duration-200",
                isActive 
                  ? 'text-orange-600 dark:text-orange-500' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {/* Background actif */}
              {isActive && (
                <motion.div
                  layoutId="restaurantActiveBg"
                  className="absolute inset-0 bg-orange-500/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icône */}
              <motion.div
                className="relative z-10"
                animate={{
                  scale: isActive ? 1.1 : 1,
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>

              {/* Label */}
              <span className={cn(
                "relative z-10 text-[10px] font-medium",
                isActive && 'font-semibold'
              )}>
                {tab.label}
              </span>
              
              {/* Indicateur actif (barre en bas) */}
              {isActive && (
                <motion.div
                  layoutId="restaurantActiveIndicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
