/**
 * 🔄 PHASE 1: Card de statut minimaliste et repliable
 */

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDriverStatus } from '@/hooks/useDriverStatus';
import { useDriverDispatch } from '@/hooks/useDriverDispatch';
import { ChevronDown, ChevronUp, Wifi, WifiOff } from 'lucide-react';
import DriverStatusToggle from './DriverStatusToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CompactStatusCardProps {
  serviceType: 'taxi' | 'delivery';
}

export const CompactStatusCard: React.FC<CompactStatusCardProps> = ({ serviceType }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { status: driverStatus } = useDriverStatus();
  const { activeOrders } = useDriverDispatch();

  const getStatusBadge = () => {
    if (!driverStatus.isOnline) {
      return (
        <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">
          <WifiOff className="h-3 w-3 mr-1" />
          Hors ligne
        </Badge>
      );
    }
    
    if (activeOrders.length > 0) {
      return (
        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
          <div className="w-2 h-2 rounded-full bg-white mr-1.5 animate-pulse"></div>
          En course ({activeOrders.length})
        </Badge>
      );
    }
    
    if (driverStatus.isAvailable) {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
          <Wifi className="h-3 w-3 mr-1" />
          Disponible
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-600 bg-yellow-50">
        Occupé
      </Badge>
    );
  };

  return (
    <Card className={cn(
      "border-border/50 transition-all duration-300",
      driverStatus.isOnline && "border-l-4",
      driverStatus.isOnline && activeOrders.length > 0 && "border-l-orange-500",
      driverStatus.isOnline && activeOrders.length === 0 && driverStatus.isAvailable && "border-l-green-500"
    )}>
      <CardContent className="p-4">
        {/* Compact View */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-3 h-3 rounded-full",
              !driverStatus.isOnline && "bg-gray-400",
              driverStatus.isOnline && activeOrders.length > 0 && "bg-orange-500 animate-pulse",
              driverStatus.isOnline && activeOrders.length === 0 && driverStatus.isAvailable && "bg-green-500 animate-pulse"
            )} />
            {getStatusBadge()}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expanded View - Animé */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/50">
                <DriverStatusToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};
