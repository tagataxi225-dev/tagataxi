import React, { Fragment } from 'react';
import { motion } from 'framer-motion';
import { Check, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProgressStep } from '@/hooks/useScratchProgress';

interface ProgressRoadProps {
  steps: ProgressStep[];
  actionsRemaining: number;
  percentage: number;
  className?: string;
}

export const ProgressRoad: React.FC<ProgressRoadProps> = ({
  steps,
  actionsRemaining,
  percentage,
  className
}) => {
  // Afficher 5 étapes maximum pour clarté visuelle
  const displayedSteps = steps.length <= 5 
    ? steps 
    : steps.filter((_, i) => i === 0 || i === steps.length - 1 || (i % 2 === 0 && i < steps.length - 1));

  return (
    <div className={cn("bg-muted/30 rounded-2xl p-4 mx-4", className)}>
      {/* Circuit horizontal */}
      <div className="flex items-center justify-between px-2">
        {displayedSteps.map((step, index) => {
          const isLast = index === displayedSteps.length - 1;
          const hasReward = step.reward === 'card';
          
          return (
            <Fragment key={step.position}>
              {/* Ligne connecteur */}
              {index > 0 && (
                <div 
                  className={cn(
                    "flex-1 h-0.5 mx-1 transition-colors duration-300",
                    step.completed ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              
              {/* Cercle étape */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300",
                  hasReward ? "w-12 h-12" : "w-10 h-10",
                  step.completed 
                    ? "bg-primary text-primary-foreground" 
                    : step.isCurrent 
                    ? "bg-primary/15 border-2 border-primary text-primary"
                    : "bg-background border-2 border-border text-muted-foreground"
                )}
              >
                {step.completed ? (
                  <Check className="w-5 h-5" />
                ) : hasReward ? (
                  <Ticket className="w-5 h-5" />
                ) : (
                  <span className="text-xs font-medium">
                    {Math.round(((step.position + 1) / steps.length) * 100)}
                  </span>
                )}
              </motion.div>
            </Fragment>
          );
        })}
        
        {/* Badge restantes */}
        <motion.div 
          initial={{ x: 10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="ml-3 bg-background shadow-sm rounded-full px-3 py-1.5 flex-shrink-0"
        >
          <span className="text-lg font-bold text-foreground">{actionsRemaining}</span>
          <span className="text-xs text-muted-foreground ml-1">rest.</span>
        </motion.div>
      </div>
      
      {/* Barre de progression */}
      <div className="mt-4">
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
          <span>0%</span>
          <span className="text-primary font-semibold">{Math.round(percentage)}%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};
