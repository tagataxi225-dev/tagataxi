/**
 * 🗺️ Sélecteur de zones de service avec carte interactive
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MapPin, TrendingUp, DollarSign, Navigation } from 'lucide-react';
import { useDriverServiceZones } from '@/hooks/useDriverServiceZones';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

export const ServiceZoneSelector: React.FC = () => {
  const { 
    zones, 
    activeZones, 
    suggestedZones, 
    driverCity,
    loading, 
    toggleZone 
  } = useDriverServiceZones();

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const getDemandColor = (level?: string) => {
    switch (level) {
      case 'high': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-gray-400';
      default: return 'text-muted-foreground';
    }
  };

  const getDemandLabel = (level?: string) => {
    switch (level) {
      case 'high': return 'Forte demande';
      case 'medium': return 'Demande moyenne';
      case 'low': return 'Faible demande';
      default: return 'Pas de données';
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Mes zones de service
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <span className="opacity-90">
              {activeZones.length} zone{activeZones.length > 1 ? 's' : ''} active{activeZones.length > 1 ? 's' : ''}
            </span>
            {driverCity && (
              <span className="opacity-90 flex items-center gap-1">
                <Navigation className="w-4 h-4" />
                {driverCity}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Zones suggérées */}
      {suggestedZones.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-yellow-600" />
              Zones recommandées
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedZones.map((zone) => (
              <div 
                key={zone.id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium text-foreground">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Forte demande • Opportunités disponibles
                  </p>
                </div>
                <Button 
                  size="sm"
                  onClick={() => toggleZone.mutate(zone.id)}
                  disabled={toggleZone.isPending}
                >
                  Activer
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Liste des zones */}
      <div className="space-y-3">
        {zones.map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={zone.active ? 'border-green-200 bg-green-50/30 dark:bg-green-950/20' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        zone.active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <h3 className="font-semibold text-foreground">{zone.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {zone.city}
                        </p>
                      </div>
                    </div>

                    {zone.active && zone.rides_count !== undefined && (
                      <div className="flex items-center gap-4 text-sm ml-6">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {zone.rides_count} courses
                          </span>
                        </div>
                        {zone.earnings !== undefined && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {zone.earnings.toLocaleString()} CDF
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!zone.active && zone.demand_level && (
                      <div className="ml-6">
                        <Badge 
                          variant="outline" 
                          className={getDemandColor(zone.demand_level)}
                        >
                          {getDemandLabel(zone.demand_level)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Switch
                    checked={zone.active}
                    onCheckedChange={() => toggleZone.mutate(zone.id)}
                    disabled={toggleZone.isPending}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
        <CardContent className="p-4">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡 <strong>Conseil:</strong> Activez les zones où vous êtes régulièrement disponible. 
            Plus vous couvrez de zones à forte demande, plus vous recevrez d'opportunités de courses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
