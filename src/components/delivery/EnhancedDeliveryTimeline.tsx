import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  User,
  Camera,
  Phone,
  MessageCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TimelineEntry {
  id: string;
  status: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  notes?: string;
  photo_url?: string;
  changed_by?: string;
  metadata?: any;
}

interface EnhancedDeliveryTimelineProps {
  orderId: string;
  currentStatus: string;
  timeline: TimelineEntry[];
  driverInfo?: {
    name: string;
    phone: string;
    vehicle: string;
    rating: number;
  };
  onContactDriver?: () => void;
  onViewMap?: () => void;
  onViewPhoto?: (url: string) => void;
}

const statusConfig = {
  pending: {
    label: 'En attente',
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
    description: 'Commande reçue et en cours de traitement'
  },
  confirmed: {
    label: 'Confirmée',
    icon: CheckCircle2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    description: 'Commande confirmée, recherche de chauffeur'
  },
  driver_assigned: {
    label: 'Chauffeur assigné',
    icon: User,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    description: 'Un chauffeur a été assigné'
  },
  picked_up: {
    label: 'Colis récupéré',
    icon: Package,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Le chauffeur a récupéré votre colis'
  },
  in_transit: {
    label: 'En cours de livraison',
    icon: Truck,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
    description: 'Votre colis est en route'
  },
  delivered: {
    label: 'Livré',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    description: 'Livraison terminée avec succès'
  },
  cancelled: {
    label: 'Annulé',
    icon: CheckCircle2,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    description: 'Commande annulée'
  }
};

export default function EnhancedDeliveryTimeline({
  orderId,
  currentStatus,
  timeline,
  driverInfo,
  onContactDriver,
  onViewMap,
  onViewPhoto
}: EnhancedDeliveryTimelineProps) {
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      time: date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: 'short' 
      })
    };
  };

  const isActiveStatus = (status: string) => {
    return status === currentStatus;
  };

  const isCompletedStatus = (status: string, index: number) => {
    const currentIndex = timeline.findIndex(entry => entry.status === currentStatus);
    return index <= currentIndex;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Suivi de livraison</h3>
        <Badge variant="outline">#{orderId.slice(-8)}</Badge>
      </div>

      {/* Driver Info Card */}
      {driverInfo && ['driver_assigned', 'picked_up', 'in_transit'].includes(currentStatus) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">{driverInfo.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {driverInfo.vehicle} • ⭐ {driverInfo.rating}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onContactDriver}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  {onViewMap && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={onViewMap}
                    >
                      <MapPin className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-border" />
        
        <div className="space-y-6">
          {timeline.map((entry, index) => {
            const config = statusConfig[entry.status as keyof typeof statusConfig];
            if (!config) return null;

            const IconComponent = config.icon;
            const isActive = isActiveStatus(entry.status);
            const isCompleted = isCompletedStatus(entry.status, index);
            const timestamp = formatTimestamp(entry.timestamp);

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative flex items-start gap-4"
              >
                {/* Timeline icon */}
                <div className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center
                  ${isCompleted ? config.bgColor : 'bg-muted'}
                  ${isActive ? 'ring-4 ring-primary/20' : ''}
                `}>
                  <IconComponent className={`
                    h-4 w-4 
                    ${isCompleted ? config.color : 'text-muted-foreground'}
                  `} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${isActive ? 'text-primary' : ''}`}>
                        {config.label}
                      </h4>
                      {isActive && (
                        <Badge variant="outline" className="text-xs">
                          En cours
                        </Badge>
                      )}
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>{timestamp.time}</div>
                      <div>{timestamp.date}</div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-3">
                    {config.description}
                  </p>

                  {/* Additional info */}
                  {entry.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{entry.location.address}</span>
                    </div>
                  )}

                  {entry.notes && (
                    <div className="p-3 bg-muted/50 rounded-lg text-sm mb-2">
                      <p>{entry.notes}</p>
                    </div>
                  )}

                  {entry.photo_url && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewPhoto?.(entry.photo_url!)}
                      >
                        <Camera className="h-3 w-3 mr-1" />
                        Voir la photo
                      </Button>
                    </div>
                  )}

                  {entry.changed_by && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Mis à jour par {entry.changed_by}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Real-time status indicator */}
      {['driver_assigned', 'picked_up', 'in_transit'].includes(currentStatus) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-lg"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Suivi en temps réel activé
          </span>
        </motion.div>
      )}
    </div>
  );
}