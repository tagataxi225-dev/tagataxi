import { motion } from 'framer-motion';
import { Home, Users, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeliveryTab = 'dashboard' | 'drivers' | 'analytics' | 'settings';

interface PartnerDeliveryDesktopNavProps {
  activeTab: DeliveryTab;
  onTabChange: (tab: DeliveryTab) => void;
}

const tabs = [
  { id: 'dashboard' as DeliveryTab, label: 'Tableau de bord', icon: Home },
  { id: 'drivers' as DeliveryTab, label: 'Livreurs', icon: Users },
  { id: 'analytics' as DeliveryTab, label: 'Analytics', icon: Activity },
  { id: 'settings' as DeliveryTab, label: 'Paramètres', icon: Settings },
];

export const PartnerDeliveryDesktopNav = ({ activeTab, onTabChange }: PartnerDeliveryDesktopNavProps) => (
  <nav className="hidden lg:flex items-center gap-1 px-4 py-2 backdrop-blur-xl bg-background/80 border-b border-border/50">
    {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <motion.button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-muted/50',
            isActive && 'bg-orange-50 dark:bg-orange-950/20'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-orange-500' : 'text-muted-foreground')} />
          <span className={cn('text-sm font-medium transition-colors', isActive ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground')}>
            {tab.label}
          </span>
          {isActive && (
            <motion.div
              layoutId="deliveryActiveTab"
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>
      );
    })}
  </nav>
);
