import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Package, CheckCircle2, Truck, User, Clock } from 'lucide-react';

interface StickyDeliveryProgressProps {
  orderId: string;
  currentStatus: string;
  progress: number;
  statusLabel: string;
  eta?: string;
}

const StickyDeliveryProgress: React.FC<StickyDeliveryProgressProps> = ({
  orderId,
  currentStatus,
  progress,
  statusLabel,
  eta
}) => {
  const steps = [
    { 
      key: 'confirmed', 
      label: 'Confirmée', 
      icon: CheckCircle2,
      statuses: ['confirmed', 'driver_assigned', 'picked_up', 'in_transit', 'delivered'] 
    },
    { 
      key: 'driver_assigned', 
      label: 'Assignée', 
      icon: User,
      statuses: ['driver_assigned', 'picked_up', 'in_transit', 'delivered'] 
    },
    { 
      key: 'picked_up', 
      label: 'Récupérée', 
      icon: Package,
      statuses: ['picked_up', 'in_transit', 'delivered'] 
    },
    { 
      key: 'in_transit', 
      label: 'En transit', 
      icon: Truck,
      statuses: ['in_transit', 'delivered'] 
    },
    { 
      key: 'delivered', 
      label: 'Livrée', 
      icon: CheckCircle2,
      statuses: ['delivered'] 
    }
  ];

  const getStepStatus = (step: any) => {
    if (step.statuses.includes(currentStatus)) return 'completed';
    if (currentStatus === step.key) return 'active';
    return 'pending';
  };

  const getStepColor = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-primary text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isActiveDelivery = ['driver_assigned', 'picked_up', 'in_transit'].includes(currentStatus);

  return (
    <div className="sticky top-16 z-20 bg-background/95 backdrop-blur-sm border-b border-border/20 p-4 mb-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{statusLabel}</h3>
              <p className="text-xs text-muted-foreground">Livraison #{orderId.slice(-8)}</p>
            </div>
          </div>
          <div className="text-right">
            {eta && isActiveDelivery && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>ETA: {eta}</span>
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              {progress}%
            </Badge>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mb-3">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Début</span>
            <span className="font-medium">{progress}%</span>
            <span>Livré</span>
          </div>
        </div>

        {/* Étapes horizontales */}
        <div className="flex items-center justify-between relative">
          {/* Ligne de connexion */}
          <div className="absolute top-3 left-0 right-0 h-0.5 bg-border -z-10" />
          
          {steps.map((step, index) => {
            const stepStatus = getStepStatus(step);
            const StepIcon = step.icon;
            
            return (
              <motion.div
                key={step.key}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  ${getStepColor(stepStatus)}
                  ${stepStatus === 'active' ? 'ring-2 ring-primary/30 animate-pulse' : ''}
                  transition-all duration-300
                `}>
                  <StepIcon className="h-3 w-3" />
                </div>
                <span className={`
                  text-xs mt-1 text-center min-w-0 max-w-16
                  ${stepStatus === 'active' ? 'text-primary font-medium' : 'text-muted-foreground'}
                `}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* Indicateur temps réel */}
        {isActiveDelivery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-3 p-2 bg-primary/5 rounded-md"
          >
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Suivi temps réel activé</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StickyDeliveryProgress;