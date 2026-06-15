import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, User } from 'lucide-react';
import { usePriceEstimator } from '@/hooks/usePricingRules';

interface WaitingTimerProps {
  rideRequest: {
    id: string;
    vehicle_class: string;
    driver_arrived_at?: string;
    status: string;
  };
  onCustomerBoarded: () => void;
}

export const WaitingTimer = ({ rideRequest, onCustomerBoarded }: WaitingTimerProps) => {
  const [waitingTime, setWaitingTime] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const { rule } = usePriceEstimator('transport', rideRequest.vehicle_class);

  useEffect(() => {
    if (rideRequest.status === 'driver_arrived' && rideRequest.driver_arrived_at) {
      setIsActive(true);
      const arrivalTime = new Date(rideRequest.driver_arrived_at);
      
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - arrivalTime.getTime()) / 1000);
        setWaitingTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsActive(false);
      setWaitingTime(0);
    }
  }, [rideRequest.status, rideRequest.driver_arrived_at]);

  if (!isActive || !rule) return null;

  const waitingMinutes = Math.floor(waitingTime / 60);
  const waitingSeconds = waitingTime % 60;
  const freeTimeMinutes = rule.free_waiting_time_minutes || 5;
  const feePerMinute = rule.waiting_fee_per_minute || 50;
  const maxWaitingTime = rule.max_waiting_time_minutes || 15;

  const billableMinutes = Math.max(0, waitingMinutes - freeTimeMinutes);
  const currentFee = billableMinutes * feePerMinute;
  const isInFreeTime = waitingMinutes < freeTimeMinutes;
  const isOverMaxTime = waitingMinutes >= maxWaitingTime;

  const getStatusColor = () => {
    if (isOverMaxTime) return 'text-red-600 dark:text-red-400';
    if (isInFreeTime) return 'text-green-600 dark:text-green-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  const getStatusMessage = () => {
    if (isOverMaxTime) return 'Temps maximum dépassé - Annulation possible';
    if (isInFreeTime) return `Temps gratuit (${freeTimeMinutes - waitingMinutes} min restantes)`;
    return 'Frais d\'attente en cours';
  };

  return (
    <Card className="mx-4 my-2">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="font-medium">Temps d'attente</span>
            </div>
            <div className={`text-lg font-mono font-bold ${getStatusColor()}`}>
              {String(waitingMinutes).padStart(2, '0')}:{String(waitingSeconds).padStart(2, '0')}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {getStatusMessage()}
          </div>

          {!isInFreeTime && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Frais accumulés: <strong>{currentFee} CDF</strong></span>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <Button 
              onClick={onCustomerBoarded}
              className="w-full"
              variant={isOverMaxTime ? "destructive" : "default"}
            >
              <User className="w-4 h-4 mr-2" />
              {isOverMaxTime ? 'Annuler la course' : 'Client monté à bord'}
            </Button>
          </div>

          {isOverMaxTime && (
            <p className="text-xs text-red-600 dark:text-red-400 text-center">
              Le temps d'attente maximum a été dépassé. Vous pouvez annuler la course.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};