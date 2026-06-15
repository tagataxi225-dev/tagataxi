import React from 'react';
import { Store, Package, DollarSign, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TouchOptimizedInterface } from '@/components/mobile/TouchOptimizedInterface';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { motion } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  icon: any;
  badge?: number;
}

interface MobileVendorTabsProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  confirmationCount?: number;
  notificationCount?: number;
  variant?: 'bottom' | 'horizontal';
  showLabels?: boolean;
}

export const MobileVendorTabs: React.FC<MobileVendorTabsProps> = ({
  currentTab,
  onTabChange,
  confirmationCount = 0,
  notificationCount = 0,
  variant = 'horizontal',
  showLabels = false
}) => {
  const tabs: TabItem[] = [
    {
      id: 'products',
      label: 'Produits',
      icon: Store,
    },
    {
      id: 'confirmations',
      label: 'Confirmations',
      icon: Package,
      badge: confirmationCount
    },
    {
      id: 'revenue',
      label: 'Revenus',
      icon: DollarSign
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: notificationCount
    }
  ];

  const handleTabChange = (tabId: string) => {
    try {
      onTabChange(tabId);
    } catch (error) {
      console.error('Error changing tab:', error);
    }
  };

  if (variant === 'bottom') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-2 py-2 z-50">
        <div className="flex justify-around max-w-lg mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                whileTap={{ scale: 0.95 }}
                className={`
                  relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl transition-all duration-300
                  backdrop-blur-lg border shadow-lg hover:shadow-xl
                  ${isActive 
                    ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 text-primary shadow-primary/20' 
                    : 'bg-background/80 border-border/50 text-muted-foreground hover:bg-background/90 hover:border-primary/20 hover:text-primary'
                  }`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                {showLabels && (
                  <span className={`text-xs font-medium ${isActive ? 'text-primary' : ''}`}>
                    {tab.label}
                  </span>
                )}
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <NotificationBadge count={tab.badge} variant="destructive" size="sm" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto scrollbar-hide bg-gradient-to-r from-background/95 to-background/90 backdrop-blur-sm px-4 py-3 gap-3 border-b border-border/50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        
        return (
          <TouchOptimizedInterface key={tab.id}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -1 }}
            >
              <Button
                variant="ghost"
                size={showLabels ? "sm" : "icon"}
                className={`
                  relative transition-all duration-300 backdrop-blur-lg border shadow-sm hover:shadow-md
                  ${showLabels ? 'whitespace-nowrap min-h-11 px-4' : 'h-11 w-11'}
                  ${isActive 
                    ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary/30 text-primary shadow-primary/20 hover:from-primary/25 hover:to-primary/15' 
                    : 'bg-background/60 border-border/40 text-muted-foreground hover:bg-background/80 hover:border-primary/20 hover:text-primary'
                  }
                `}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${showLabels ? 'mr-2' : ''} ${isActive ? 'scale-110' : ''}`} />
                {showLabels && (
                  <span className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                    {tab.label}
                  </span>
                )}
                {tab.badge && tab.badge > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1"
                  >
                    <NotificationBadge count={tab.badge} variant="destructive" size="sm" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          </TouchOptimizedInterface>
        );
      })}
    </div>
  );
};