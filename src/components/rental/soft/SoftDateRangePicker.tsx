import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, Sparkles } from 'lucide-react';
import { differenceInDays, addDays, addWeeks, startOfDay, endOfDay, format, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface SoftDateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
  bookedDates?: Date[];
  minDate?: Date;
}

export const SoftDateRangePicker = ({
  dateRange,
  onDateRangeChange,
  bookedDates = [],
  minDate = new Date()
}: SoftDateRangePickerProps) => {
  const [calendarOpen, setCalendarOpen] = useState(true);

  const presets = [
    { label: "Aujourd'hui", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: "Demain", getValue: () => ({ from: startOfDay(addDays(new Date(), 1)), to: endOfDay(addDays(new Date(), 1)) }) },
    { label: "Ce week-end", getValue: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      const saturday = addDays(today, daysUntilSaturday);
      const sunday = addDays(saturday, 1);
      return { from: startOfDay(saturday), to: endOfDay(sunday) };
    }},
    { label: "1 semaine", getValue: () => ({ from: startOfDay(new Date()), to: endOfDay(addWeeks(new Date(), 1)) }) },
  ];

  const isDateBooked = (date: Date) => {
    return bookedDates.some(bookedDate => 
      startOfDay(bookedDate).getTime() === startOfDay(date).getTime()
    );
  };

  const duration = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  return (
    <div className="space-y-4">
      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((preset, index) => (
          <motion.button
            key={preset.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onDateRangeChange(preset.getValue())}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              "border border-border/50 hover:border-primary/50",
              "bg-card hover:bg-primary/5 hover:shadow-sm",
              "flex items-center gap-2"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary/70" />
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Calendar */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card rounded-2xl border border-border/50 p-4 shadow-sm"
      >
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={1}
          locale={fr}
          disabled={(date) => 
            date < startOfDay(minDate) || isDateBooked(date)
          }
          modifiers={{
            booked: bookedDates
          }}
          modifiersStyles={{
            booked: {
              backgroundColor: 'hsl(var(--destructive) / 0.15)',
              color: 'hsl(var(--destructive))',
              textDecoration: 'line-through'
            }
          }}
          className="rounded-xl pointer-events-auto"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 justify-center",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-base font-semibold text-foreground",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100",
              "rounded-xl border border-border/50 hover:bg-muted transition-colors"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-10 font-medium text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: cn(
              "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
              "h-10 w-10"
            ),
            day: cn(
              "h-10 w-10 p-0 font-normal rounded-xl transition-all duration-200",
              "hover:bg-primary/10 hover:text-primary",
              "aria-selected:opacity-100"
            ),
            day_range_start: "day-range-start bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-l-xl",
            day_range_end: "day-range-end bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground rounded-r-xl",
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-semibold",
            day_outside: "day-outside text-muted-foreground opacity-50",
            day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
            day_range_middle: "aria-selected:bg-primary/15 aria-selected:text-foreground rounded-none",
            day_hidden: "invisible",
          }}
        />
      </motion.div>

      {/* Duration Display */}
      {dateRange?.from && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/5 to-emerald-500/5 rounded-2xl p-4 border border-primary/10"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Période sélectionnée</p>
                <p className="font-semibold text-foreground">
                  {format(dateRange.from, 'dd MMM', { locale: fr })}
                  {dateRange.to && ` → ${format(dateRange.to, 'dd MMM yyyy', { locale: fr })}`}
                </p>
              </div>
            </div>
            
            {duration > 0 && (
              <Badge 
                variant="secondary" 
                className="bg-primary/10 text-primary border-0 px-3 py-1.5 text-sm font-semibold"
              >
                <Clock className="w-3.5 h-3.5 mr-1.5" />
                {duration} jour{duration > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
