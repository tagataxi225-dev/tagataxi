import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, AlertTriangle, DollarSign } from 'lucide-react';
import { usePriceEstimator } from '@/hooks/usePricingRules';

interface WaitingNotificationProps {
  rideRequest: {
    id: string;
    vehicle_class: string;
    driver_arrived_at?: string;
    status: string;
    estimated_price: number;
  };
}

export const WaitingNotification = ({ rideRequest }: WaitingNotificationProps) => {
  const [waitingTime, setWaitingTime] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const { rule } = usePriceEstimator('transport', rideRequest.vehicle_class);

  useEffect(() => {
    if (rideRequest.status === 'driver_arrived' && rideRequest.driver_arrived_at) {
      setIsVisible(true);
      const arrivalTime = new Date(rideRequest.driver_arrived_at);
      
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - arrivalTime.getTime()) / 1000);
        setWaitingTime(elapsed);
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setIsVisible(false);
      setWaitingTime(0);
    }
  }, [rideRequest.status, rideRequest.driver_arrived_at]);

  if (!isVisible || !rule) return null;

  const waitingMinutes = Math.floor(waitingTime / 60);
  const waitingSeconds = waitingTime % 60;
  const freeTimeMinutes = rule.free_waiting_time_minutes || 5;
  const feePerMinute = rule.waiting_fee_per_minute || 50;

  const billableMinutes = Math.max(0, waitingMinutes - freeTimeMinutes);
  const currentFee = billableMinutes * feePerMinute;
  const isInFreeTime = waitingMinutes < freeTimeMinutes;
  const isApproachingFee = waitingMinutes >= freeTimeMinutes - 1;

  const getCardColor = () => {
    if (!isInFreeTime) return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20';
    if (isApproachingFee) return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
    return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
  };

  const getIconColor = () => {
    if (!isInFreeTime) return 'text-orange-600 dark:text-orange-400';
    if (isApproachingFee) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getMessage = () => {
    if (!isInFreeTime) {
      return `Des frais d'attente de ${feePerMinute} CDF/min s'appliquent maintenant`;
    }
    if (isApproachingFee) {
      const remaining = freeTimeMinutes - waitingMinutes;
      return `Attention: ${remaining} minute${remaining > 1 ? 's' : ''} gratuite${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`;
    }
    return `Votre chauffeur vous attend (${freeTimeMinutes} minutes gratuites)`;
  };

  return (
    <Card className={`mx-4 my-2 ${getCardColor()}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {!isInFreeTime ? (
              <AlertTriangle className={`w-5 h-5 ${getIconColor()}`} />
            ) : (
              <Clock className={`w-5 h-5 ${getIconColor()}`} />
            )}
            <span className="font-medium">Chauffeur arrivé</span>
            <div className={`ml-auto text-lg font-mono font-bold ${getIconColor()}`}>
              {String(waitingMinutes).padStart(2, '0')}:{String(waitingSeconds).padStart(2, '0')}
            </div>
          </div>

          <p className="text-sm text-gray-700 dark:text-gray-300">
            {getMessage()}
          </p>

          {!isInFreeTime && (
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-sm">Prix initial:</span>
              <span className="font-medium">{rideRequest.estimated_price} CDF</span>
            </div>
          )}

          {currentFee > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Frais d'attente:</span>
              </div>
              <span className="font-bold text-orange-600 dark:text-orange-400">+{currentFee} CDF</span>
            </div>
          )}

          {currentFee > 0 && (
            <div className="flex items-center justify-between pt-1 border-t border-border font-bold">
              <span>Total:</span>
              <span className={getIconColor()}>{rideRequest.estimated_price + currentFee} CDF</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};