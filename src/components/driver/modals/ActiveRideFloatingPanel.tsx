/**
 * 🎈 PHASE 3: Panel flottant pour course active
 * Draggable, réductible en pastille
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Badge as ProgressBadge } from '@/components/ui/badge';
import { QuickActionsBar } from '../QuickActionsBar';
import { Navigation, Minimize2, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ActiveRideFloatingPanelProps {
  order: any;
  onNavigate: () => void;
  onComplete: () => void;
}

export const ActiveRideFloatingPanel: React.FC<ActiveRideFloatingPanelProps> = ({
  order,
  onNavigate,
  onComplete
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) return null;

  return (
    <AnimatePresence>
      <motion.div
        drag
        dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
        dragElastic={0.1}
        className="fixed bottom-24 right-4 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        {isMinimized ? (
          // Version minimale - Pastille
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMinimized(false)}
            className="cursor-pointer"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg flex items-center justify-center">
                <Navigation className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white animate-pulse" />
              </div>
            </div>
          </motion.div>
        ) : (
          // Version complète - Panel
          <Card className="w-80 border-2 border-orange-500 shadow-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/40 dark:to-red-950/40">
            <CardContent className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  Course active
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsMinimized(true)}
                  >
                    <Minimize2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsClosed(true)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Progress Tracker - Simplified */}
              <div className="flex items-center justify-center gap-2">
                <ProgressBadge variant="outline" className="text-xs">
                  {order.status === 'picked_up' ? 'En cours' : 
                   order.status === 'completed' ? 'Terminé' :
                   order.status === 'driver_assigned' ? 'En route' : 'En attente'}
                </ProgressBadge>
              </div>

              {/* Infos client */}
              <div className="p-3 bg-background rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="text-sm font-bold">{order.customer_name || 'Client'}</p>
                  </div>
                  {order.customer_rating && (
                    <Badge variant="secondary">⭐ {order.customer_rating}</Badge>
                  )}
                </div>
              </div>

              {/* Actions Bar */}
              <QuickActionsBar
                onNavigate={onNavigate}
                onCall={order.customer_phone ? () => window.location.href = `tel:${order.customer_phone}` : undefined}
                onComplete={onComplete}
                customerPhone={order.customer_phone}
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
