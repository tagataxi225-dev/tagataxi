import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Navigation
} from 'lucide-react';
import { motion } from 'framer-motion';

interface TimelineStep {
  id: string;
  status: string;
  label: string;
  description?: string;
  timestamp?: string;
  completed: boolean;
  active: boolean;
  icon: React.ReactNode;
}

interface TrackingStatusTimelineProps {
  type: 'delivery' | 'taxi' | 'marketplace';
  currentStatus: string;
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    notes?: string;
  }>;
}

export default function TrackingStatusTimeline({ 
  type, 
  currentStatus, 
  statusHistory = [] 
}: TrackingStatusTimelineProps) {
  
  const getTimelineSteps = (): TimelineStep[] => {
    const baseSteps = {
      delivery: [
        {
          id: 'pending',
          status: 'pending',
          label: 'Commande reçue',
          description: 'Votre commande a été reçue',
          icon: <Package className="w-4 h-4" />
        },
        {
          id: 'confirmed',
          status: 'confirmed',
          label: 'Confirmée',
          description: 'Commande confirmée par le vendeur',
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          id: 'driver_assigned',
          status: 'driver_assigned',
          label: 'Chauffeur assigné',
          description: 'Un chauffeur a été assigné',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'picked_up',
          status: 'picked_up',
          label: 'Colis récupéré',
          description: 'Le colis a été récupéré',
          icon: <Truck className="w-4 h-4" />
        },
        {
          id: 'in_transit',
          status: 'in_transit',
          label: 'En livraison',
          description: 'Le colis est en route',
          icon: <Navigation className="w-4 h-4" />
        },
        {
          id: 'delivered',
          status: 'delivered',
          label: 'Livré',
          description: 'Colis livré avec succès',
          icon: <MapPin className="w-4 h-4" />
        }
      ],
      taxi: [
        {
          id: 'pending',
          status: 'pending',
          label: 'Réservation',
          description: 'Recherche d\'un chauffeur',
          icon: <Clock className="w-4 h-4" />
        },
        {
          id: 'confirmed',
          status: 'confirmed',
          label: 'Confirmée',
          description: 'Réservation confirmée',
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          id: 'driver_assigned',
          status: 'driver_assigned',
          label: 'Chauffeur assigné',
          description: 'Un chauffeur vous a été assigné',
          icon: <User className="w-4 h-4" />
        },
        {
          id: 'pickup',
          status: 'pickup',
          label: 'En route vers vous',
          description: 'Le chauffeur arrive',
          icon: <Navigation className="w-4 h-4" />
        },
        {
          id: 'in_progress',
          status: 'in_progress',
          label: 'En course',
          description: 'Trajet en cours',
          icon: <Truck className="w-4 h-4" />
        },
        {
          id: 'completed',
          status: 'completed',
          label: 'Terminé',
          description: 'Course terminée',
          icon: <MapPin className="w-4 h-4" />
        }
      ],
      marketplace: [
        {
          id: 'pending',
          status: 'pending',
          label: 'En attente',
          description: 'Commande en attente de confirmation',
          icon: <Clock className="w-4 h-4" />
        },
        {
          id: 'confirmed',
          status: 'confirmed',
          label: 'Confirmée',
          description: 'Commande confirmée par le vendeur',
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          id: 'preparing',
          status: 'preparing',
          label: 'En préparation',
          description: 'Le vendeur prépare votre commande',
          icon: <Package className="w-4 h-4" />
        },
        {
          id: 'ready',
          status: 'ready',
          label: 'Prêt',
          description: 'Commande prête',
          icon: <CheckCircle className="w-4 h-4" />
        },
        {
          id: 'shipped',
          status: 'shipped',
          label: 'Expédié',
          description: 'Commande expédiée',
          icon: <Truck className="w-4 h-4" />
        },
        {
          id: 'delivered',
          status: 'delivered',
          label: 'Livré',
          description: 'Commande livrée',
          icon: <MapPin className="w-4 h-4" />
        }
      ]
    };

    const steps = baseSteps[type] || [];
    const statusOrder = steps.map(s => s.status);
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => {
      const historyEntry = statusHistory.find(h => h.status === step.status);
      
      return {
        ...step,
        completed: index < currentIndex || step.status === currentStatus,
        active: step.status === currentStatus,
        timestamp: historyEntry?.timestamp
      };
    });
  };

  const steps = getTimelineSteps();

  const getStepVariant = (step: TimelineStep) => {
    if (step.active) return 'default';
    if (step.completed) return 'success';
    return 'secondary';
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return null;
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <h3 className="font-medium mb-4">Suivi détaillé</h3>
        
        <div className="space-y-4">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-start space-x-4"
            >
              {/* Icon */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                ${step.completed 
                  ? 'bg-green-100 text-green-600' 
                  : step.active 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }
              `}>
                {step.completed && !step.active ? (
                  <CheckCircle className="w-5 h-5" />
                ) : step.active ? (
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                ) : (
                  step.icon
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${
                    step.active ? 'text-primary' : 
                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </h4>
                  
                  {step.active && (
                    <Badge variant="default" className="ml-2">
                      En cours
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
                
                {step.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimestamp(step.timestamp)}
                  </p>
                )}
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="absolute left-9 mt-10 w-px h-8 bg-border" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Cancelled State */}
        {currentStatus === 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-4 bg-destructive/5 rounded-lg border border-destructive/20"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">Commande annulée</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Votre commande a été annulée. Si vous avez des questions, contactez le support.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}