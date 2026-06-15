import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ContextualAlertProps {
  icon: LucideIcon;
  iconColor: 'red' | 'green' | 'orange' | 'blue';
  title: string;
  message: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconColorClasses = {
  red: 'text-red-500 bg-red-50',
  green: 'text-green-500 bg-green-50',
  orange: 'text-orange-500 bg-orange-50',
  blue: 'text-blue-500 bg-blue-50',
};

export const ContextualAlert: React.FC<ContextualAlertProps> = ({
  icon: Icon,
  iconColor,
  title,
  message,
  description,
  action
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-50/50">
        <div className="flex gap-3">
          <div className={`h-10 w-10 rounded-lg ${iconColorClasses[iconColor]} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
            
            {action && (
              <Button
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="mt-2"
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
