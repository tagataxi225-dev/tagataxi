import React from 'react';
import { Car, BarChart3, UserPlus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ResponsiveQuickActionsProps {
  onViewChange: (view: string) => void;
}

export const ResponsiveQuickActions: React.FC<ResponsiveQuickActionsProps> = ({
  onViewChange
}) => {
  const isMobile = useIsMobile();

  const mainActions = [
    {
      id: 'fleet',
      icon: Car,
      label: 'Gérer flotte',
      variant: 'default' as const,
      className: 'bg-gradient-primary shadow-elegant hover:shadow-glow'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics',
      variant: 'outline' as const,
      className: 'border-grey-200 hover:border-primary hover:bg-primary-light'
    }
  ];

  const secondaryActions = [
    {
      id: 'employees',
      icon: UserPlus,
      label: 'Employés',
      variant: 'outline' as const,
      className: 'border-grey-200 hover:border-secondary hover:bg-secondary-light'
    },
    {
      id: 'credits',
      icon: Wallet,
      label: 'Crédits',
      variant: 'outline' as const,
      className: 'border-grey-200 hover:border-accent hover:bg-accent-light'
    }
  ];

  return (
    <div className="mb-6">
      <h2 className={`text-card-foreground mb-4 ${isMobile ? 'text-lg' : 'text-heading-lg'}`}>
        Actions rapides
      </h2>
      
      {/* Main Actions */}
      <div className={`grid gap-4 mb-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {mainActions.map((action) => (
          <Button 
            key={action.id}
            variant={action.variant}
            className={`flex-col gap-3 rounded-xl transition-all duration-300 ${isMobile ? 'h-16' : 'h-20'} ${action.className}`}
            onClick={() => onViewChange(action.id)}
          >
            <action.icon className={isMobile ? 'h-5 w-5' : 'h-6 w-6'} />
            <span className={`font-semibold ${isMobile ? 'text-sm' : 'text-body-md'}`}>
              {action.label}
            </span>
          </Button>
        ))}
      </div>
      
      {/* Secondary Actions */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2' : 'grid-cols-2'}`}>
        {secondaryActions.map((action) => (
          <Button 
            key={action.id}
            variant={action.variant}
            className={`flex-col gap-2 rounded-xl transition-all duration-300 ${isMobile ? 'h-14' : 'h-16'} ${action.className}`}
            onClick={() => onViewChange(action.id)}
          >
            <action.icon className={isMobile ? 'h-4 w-4' : 'h-5 w-5'} />
            <span className={`font-semibold ${isMobile ? 'text-xs' : 'text-body-sm'}`}>
              {action.label}
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};