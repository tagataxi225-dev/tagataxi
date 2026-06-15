import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Car, Package, MoreHorizontal, Search, ShoppingBag, 
  Plus, Activity, Heart, BarChart3, Users, Settings,
  Home, MapPin, Wallet, Star, Bell, Menu, CreditCard, Trophy, User
} from 'lucide-react';

export type UniversalTabType = 
  // Client tabs
  | 'home' | 'services' | 'orders' | 'wallet' | 'profile'
  // Driver tabs  
  | 'orders' | 'earnings' | 'challenges' | 'subscription' | 'profile'
  // Partner tabs (generic)
  | 'dashboard' | 'fleet' | 'drivers' | 'analytics' | 'settings'
  // Partner Delivery tabs
  | 'dashboard' | 'drivers' | 'analytics' | 'settings'
  // Partner Auto tabs
  | 'dashboard' | 'drivers' | 'fleet' | 'analytics' | 'settings'
  // Admin tabs
  | 'overview' | 'users' | 'operations' | 'reports' | 'admin-settings'
  // Marketplace tabs
  | 'explore' | 'sell' | 'activity' | 'favorites' | 'cart';

export type UserType = 'client' | 'driver' | 'partner' | 'partner_delivery' | 'partner_auto' | 'admin' | 'marketplace';

interface UniversalBottomNavigationProps {
  userType: UserType;
  activeTab: UniversalTabType;
  onTabChange: (tab: UniversalTabType) => void;
  onMoreAction?: () => void;
  badges?: Partial<Record<UniversalTabType, number>>;
  className?: string;
  variant?: 'default' | 'enhanced';
  showLabels?: boolean;
  floating?: boolean;
}

const navigationConfigs: Record<UserType, { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[]> = {
  client: [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'services', label: 'Services', icon: MapPin },
    { id: 'orders', label: 'Commandes', icon: Package },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profil', icon: Settings }
  ],
  driver: [
    { id: 'orders', label: 'Courses', icon: Car },
    { id: 'earnings', label: 'Gains', icon: Wallet },
    { id: 'challenges', label: 'Défis', icon: Trophy },
    { id: 'subscription', label: 'Abo', icon: CreditCard },
    { id: 'profile', label: 'Profil', icon: User }
  ],
  partner: [
    { id: 'dashboard', label: 'Tableau', icon: BarChart3 },
    { id: 'fleet', label: 'Flotte', icon: Car },
    { id: 'drivers', label: 'Drivers', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ],
  partner_delivery: [
    { id: 'dashboard', label: 'Tableau', icon: BarChart3 },
    { id: 'drivers', label: 'Livreurs', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ],
  partner_auto: [
    { id: 'dashboard', label: 'Tableau', icon: BarChart3 },
    { id: 'drivers', label: 'Chauffeurs', icon: Users },
    { id: 'fleet', label: 'Location', icon: Car },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'settings', label: 'Paramètres', icon: Settings }
  ],
  admin: [
    { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'operations', label: 'Opérations', icon: Activity },
    { id: 'reports', label: 'Rapports', icon: Package },
    { id: 'admin-settings', label: 'Paramètres', icon: Settings }
  ],
  marketplace: [
    { id: 'explore', label: 'Explorer', icon: Search },
    { id: 'sell', label: 'Vendre', icon: Plus },
    { id: 'activity', label: 'Activité', icon: Activity },
    { id: 'favorites', label: 'Favoris', icon: Heart },
    { id: 'cart', label: 'Panier', icon: ShoppingBag }
  ]
};

export const UniversalBottomNavigation: React.FC<UniversalBottomNavigationProps> = ({
  userType,
  activeTab,
  onTabChange,
  onMoreAction,
  badges = {},
  className,
  variant = 'default',
  showLabels = true,
  floating = false
}) => {
  const config = navigationConfigs[userType];
  
  const handleTabPress = (tab: UniversalTabType, isMore?: boolean) => {
    if (isMore && onMoreAction) {
      onMoreAction();
      return;
    }
    onTabChange(tab);
  };

  const getItemClasses = (isActive: boolean) => {
    if (variant === 'enhanced') {
      return cn(
        'relative flex-1 flex flex-col items-center justify-center gap-2',
        'py-3 px-2 transition-all duration-300',
        'rounded-2xl cursor-pointer min-touch-target touch-manipulation',
        isActive && 'bg-primary/10',
        !isActive && 'hover:bg-accent/30'
      );
    }
    
    // Style default - identique au ModernBottomNavigation client
    return cn(
      'relative flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200',
      'min-w-[60px] group active:scale-95 min-touch-target touch-manipulation'
    );
  };

  return (
    <nav 
      className={cn(
        floating ? 'bottom-nav-floating' : 'bottom-nav-standard',
        className
      )}
      style={{ 
        willChange: 'transform',
        pointerEvents: 'auto',
        touchAction: 'none'
      }}
    >
      {/* Gradient d'accentuation subtile en haut - comme le client */}
      {!floating && variant === 'default' && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      )}
      
      {/* Container des boutons - hauteur fixe explicite */}
      <div className={cn(
        'flex items-center justify-around h-[72px] px-4 max-w-screen-sm mx-auto',
        floating && 'px-2'
      )}>
        {config.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const badge = badges[item.id];
          
          if (variant === 'enhanced') {
            // Style enhanced avec animations
            return (
              <motion.button
                key={item.id}
                className={getItemClasses(isActive)}
                onClick={() => handleTabPress(item.id as UniversalTabType)}
                aria-label={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1, rotate: 3 }}
              >
                {isActive && (
                  <motion.div 
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                    layoutId={`activeIndicator-${userType}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <div className="relative">
                  <Icon className="h-6 w-6 transition-colors duration-200 text-primary" />
                  {isActive && (
                    <motion.div 
                      className="absolute inset-0 bg-primary/20 rounded-full blur-lg -z-10"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  {badge && badge > 0 && (
                    <motion.div className="absolute -top-2 -right-2" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                      <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex items-center justify-center min-w-4 bg-primary text-primary-foreground border-0">
                        {badge > 99 ? '99+' : badge}
                      </Badge>
                    </motion.div>
                  )}
                </div>
                {showLabels && (
                  <span className={cn('text-xs font-semibold transition-colors', isActive ? 'text-primary' : 'text-muted-foreground')}>
                    {item.label}
                  </span>
                )}
              </motion.button>
            );
          }
          
          // Style default - identique au ModernBottomNavigation client
          return (
            <button
              key={item.id}
              onClick={() => handleTabPress(item.id as UniversalTabType)}
              className={getItemClasses(isActive)}
              aria-label={item.label}
            >
              {/* Active background avec glassmorphism moderne */}
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-primary/8 to-primary/4 rounded-2xl border border-primary/20 shadow-lg shadow-primary/10" />
              )}
              
              {/* Icon container */}
              <div className="relative z-10">
                <Icon 
                  className={cn(
                    'w-6 h-6 transition-all duration-300 ease-out',
                    isActive 
                      ? 'text-primary scale-110' 
                      : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'
                  )}
                />
                
                {/* Notification badge */}
                {badge && badge > 0 && (
                  <div className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-md border-2 border-background">
                    {badge > 9 ? '9+' : badge}
                  </div>
                )}
              </div>
              
              {/* Label */}
              {showLabels && (
                <span 
                  className={cn(
                    'relative z-10 text-xs font-semibold tracking-tight transition-all duration-300',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                >
                  {item.label}
                </span>
              )}
              
              {/* Active indicator bar */}
              {isActive && (
                <div className="absolute -bottom-0.5 h-1 w-8 bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export { UniversalBottomNavigation as default };