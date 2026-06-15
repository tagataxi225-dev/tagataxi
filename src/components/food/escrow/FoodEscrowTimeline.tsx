import { cn } from '@/lib/utils';
import { 
  ShoppingBag, 
  Lock, 
  ChefHat, 
  Truck, 
  CheckCircle, 
  Wallet,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TimelineStep {
  id: string;
  label: string;
  icon: typeof ShoppingBag;
  timestamp?: string;
  completed: boolean;
  active: boolean;
  error?: boolean;
}

interface FoodEscrowTimelineProps {
  orderStatus: string;
  escrowStatus: 'pending' | 'held' | 'released' | 'disputed' | 'refunded';
  createdAt: string;
  confirmedAt?: string;
  preparedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  releasedAt?: string;
  className?: string;
  compact?: boolean;
}

export function FoodEscrowTimeline({
  orderStatus,
  escrowStatus,
  createdAt,
  confirmedAt,
  preparedAt,
  pickedUpAt,
  deliveredAt,
  releasedAt,
  className,
  compact = false
}: FoodEscrowTimelineProps) {
  const steps: TimelineStep[] = [
    {
      id: 'ordered',
      label: 'Commande créée',
      icon: ShoppingBag,
      timestamp: createdAt,
      completed: true,
      active: orderStatus === 'pending'
    },
    {
      id: 'escrow_held',
      label: 'Fonds sécurisés',
      icon: Lock,
      timestamp: createdAt,
      completed: escrowStatus !== 'pending',
      active: escrowStatus === 'held' && orderStatus === 'pending'
    },
    {
      id: 'preparing',
      label: 'En préparation',
      icon: ChefHat,
      timestamp: confirmedAt,
      completed: ['preparing', 'ready', 'picked_up', 'delivered'].includes(orderStatus),
      active: orderStatus === 'preparing'
    },
    {
      id: 'delivery',
      label: 'En livraison',
      icon: Truck,
      timestamp: pickedUpAt,
      completed: ['picked_up', 'delivered'].includes(orderStatus),
      active: orderStatus === 'picked_up'
    },
    {
      id: 'delivered',
      label: 'Livré',
      icon: CheckCircle,
      timestamp: deliveredAt,
      completed: orderStatus === 'delivered',
      active: orderStatus === 'delivered' && escrowStatus === 'held'
    },
    {
      id: 'payment_released',
      label: 'Paiement libéré',
      icon: Wallet,
      timestamp: releasedAt,
      completed: escrowStatus === 'released',
      active: false,
      error: escrowStatus === 'disputed'
    }
  ];

  // If disputed, add visual indicator
  if (escrowStatus === 'disputed') {
    const disputeStep = steps.find(s => s.id === 'payment_released');
    if (disputeStep) {
      disputeStep.label = 'Litige en cours';
      disputeStep.icon = AlertTriangle;
      disputeStep.error = true;
    }
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="flex items-center">
              <div className={cn(
                "p-1 rounded-full transition-colors",
                step.completed && "bg-green-100 dark:bg-green-900/30",
                step.active && "bg-primary/20 animate-pulse",
                step.error && "bg-destructive/20",
                !step.completed && !step.active && !step.error && "bg-muted"
              )}>
                <Icon className={cn(
                  "h-3 w-3",
                  step.completed && "text-green-600 dark:text-green-400",
                  step.active && "text-primary",
                  step.error && "text-destructive",
                  !step.completed && !step.active && !step.error && "text-muted-foreground"
                )} />
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-4 h-0.5 mx-0.5",
                  step.completed ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isLast = index === steps.length - 1;
        
        return (
          <div key={step.id} className="flex gap-3">
            {/* Vertical line and icon */}
            <div className="flex flex-col items-center">
              <div className={cn(
                "p-2 rounded-full border-2 transition-all",
                step.completed && "bg-green-100 dark:bg-green-900/30 border-green-500",
                step.active && "bg-primary/20 border-primary animate-pulse",
                step.error && "bg-destructive/20 border-destructive",
                !step.completed && !step.active && !step.error && "bg-muted border-muted-foreground/30"
              )}>
                <Icon className={cn(
                  "h-4 w-4",
                  step.completed && "text-green-600 dark:text-green-400",
                  step.active && "text-primary",
                  step.error && "text-destructive",
                  !step.completed && !step.active && !step.error && "text-muted-foreground"
                )} />
              </div>
              {!isLast && (
                <div className={cn(
                  "w-0.5 h-8 my-1",
                  step.completed ? "bg-green-500" : "bg-muted"
                )} />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "font-medium text-sm",
                  step.completed && "text-foreground",
                  step.active && "text-primary",
                  step.error && "text-destructive",
                  !step.completed && !step.active && !step.error && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {step.timestamp && step.completed && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(step.timestamp), 'HH:mm', { locale: fr })}
                  </span>
                )}
              </div>
              {step.active && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  En cours...
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
