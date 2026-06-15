import React from 'react';
import { LayoutDashboard, Store, ShoppingBag, User, Wallet, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
  badgeColor?: string;
}

interface VendorStats {
  activeProducts: number;
  pendingProducts: number;
  totalOrders: number;
  pendingOrders: number;
  escrowBalance: number;
  pendingEscrow: number;
}

interface VendorDesktopSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  stats: VendorStats;
}

const formatCompactCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

export const VendorDesktopSidebar: React.FC<VendorDesktopSidebarProps> = ({
  activeTab,
  onTabChange,
  stats
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Accueil' },
    { id: 'shop', icon: Store, label: 'Mes produits', badge: stats.pendingProducts, badgeColor: 'amber' },
    { id: 'orders', icon: ShoppingBag, label: 'Commandes', badge: stats.pendingOrders, badgeColor: 'red' },
    { id: 'finances', icon: Wallet, label: 'Finances', badge: stats.escrowBalance > 0 ? 1 : undefined, badgeColor: 'emerald' },
    { id: 'subscription', icon: CreditCard, label: 'Abonnement' },
    { id: 'profile', icon: User, label: 'Profil & Paramètres' },
  ];

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-card/50 backdrop-blur-sm overflow-y-auto">
      <nav className="space-y-2 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium flex-1 text-left">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge 
                  variant={isActive ? "secondary" : "default"}
                  className={cn(
                    "ml-auto",
                    !isActive && item.badgeColor === 'amber' && 'bg-amber-500 hover:bg-amber-600 text-white',
                    !isActive && item.badgeColor === 'red' && 'bg-red-500 hover:bg-red-600 text-white',
                    !isActive && item.badgeColor === 'emerald' && 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  )}
                >
                  {item.id === 'finances' && stats.escrowBalance > 0 
                    ? formatCompactCurrency(stats.escrowBalance)
                    : item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Quick Stats Card */}
      {stats.escrowBalance > 0 && (
        <div className="p-4 mt-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-600">Solde disponible</span>
            </div>
            <p className="text-lg font-bold">{formatCompactCurrency(stats.escrowBalance)} CDF</p>
            <button
              onClick={() => onTabChange('finances')}
              className="mt-2 text-xs text-emerald-600 hover:underline"
            >
              Retirer maintenant →
            </button>
          </motion.div>
        </div>
      )}
    </aside>
  );
};
