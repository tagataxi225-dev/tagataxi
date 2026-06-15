import React from 'react';
import { Progress } from '@/components/ui/progress';

interface StickyProgressStepsProps {
  status: string;
  statusConfig: {
    label: string;
    color: string;
    icon: React.ComponentType<any>;
    description: string;
    progress: number;
  };
  bookingId: string;
}

const STEPS = [
  { key: 'pending',        label: 'Recherche de chauffeur',     done: ['pending','driver_assigned','driver_en_route','pickup','picked_up','in_progress','completed'] },
  { key: 'driver_assigned',label: 'Chauffeur assigné',          done: ['driver_assigned','driver_en_route','pickup','picked_up','in_progress','completed'] },
  { key: 'driver_en_route',label: 'Chauffeur en route',         done: ['driver_en_route','pickup','picked_up','in_progress','completed'] },
  { key: 'pickup',         label: 'Prise en charge',            done: ['pickup','picked_up','in_progress','completed'] },
  { key: 'in_progress',    label: 'En route vers destination',  done: ['in_progress','completed'] },
  { key: 'completed',      label: 'Course terminée',            done: ['completed'] },
];

const StickyProgressSteps: React.FC<StickyProgressStepsProps> = ({ status, statusConfig, bookingId }) => {
  const Icon = statusConfig.icon;

  return (
    <div className="px-4 pt-4 pb-3 border-b border-border/20 bg-background/95 backdrop-blur-sm">
      {/* Statut actuel */}
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="font-semibold text-sm leading-none">{statusConfig.label}</span>
        <span className="text-xs text-muted-foreground truncate">— {statusConfig.description}</span>
      </div>

      {/* Barre de progression */}
      <Progress value={statusConfig.progress} className="h-1.5 mb-4" />

      {/* Étapes verticales */}
      <div className="space-y-2">
        {STEPS.map((step) => {
          const isDone = step.done.includes(status);
          const isActive = status === step.key;
          return (
            <div key={step.key} className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300 ${
                isDone   ? 'bg-green-500' :
                isActive ? 'bg-primary animate-pulse' :
                           'bg-border'
              }`} />
              <span className={`text-xs ${
                isActive ? 'font-semibold text-foreground' :
                isDone   ? 'text-foreground' :
                           'text-muted-foreground'
              }`}>
                {step.label}
              </span>
              {isDone && <span className="text-[10px] text-green-500 ml-auto">✓</span>}
            </div>
          );
        })}
      </div>

      {/* BookingId discret */}
      <p className="text-[10px] text-muted-foreground/40 mt-3">#{bookingId}</p>
    </div>
  );
};

export default StickyProgressSteps;
