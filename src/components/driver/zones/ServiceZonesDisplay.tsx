/**
 * 🗺️ Affichage compact des zones actives du chauffeur
 */

import React from 'react';
import { useDriverServiceZones } from '@/hooks/useDriverServiceZones';
import { Loader2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const ServiceZonesDisplay: React.FC = () => {
  const { activeZones, loading } = useDriverServiceZones();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!activeZones || activeZones.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">
          Aucune zone activée. Cliquez sur "Gérer mes zones" pour commencer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeZones.map((zone) => (
        <div 
          key={zone.id}
          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{zone.name}</span>
              {zone.demand_level === 'high' && (
                <Badge variant="default" className="gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Forte demande
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{zone.city}</p>
          </div>
          
          {zone.rides_count !== undefined && zone.rides_count > 0 && (
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">
                {zone.rides_count} courses
              </p>
              {zone.earnings !== undefined && zone.earnings > 0 && (
                <p className="text-xs text-muted-foreground">
                  {zone.earnings.toLocaleString()} CDF
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
