import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ChefHat, 
  BarChart3, 
  Wallet, 
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Store,
  Utensils,
  Calculator,
  Crown,
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

type RestaurantTab = 'dashboard' | 'orders' | 'menu' | 'analytics' | 'wallet' | 'profile' | 'subscription' | 'pos' | 'jobs';

interface RestaurantSidebarProps {
  currentTab: RestaurantTab;
  onTabChange: (tab: RestaurantTab) => void;
  restaurantName?: string;
  pendingOrders?: number;
}

export function RestaurantSidebar({ 
  currentTab, 
  onTabChange, 
  restaurantName = 'Mon Restaurant',
  pendingOrders = 0 
}: RestaurantSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuItems = [
    { 
      id: 'dashboard' as RestaurantTab, 
      label: 'Tableau de bord', 
      icon: LayoutDashboard,
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'orders' as RestaurantTab, 
      label: 'Commandes', 
      icon: ShoppingBag,
      badge: pendingOrders > 0 ? pendingOrders : undefined,
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'pos' as RestaurantTab, 
      label: 'Caisse', 
      icon: Calculator,
      color: 'from-emerald-500 to-teal-500',
      proBadge: true
    },
    { 
      id: 'menu' as RestaurantTab, 
      label: 'Menu', 
      icon: ChefHat,
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'analytics' as RestaurantTab, 
      label: 'Statistiques', 
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'wallet' as RestaurantTab, 
      label: 'Portefeuille', 
      icon: Wallet,
      color: 'from-yellow-500 to-orange-500'
    },
    { 
      id: 'subscription' as RestaurantTab, 
      label: 'Abonnement', 
      icon: CreditCard,
      color: 'from-indigo-500 to-purple-500'
    },
    { 
      id: 'jobs' as RestaurantTab, 
      label: 'Recrutement', 
      icon: Briefcase,
      color: 'from-cyan-500 to-blue-500'
    },
    { 
      id: 'profile' as RestaurantTab, 
      label: 'Profil', 
      icon: User,
      color: 'from-gray-500 to-slate-500'
    },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={cn(
        'hidden md:flex flex-col h-full border-r bg-card/50 backdrop-blur-sm',
        'relative overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <h2 className="font-bold text-foreground truncate">Tembea Food</h2>
                <p className="text-xs text-muted-foreground truncate">{restaurantName}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group',
                isActive 
                  ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 dark:text-orange-400' 
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-gradient-to-b from-orange-500 to-red-500"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className={cn(
                'p-1.5 rounded-lg transition-all',
                isActive 
                  ? `bg-gradient-to-br ${item.color} text-white shadow-md` 
                  : 'bg-muted group-hover:bg-muted-foreground/10'
              )}>
                <Icon className="h-4 w-4" />
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1 text-sm font-medium text-left"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Badge */}
              {item.badge && !collapsed && (
                <Badge 
                  variant="destructive" 
                  className="h-5 min-w-5 px-1.5 text-xs animate-pulse"
                >
                  {item.badge}
                </Badge>
              )}
              {item.badge && collapsed && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
              
              {/* Pro Badge */}
              {'proBadge' in item && item.proBadge && !collapsed && (
                <Badge 
                  variant="outline" 
                  className="h-5 px-1.5 text-[10px] border-orange-500/50 text-orange-600 bg-orange-500/10"
                >
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  Pro
                </Badge>
              )}
            </motion.button>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-3 space-y-2">
        {/* Bouton voir boutique */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('/food', '_blank')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all'
          )}
        >
          <div className="p-1.5 rounded-lg bg-muted">
            <Store className="h-4 w-4" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                Voir ma boutique
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Déconnexion */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
            'text-red-500 hover:bg-red-500/10 transition-all'
          )}
        >
          <div className="p-1.5 rounded-lg bg-red-500/10">
            <LogOut className="h-4 w-4" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-sm font-medium"
              >
                Déconnexion
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 transform -translate-y-1/2 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-muted z-10"
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </Button>
    </motion.aside>
  );
}
