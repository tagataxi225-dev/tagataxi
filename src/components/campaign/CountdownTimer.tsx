import React from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetDate: Date | null;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate, className = '' }) => {
  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDate);

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <p className="text-destructive font-bold">Offre expirée</p>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <Clock className="h-5 w-5 text-primary animate-pulse" />
      <div className="flex gap-2">
        {days > 0 && (
          <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2">
            <span className="text-2xl font-bold text-primary">{days}</span>
            <span className="text-xs text-muted-foreground">jours</span>
          </div>
        )}
        <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2">
          <span className="text-2xl font-bold text-primary">{hours.toString().padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">h</span>
        </div>
        <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2">
          <span className="text-2xl font-bold text-primary">{minutes.toString().padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
        <div className="flex flex-col items-center bg-primary/10 rounded-lg px-3 py-2">
          <span className="text-2xl font-bold text-primary">{seconds.toString().padStart(2, '0')}</span>
          <span className="text-xs text-muted-foreground">s</span>
        </div>
      </div>
    </div>
  );
};
