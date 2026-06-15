/**
 * 🎯 PHASE 1: Card prioritaire pour la course en cours avec bouton GPS géant
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Navigation, MapPin, CheckCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActiveRideHighlightProps {
  order: any;
  onNavigate: () => void;
  onComplete: () => void;
}

export const ActiveRideHighlight: React.FC<ActiveRideHighlightProps> = ({
  order,
  onNavigate,
  onComplete
}) => {
  const isPickedUp = order.status === 'picked_up' || order.status === 'in_progress';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Badge flottant animé */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10">
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg px-4 py-1 animate-pulse">
          Course en cours
        </Badge>
      </div>

      <Card className="border-4 border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 shadow-xl mt-4">
        <CardContent className="p-6 space-y-4">
          {/* Infos course */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {isPickedUp ? 'Destination' : 'Point de départ'}
                </p>
                <p className="text-sm font-bold">
                  {isPickedUp 
                    ? (order.destination || order.delivery_location) 
                    : order.pickup_location
                  }
                </p>
              </div>
            </div>

            {order.estimated_price && (
              <div className="flex items-center justify-between p-3 bg-green-100 dark:bg-green-950 rounded-lg">
                <span className="text-sm font-medium">Montant de la course</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {order.estimated_price?.toLocaleString()} CDF
                </span>
              </div>
            )}
          </div>

          {/* BOUTON GPS GÉANT - Priorité maximale */}
          <Button
            onClick={onNavigate}
            size="lg"
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          >
            <Navigation className="h-6 w-6 mr-3" />
            Lancer la Navigation GPS
          </Button>

          {/* Actions secondaires */}
          <div className="grid grid-cols-2 gap-2">
            {order.customer_phone && (
              <Button
                variant="outline"
                onClick={() => window.location.href = `tel:${order.customer_phone}`}
                className="border-2"
              >
                <Phone className="h-4 w-4 mr-2" />
                Appeler client
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onComplete}
              className="border-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              J'arrive
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
