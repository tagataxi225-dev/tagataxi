import { motion } from 'framer-motion';
import { Home, Users, Car, Building2, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

type AutoTab = 'dashboard' | 'drivers' | 'fleet' | 'analytics' | 'settings';

interface PartnerAutoDesktopNavProps {
  activeTab: AutoTab;
  onTabChange: (tab: AutoTab) => void;
}

const tabs = [
  { id: 'dashboard' as AutoTab, label: 'Tableau de bord', icon: Home },
  { id: 'drivers' as AutoTab, label: 'Chauffeurs', icon: Users },
  { id: 'fleet' as AutoTab, label: 'Location', icon: Building2 },
  { id: 'analytics' as AutoTab, label: 'Analytics', icon: Activity },
  { id: 'settings' as AutoTab, label: 'Paramètres', icon: Settings },
];

export const PartnerAutoDesktopNav = ({ activeTab, onTabChange }: PartnerAutoDesktopNavProps) => (
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
            isActive && 'bg-blue-50 dark:bg-blue-950/20'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Icon className={cn('w-4 h-4 transition-colors', isActive ? 'text-blue-600' : 'text-muted-foreground')} />
          <span className={cn('text-sm font-medium transition-colors', isActive ? 'text-blue-700 dark:text-blue-400' : 'text-muted-foreground')}>
            {tab.label}
          </span>
          {isActive && (
            <motion.div
              layoutId="autoActiveTab"
              className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-t-full"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
        </motion.button>
      );
    })}
  </nav>
);
