import React from 'react';
import { LayoutDashboard, Store, ShoppingBag, User, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  badgeVariant?: 'default' | 'destructive' | 'warning' | 'success';
}

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface VendorBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
}

export const VendorBottomNav: React.FC<VendorBottomNavProps> = ({
  activeTab,
  onTabChange,
  stats
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { 
      id: 'shop', 
      icon: Store, 
      label: 'Produits', 
      badge: stats.pendingProducts,
      badgeVariant: 'warning'
    },
    { 
      id: 'orders', 
      icon: ShoppingBag, 
      label: 'Commandes', 
      badge: stats.pendingOrders,
      badgeVariant: 'destructive'
    },
    { 
      id: 'finances', 
      icon: Wallet, 
      label: 'Finances',
      badge: stats.escrowBalance > 0 ? 1 : undefined,
      badgeVariant: 'success'
    },
    { id: 'profile', icon: User, label: 'Profil' },
  ];

  return (
    <nav className="bottom-nav-standard">
      {/* Ligne décorative supérieure */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      
      <div className="flex items-center justify-around h-[72px] px-2 max-w-2xl mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileTap={{ scale: 0.9 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 px-2 py-2 rounded-xl min-w-[48px]",
                "transition-colors duration-200",
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Background actif */}
              {isActive && (
                <motion.div
                  layoutId="vendorActiveBg"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icône avec badge */}
              <div className="relative z-10">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                  <Icon className="h-5 w-5" />
                </motion.div>
                
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Badge 
                      variant={item.badgeVariant === 'warning' ? 'default' : item.badgeVariant === 'success' ? 'default' : 'destructive'}
                      className={cn(
                        "h-4 min-w-[16px] px-1 text-[9px] font-bold rounded-full ring-2 ring-background",
                        item.badgeVariant === 'warning' && 'bg-amber-500 hover:bg-amber-600 text-white border-transparent',
                        item.badgeVariant === 'success' && 'bg-emerald-500 hover:bg-emerald-600 text-white border-transparent'
                      )}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "relative z-10 text-[10px] font-medium",
                isActive && 'font-semibold'
              )}>
                {item.label}
              </span>

              {/* Indicateur actif (barre en bas) */}
              {isActive && (
                <motion.div
                  layoutId="vendorActiveIndicator"
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
