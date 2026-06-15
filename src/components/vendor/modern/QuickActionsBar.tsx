import React from 'react';
import { LucideIcon, Store, Package, DollarSign, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface ActionItem {
  icon: LucideIcon;
  count: number;
  highlight?: boolean;
  onClick?: () => void;
}

interface QuickActionsBarProps {
  shopCount?: number;
  packageCount?: number;
  earningsCount?: number;
  notificationCount?: number;
  onNotificationClick?: () => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({
  shopCount = 0,
  packageCount = 0,
  earningsCount = 0,
  notificationCount = 0,
  onNotificationClick
}) => {
  const actions: ActionItem[] = [
    { icon: Store, count: shopCount },
    { icon: Package, count: packageCount },
    { icon: DollarSign, count: earningsCount },
    { icon: Bell, count: notificationCount, highlight: notificationCount > 0, onClick: onNotificationClick },
  ];

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.button
            key={index}
            onClick={action.onClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`relative flex flex-col items-center gap-1 p-3 rounded-xl transition-colors ${
              action.highlight 
                ? 'bg-primary/10 text-primary' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Icon className={`h-5 w-5 ${action.highlight && action.count > 0 ? 'animate-pulse' : ''}`} />
            <Badge 
              variant={action.highlight && action.count > 0 ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {action.count}
            </Badge>
          </motion.button>
        );
      })}
    </div>
  );
};
