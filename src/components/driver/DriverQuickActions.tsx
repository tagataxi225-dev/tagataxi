import React from 'react';
import { TrendingUp, DollarSign, Navigation, Star, Trophy, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DriverQuickActionsProps {
  onNavigateToEarnings?: () => void;
  onNavigateToCredits?: () => void;
  isTracking?: boolean;
  onToggleTracking?: () => void;
  className?: string;
}

export const DriverQuickActions: React.FC<DriverQuickActionsProps> = ({
  onNavigateToEarnings,
  onNavigateToCredits,
  isTracking = false,
  onToggleTracking,
  className
}) => {
  const isMobile = useIsMobile();

  const actions = [
    {
      id: 'earnings',
      icon: TrendingUp,
      label: 'Gains',
      subtitle: 'Voir mes revenus',
      gradient: 'from-emerald-500 to-teal-600',
      shadowColor: 'shadow-emerald-500/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      onClick: onNavigateToEarnings,
      badge: '+ 12%'
    },
    {
      id: 'credits',
      icon: DollarSign,
      label: 'Crédits',
      subtitle: 'Gérer mon solde',
      gradient: 'from-blue-500 to-indigo-600',
      shadowColor: 'shadow-blue-500/20',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      onClick: onNavigateToCredits,
      badge: '2,450 CDF'
    },
    {
      id: 'tracking',
      icon: Navigation,
      label: isTracking ? 'Suivi actif' : 'Activer suivi',
      subtitle: isTracking ? 'Position transmise' : 'Démarrer localisation',
      gradient: isTracking ? 'from-green-500 to-emerald-600' : 'from-slate-500 to-gray-600',
      shadowColor: isTracking ? 'shadow-green-500/20' : 'shadow-slate-500/10',
      iconBg: isTracking ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-100 dark:bg-slate-800/30',
      iconColor: isTracking ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400',
      onClick: onToggleTracking,
      isActive: isTracking,
      pulse: isTracking
    }
  ];

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-br from-background/80 to-background/60 backdrop-blur-xl shadow-elegant",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl" />
      
      <div className="relative p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-primary/10 backdrop-blur-sm">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-heading-sm font-semibold text-card-foreground">
              Actions rapides
            </h3>
            <p className="text-body-xs text-muted-foreground">
              Accès direct à vos outils essentiels
            </p>
          </div>
        </div>

        <div className={cn(
          "grid gap-4",
          isMobile ? "grid-cols-1" : "grid-cols-3"
        )}>
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={cn(
                "group relative h-auto p-0 overflow-hidden transition-all duration-500 hover:scale-[1.02]",
                "bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border border-border/50",
                "hover:border-primary/30 hover:shadow-lg",
                action.shadowColor,
                action.isActive && "ring-2 ring-primary/30"
              )}
              onClick={action.onClick}
            >
              {/* Glassmorphism overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Animated background */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-all duration-500",
                action.gradient
              )} />

              <div className="relative flex items-center gap-4 p-4 w-full">
                {/* Icon container */}
                <div className={cn(
                  "relative flex-shrink-0 p-3 rounded-xl transition-all duration-300 group-hover:scale-110",
                  action.iconBg,
                  action.pulse && "animate-pulse"
                )}>
                  <action.icon className={cn(
                    "h-6 w-6 transition-all duration-300",
                    action.iconColor,
                    action.pulse && "drop-shadow-sm"
                  )} />
                  
                  {/* Pulse effect for active tracking */}
                  {action.pulse && (
                    <div className="absolute inset-0 rounded-xl bg-green-400/20 animate-ping" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={cn(
                      "font-semibold transition-colors duration-300",
                      isMobile ? "text-body-sm" : "text-body-md",
                      "text-card-foreground group-hover:text-primary"
                    )}>
                      {action.label}
                    </h4>
                    
                    {/* Badge */}
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  
                  <p className={cn(
                    "text-muted-foreground transition-colors duration-300 group-hover:text-muted-foreground/80",
                    isMobile ? "text-body-xs" : "text-body-sm"
                  )}>
                    {action.subtitle}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
                  <div className="w-2 h-2 border-r-2 border-t-2 border-primary/60 transform rotate-45" />
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              </div>
            </Button>
          ))}
        </div>

        {/* Bottom decoration */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </Card>
  );
};