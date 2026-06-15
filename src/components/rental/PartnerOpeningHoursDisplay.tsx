import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface DayHours {
  open: string | null;
  close: string | null;
  is_closed: boolean;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

const dayLabels: Record<string, string> = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  saturday: 'Samedi',
  sunday: 'Dimanche',
};

const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface Props {
  openingHours?: OpeningHours | null;
  compact?: boolean;
}

export const PartnerOpeningHoursDisplay: React.FC<Props> = ({ openingHours, compact = false }) => {
  const currentStatus = useMemo(() => {
    if (!openingHours) return { isOpen: false, message: 'Horaires non disponibles' };

    const now = new Date();
    const dayIndex = now.getDay();
    // JavaScript: 0 = Sunday, 1 = Monday, etc.
    const dayKey = dayOrder[(dayIndex + 6) % 7] as keyof OpeningHours;
    const todayHours = openingHours[dayKey];

    if (todayHours.is_closed) {
      return { isOpen: false, message: 'Fermé aujourd\'hui' };
    }

    if (!todayHours.open || !todayHours.close) {
      return { isOpen: false, message: 'Horaires non définis' };
    }

    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpen = currentTime >= todayHours.open && currentTime < todayHours.close;

    if (isOpen) {
      return { 
        isOpen: true, 
        message: `Ouvert · Ferme à ${todayHours.close}` 
      };
    } else if (currentTime < todayHours.open) {
      return { 
        isOpen: false, 
        message: `Fermé · Ouvre à ${todayHours.open}` 
      };
    } else {
      return { 
        isOpen: false, 
        message: 'Fermé' 
      };
    }
  }, [openingHours]);

  if (!openingHours) {
    return null;
  }

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className={`gap-1.5 ${
          currentStatus.isOpen 
            ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
            : 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
        }`}
      >
        {currentStatus.isOpen ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <XCircle className="h-3 w-3" />
        )}
        {currentStatus.message}
      </Badge>
    );
  }

  return (
    <Card className="border-emerald-500/20 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500" />
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-500" />
            <h3 className="font-semibold">Horaires d'ouverture</h3>
          </div>
          <Badge 
            className={`${
              currentStatus.isOpen 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {currentStatus.isOpen ? 'Ouvert' : 'Fermé'}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {currentStatus.message}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {dayOrder.map((dayKey) => {
            const day = dayKey as keyof OpeningHours;
            const hours = openingHours[day];
            const now = new Date();
            const currentDayIndex = (now.getDay() + 6) % 7;
            const isToday = dayOrder[currentDayIndex] === dayKey;

            return (
              <div 
                key={day}
                className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                  isToday 
                    ? 'bg-emerald-500/10 border border-emerald-500/30' 
                    : 'bg-muted/30'
                }`}
              >
                <span className={`text-sm ${isToday ? 'font-semibold text-emerald-600 dark:text-emerald-400' : ''}`}>
                  {dayLabels[day]}
                </span>
                <span className={`text-sm ${hours.is_closed ? 'text-muted-foreground' : ''}`}>
                  {hours.is_closed ? 'Fermé' : `${hours.open} - ${hours.close}`}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PartnerOpeningHoursDisplay;
